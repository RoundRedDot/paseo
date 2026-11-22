import type pino from "pino";
import type {
  ProviderTextCancelRequestMessage,
  ProviderTextCapabilityGetRequestMessage,
  ProviderTextListRequestMessage,
  ProviderTextGenerateRequestMessage,
  ProviderTextGenerationError,
  SessionOutboundMessage,
} from "@getpaseo/protocol/messages";
import type { AgentManager } from "../../agent/agent-manager.js";
import { TextGenerationError, type AgentTextGeneration } from "../../agent/text-generation.js";

export const PROVIDER_TEXT_DEFAULT_TIMEOUT_MS = 60_000;
export const PROVIDER_TEXT_MAX_TIMEOUT_MS = 300_000;
const CAPABILITY_TIMEOUT_MS = 30_000;
/**
 * The prompt's UTF-8 size, checked before anything runs. The WebSocket frame limit is far
 * larger; this keeps one request's copies (body, credential-bearing POST) bounded.
 */
export const PROVIDER_TEXT_MAX_PROMPT_BYTES = 1024 * 1024;
/** Generations one socket may have running at once; more are refused before anything runs. */
export const PROVIDER_TEXT_MAX_IN_FLIGHT_PER_SOURCE = 4;

/** Who sent a request: its socket, and the signal that aborts when that socket detaches. */
export interface ProviderTextRequestSource {
  source: object | undefined;
  signal: AbortSignal;
}

export interface ProviderTextSessionOptions {
  emit(msg: SessionOutboundMessage): void;
  getTextGeneration: AgentManager["getTextGeneration"];
  /** Every registered provider and its label, from the registry alone: nothing is checked or warmed. */
  listRegisteredProviders(): Array<{ provider: string; label: string }>;
  /** This daemon's server ID; a generate request naming another is refused before anything runs. */
  serverId: string | undefined;
  logger: pino.Logger;
}

/**
 * `provider.text.*`: one-shot provider text generation for the requesting connection. The prompt
 * stays on this daemon and its selected provider runtime. Nothing here logs prompt or result text.
 */
export class ProviderTextSession {
  // Keyed by requesting socket: several sockets can share one session, and only the socket that
  // sent a request may cancel it.
  private readonly inFlight = new Map<object, Map<string, AbortController>>();
  private readonly anonymousSource = {};
  private readonly lifetime = new AbortController();

  constructor(private readonly options: ProviderTextSessionOptions) {}

  /** The enabled providers with a one-shot route. No runtime is checked, started or warmed. */
  handleList(msg: ProviderTextListRequestMessage): void {
    const providers = this.options
      .listRegisteredProviders()
      .filter((entry) => this.options.getTextGeneration(entry.provider).status === "ok");
    this.options.emit({
      type: "provider.text.list.response",
      payload: { requestId: msg.requestId, serverId: this.options.serverId ?? null, providers },
    });
  }

  async handleGetCapability(msg: ProviderTextCapabilityGetRequestMessage): Promise<void> {
    const base = {
      requestId: msg.requestId,
      provider: msg.provider,
      serverId: this.options.serverId ?? null,
    };
    const resolved = this.resolve(msg.provider);
    if ("error" in resolved) {
      this.options.emit({
        type: "provider.text.get_capability.response",
        payload: { ...base, ...unsupported(), error: resolved.error },
      });
      return;
    }
    const signal = AbortSignal.any([
      this.lifetime.signal,
      AbortSignal.timeout(CAPABILITY_TIMEOUT_MS),
    ]);
    try {
      const capability = await resolved.textGeneration.getCapability({ signal });
      this.options.emit({
        type: "provider.text.get_capability.response",
        payload: {
          ...base,
          supported: true,
          runtimeVersion: capability.runtimeVersion,
          models: capability.models,
          limitations: capability.limitations,
          error: null,
        },
      });
    } catch (error) {
      this.options.emit({
        type: "provider.text.get_capability.response",
        payload: { ...base, ...unsupported(), error: toWireError(error, "no") },
      });
    }
  }

  async handleGenerate(
    msg: ProviderTextGenerateRequestMessage,
    origin: ProviderTextRequestSource,
  ): Promise<void> {
    const base = {
      requestId: msg.requestId,
      provider: msg.provider,
      serverId: this.options.serverId ?? null,
    };
    const fail = (error: ProviderTextGenerationError) =>
      this.options.emit({
        type: "provider.text.generate.response",
        payload: { ...base, result: { status: "error", error } },
      });
    if (!this.options.serverId || msg.serverId !== this.options.serverId) {
      fail({
        code: "server_mismatch",
        message: "The request names a different host than the one that received it",
        promptSent: "no",
      });
      return;
    }
    if (Buffer.byteLength(msg.prompt, "utf8") > PROVIDER_TEXT_MAX_PROMPT_BYTES) {
      fail({
        code: "invalid_request",
        message: `The prompt is larger than ${PROVIDER_TEXT_MAX_PROMPT_BYTES} bytes`,
        promptSent: "no",
      });
      return;
    }
    const key = origin.source ?? this.anonymousSource;
    const owned = this.inFlight.get(key) ?? new Map<string, AbortController>();
    if (owned.has(msg.requestId)) {
      fail({ code: "invalid_request", message: "Duplicate request ID", promptSent: "no" });
      return;
    }
    if (owned.size >= PROVIDER_TEXT_MAX_IN_FLIGHT_PER_SOURCE) {
      fail({
        code: "invalid_request",
        message: `This connection already has ${PROVIDER_TEXT_MAX_IN_FLIGHT_PER_SOURCE} one-shot text generations running`,
        promptSent: "no",
      });
      return;
    }
    const resolved = this.resolve(msg.provider);
    if ("error" in resolved) {
      fail(resolved.error);
      return;
    }
    const timeoutMs = Math.min(
      msg.timeoutMs ?? PROVIDER_TEXT_DEFAULT_TIMEOUT_MS,
      PROVIDER_TEXT_MAX_TIMEOUT_MS,
    );
    const cancel = new AbortController();
    owned.set(msg.requestId, cancel);
    this.inFlight.set(key, owned);
    const signal = AbortSignal.any([
      cancel.signal,
      origin.signal,
      this.lifetime.signal,
      AbortSignal.timeout(timeoutMs),
    ]);
    try {
      const result = await resolved.textGeneration.generate({
        model: msg.model,
        ...(msg.thinkingOptionId !== undefined ? { thinkingOptionId: msg.thinkingOptionId } : {}),
        prompt: msg.prompt,
        signal,
      });
      this.options.emit({
        type: "provider.text.generate.response",
        payload: { ...base, result: { status: "ok", ...result } },
      });
    } catch (error) {
      const wire = toWireError(error, "possibly");
      this.options.logger.warn(
        { provider: msg.provider, model: msg.model, code: wire.code, promptSent: wire.promptSent },
        "Provider text generation failed",
      );
      fail(wire);
    } finally {
      owned.delete(msg.requestId);
      if (owned.size === 0 && this.inFlight.get(key) === owned) this.inFlight.delete(key);
    }
  }

  handleCancel(msg: ProviderTextCancelRequestMessage, source: object | undefined): void {
    const target = this.inFlight.get(source ?? this.anonymousSource)?.get(msg.targetRequestId);
    target?.abort();
    this.options.emit({
      type: "provider.text.cancel.response",
      payload: {
        requestId: msg.requestId,
        targetRequestId: msg.targetRequestId,
        cancelled: Boolean(target),
      },
    });
  }

  dispose(): void {
    this.lifetime.abort();
    this.inFlight.clear();
  }

  private resolve(
    provider: string,
  ): { textGeneration: AgentTextGeneration } | { error: ProviderTextGenerationError } {
    const resolved = this.options.getTextGeneration(provider);
    if (resolved.status === "ok") return { textGeneration: resolved.textGeneration };
    if (resolved.status === "isolation_unverified") {
      return {
        error: {
          code: "isolation_unverified",
          message:
            "Claude Code can load managed hooks during a request, so Paseo cannot isolate the prompt",
          promptSent: "no",
        },
      };
    }
    const messages = {
      disabled: `Provider "${provider}" is disabled`,
      unavailable: `Provider "${provider}" is not available on this host`,
      unsupported: `Provider "${provider}" has no verified one-shot text route`,
    } as const;
    return {
      error: {
        code: resolved.status === "unsupported" ? "unsupported" : "provider_unavailable",
        message: messages[resolved.status],
        promptSent: "no",
      },
    };
  }
}

function unsupported() {
  return { supported: false, runtimeVersion: null, models: [], limitations: [] };
}

/** Unknown failures keep the conservative delivery claim the caller passes. */
function toWireError(
  error: unknown,
  unknownDelivery: "no" | "possibly",
): ProviderTextGenerationError {
  if (error instanceof TextGenerationError)
    return { code: error.code, message: error.message, promptSent: error.promptSent };
  return {
    code: "generation_failed",
    message: "One-shot text generation failed",
    promptSent: unknownDelivery,
  };
}
