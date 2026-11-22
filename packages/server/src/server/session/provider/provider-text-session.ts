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
/** Generations one socket may have running at once. */
export const PROVIDER_TEXT_MAX_IN_FLIGHT_PER_SOURCE = 4;
export const PROVIDER_TEXT_MAX_QUEUED_PER_SOURCE = 8;

interface TextRequestQueue {
  running: number;
  requests: Map<string, AbortController>;
  waiting: Set<() => void>;
}

function acquireTextSlot(queue: TextRequestQueue, signal: AbortSignal): boolean | Promise<boolean> {
  if (signal.aborted) return false;
  if (queue.running < PROVIDER_TEXT_MAX_IN_FLIGHT_PER_SOURCE) {
    queue.running++;
    return true;
  }
  return new Promise((resolve) => {
    const cancel = () => {
      queue.waiting.delete(start);
      resolve(false);
    };
    const start = () => {
      queue.waiting.delete(start);
      signal.removeEventListener("abort", cancel);
      queue.running++;
      resolve(true);
    };
    queue.waiting.add(start);
    signal.addEventListener("abort", cancel, { once: true });
  });
}

function beforeStartAbort(signal: AbortSignal): ProviderTextGenerationError {
  const timedOut = signal.reason instanceof Error && signal.reason.name === "TimeoutError";
  return {
    code: timedOut ? "timeout" : "cancelled",
    message: timedOut
      ? "One-shot text generation timed out before it started"
      : "One-shot text generation was cancelled before it started",
    promptSent: "no",
  };
}

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
  private readonly queues = new Map<object, TextRequestQueue>();
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
    const queue: TextRequestQueue = this.queues.get(key) ?? {
      running: 0,
      requests: new Map(),
      waiting: new Set(),
    };
    if (queue.requests.has(msg.requestId)) {
      fail({ code: "invalid_request", message: "Duplicate request ID", promptSent: "no" });
      return;
    }
    if (queue.waiting.size >= PROVIDER_TEXT_MAX_QUEUED_PER_SOURCE) {
      fail({
        code: "provider_unavailable",
        message: "This connection's one-shot text queue is full. Try again shortly",
        promptSent: "no",
      });
      return;
    }
    const timeoutMs = Math.min(
      msg.timeoutMs ?? PROVIDER_TEXT_DEFAULT_TIMEOUT_MS,
      PROVIDER_TEXT_MAX_TIMEOUT_MS,
    );
    const cancel = new AbortController();
    queue.requests.set(msg.requestId, cancel);
    this.queues.set(key, queue);
    const signal = AbortSignal.any([
      cancel.signal,
      origin.signal,
      this.lifetime.signal,
      AbortSignal.timeout(timeoutMs),
    ]);
    let admitted = false;
    try {
      admitted = await acquireTextSlot(queue, signal);
      if (signal.aborted) {
        fail(beforeStartAbort(signal));
        return;
      }
      // Resolve at dispatch so a waiting request cannot use a route that has since been disabled.
      const resolved = this.resolve(msg.provider);
      if ("error" in resolved) {
        fail(resolved.error);
        return;
      }
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
      queue.requests.delete(msg.requestId);
      if (admitted) {
        queue.running--;
        queue.waiting.values().next().value?.();
      }
      if (queue.requests.size === 0) this.queues.delete(key);
    }
  }

  handleCancel(msg: ProviderTextCancelRequestMessage, source: object | undefined): void {
    const target = this.queues
      .get(source ?? this.anonymousSource)
      ?.requests.get(msg.targetRequestId);
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
          message: resolved.reason,
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
