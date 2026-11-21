import type pino from "pino";
import type {
  ProviderTextCancelRequestMessage,
  ProviderTextCapabilityGetRequestMessage,
  ProviderTextGenerateRequestMessage,
  ProviderTextGenerationError,
  SessionOutboundMessage,
} from "@getpaseo/protocol/messages";
import type { AgentManager } from "../../agent/agent-manager.js";
import { TextGenerationError, type AgentTextGeneration } from "../../agent/text-generation.js";

export const PROVIDER_TEXT_DEFAULT_TIMEOUT_MS = 60_000;
export const PROVIDER_TEXT_MAX_TIMEOUT_MS = 300_000;
const CAPABILITY_TIMEOUT_MS = 30_000;

export interface ProviderTextSessionOptions {
  emit(msg: SessionOutboundMessage): void;
  getTextGeneration: AgentManager["getTextGeneration"];
  /** This daemon's server ID; a generate request naming another is refused before anything runs. */
  serverId: string | undefined;
  logger: pino.Logger;
}

/**
 * `provider.text.*`: one-shot provider text generation for the requesting connection. The prompt
 * stays on this daemon and its selected provider runtime. Nothing here logs prompt or result text.
 */
export class ProviderTextSession {
  private readonly inFlight = new Map<string, AbortController>();
  private readonly lifetime = new AbortController();

  constructor(private readonly options: ProviderTextSessionOptions) {}

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

  async handleGenerate(msg: ProviderTextGenerateRequestMessage): Promise<void> {
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
    if (this.inFlight.has(msg.requestId)) {
      fail({ code: "invalid_request", message: "Duplicate request ID", promptSent: "no" });
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
    this.inFlight.set(msg.requestId, cancel);
    const signal = AbortSignal.any([
      cancel.signal,
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
      this.inFlight.delete(msg.requestId);
    }
  }

  handleCancel(msg: ProviderTextCancelRequestMessage): void {
    const target = this.inFlight.get(msg.targetRequestId);
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
