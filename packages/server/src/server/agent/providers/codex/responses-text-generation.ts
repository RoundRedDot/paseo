import type { TextGenerationCredential } from "../../../text-generation-credentials.js";
import type { ProviderProfileModel } from "../../provider-launch-config.js";
import {
  TextGenerationError,
  type AgentTextGeneration,
  type PromptDelivery,
  type TextGenerationCapability,
  type TextGenerationModel,
  type TextGenerationRequest,
  type TextGenerationResult,
} from "../../text-generation.js";
import { normalizeOpenAICompatibleBaseUrl } from "./base-url.js";
import { createMacosKeychainReader, type KeychainSecretReader } from "./macos-keychain.js";

/**
 * One-shot text generation for a Codex custom provider that talks to an OpenAI-compatible
 * gateway: one `POST {base_url}/responses` with the prompt and no tools, sent by the daemon.
 * No Codex process, agent, session or tool runs, and nothing the model returns is executed.
 *
 * It exists only for a provider with an entry in `text-generation-credentials.json` (see
 * `text-generation-credentials.ts`). The secret is read from that entry's Keychain item for
 * each request and is sent only to that entry's origin, which the provider's `OPENAI_BASE_URL`
 * must match exactly. Everything it cannot confirm refuses before the prompt is sent.
 */

export const RESPONSES_TEXT_GENERATION_RUNTIME = "openai-responses";

/** Thinking options sent as `reasoning.effort`; any other option is not offered. */
const REASONING_EFFORTS = new Set(["low", "medium", "high"]);

const SUCCESS_BODY_LIMIT = 4 * 1024 * 1024;
const ERROR_BODY_LIMIT = 16 * 1024;
/**
 * Gateway error codes and types Paseo names in an error, as fixed strings. A gateway can put any
 * value in these fields, including one that echoes the prompt or a credential, so anything else
 * is left out.
 */
const PUBLIC_GATEWAY_ERRORS = new Set([
  "invalid_request_error",
  "authentication_error",
  "permission_error",
  "not_found_error",
  "rate_limit_error",
  "server_error",
  "invalid_api_key",
  "insufficient_quota",
  "model_not_found",
  "rate_limit_exceeded",
  "context_length_exceeded",
]);

/** Item types a gateway may send for a tool call; named in the error so the reason is clear. */
const TOOL_ITEM_TYPES = new Set([
  "function_call",
  "custom_tool_call",
  "web_search_call",
  "file_search_call",
  "computer_call",
  "code_interpreter_call",
  "image_generation_call",
  "local_shell_call",
  "shell_call",
  "apply_patch_call",
  "mcp_call",
  "mcp_list_tools",
  "mcp_approval_request",
]);

export const RESPONSES_TEXT_GENERATION_LIMITATIONS = [
  "prompt_sent_to_configured_gateway",
  "credential_read_from_host_keychain",
] as const;

export interface ResponsesTextGenerationDeps {
  readSecret?: KeychainSecretReader;
  fetch?: typeof fetch;
  platform?: NodeJS.Platform;
}

export interface ResponsesTextGenerationOptions {
  /** The provider's `env.OPENAI_BASE_URL`, as Codex receives it. */
  baseUrl: string | undefined;
  models: readonly ProviderProfileModel[];
  credential: TextGenerationCredential;
  deps?: ResponsesTextGenerationDeps;
}

interface Endpoint {
  responsesUrl: string;
}

function refuse(code: "remote_server_refused" | "unsupported", message: string): never {
  throw new TextGenerationError(code, message, "no");
}

/** The gateway endpoint, only when it is the credential's origin. */
function resolveEndpoint(
  baseUrl: string | undefined,
  credential: TextGenerationCredential,
): Endpoint {
  const normalized = baseUrl ? normalizeOpenAICompatibleBaseUrl(baseUrl) : null;
  if (!normalized) refuse("unsupported", "This provider has no OPENAI_BASE_URL");
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    refuse("unsupported", "This provider's OPENAI_BASE_URL is not a valid URL");
  }
  if (url.username || url.password || url.search || url.hash)
    refuse(
      "remote_server_refused",
      "This provider's OPENAI_BASE_URL carries credentials, a query or a fragment",
    );
  if (url.origin !== credential.origin)
    refuse(
      "remote_server_refused",
      "This provider's OPENAI_BASE_URL is not the gateway its text generation credential is bound to",
    );
  return { responsesUrl: `${normalized}/responses` };
}

function offeredModels(models: readonly ProviderProfileModel[]): TextGenerationModel[] {
  return models.map((model) => ({
    id: model.id,
    label: model.label,
    thinkingOptionIds: (model.thinkingOptions ?? [])
      .map((option) => option.id)
      .filter((id) => REASONING_EFFORTS.has(id)),
  }));
}

function abortError(signal: AbortSignal, promptSent: PromptDelivery): TextGenerationError {
  const reason: unknown = signal.reason;
  const timedOut = reason instanceof Error && reason.name === "TimeoutError";
  return new TextGenerationError(
    timedOut ? "timeout" : "cancelled",
    timedOut ? "One-shot text generation timed out" : "One-shot text generation was cancelled",
    promptSent,
  );
}

function failed(message: string): TextGenerationError {
  return new TextGenerationError("generation_failed", message, "possibly");
}

async function readBounded(
  response: Response,
  limit: number,
  signal: AbortSignal,
): Promise<{ text: string; truncated: boolean }> {
  const reader = response.body?.getReader();
  if (!reader) return { text: "", truncated: false };
  const chunks: Uint8Array[] = [];
  let size = 0;
  let truncated = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (size + value.byteLength > limit) {
        chunks.push(value.subarray(0, limit - size));
        truncated = true;
        break;
      }
      chunks.push(value);
      size += value.byteLength;
    }
  } catch {
    if (signal.aborted) throw abortError(signal, "possibly");
    throw failed("The gateway's response could not be read");
  } finally {
    if (truncated) await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  return { text: Buffer.concat(chunks).toString("utf8"), truncated };
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** A fixed public gateway error code or type, or nothing. */
function publicGatewayError(value: unknown): string | null {
  return typeof value === "string" && PUBLIC_GATEWAY_ERRORS.has(value) ? value : null;
}

/** The HTTP status and a known public error code; never the gateway's own message or values. */
function describeHttpError(status: number, body: string): string {
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = null;
  }
  const error = record(record(parsed)?.error);
  const code = error ? (publicGatewayError(error.code) ?? publicGatewayError(error.type)) : null;
  return code
    ? `The gateway answered HTTP ${status} (${code})`
    : `The gateway answered HTTP ${status}`;
}

function readMessageText(item: Record<string, unknown>, parts: string[]): void {
  // An unfinished message may hold part of the answer; only a finished assistant one counts.
  if (item.role !== "assistant") throw failed("The gateway's message is not from the assistant");
  if (item.status !== "completed") throw failed("The gateway's message is not completed");
  const content = item.content;
  if (!Array.isArray(content)) throw failed("The gateway's message has no content");
  for (const value of content) {
    const part = record(value);
    if (part?.type === "output_text" && typeof part.text === "string") {
      parts.push(part.text);
      continue;
    }
    if (part?.type === "refusal") throw failed("The model refused to answer");
    throw failed("The gateway's message holds a part that is not text");
  }
}

/**
 * The model's text from a completed response, or a refusal for anything else. Values the gateway
 * chose (statuses, item and part types) are not echoed, except known tool call types.
 */
export function readResponsesText(document: unknown): string {
  const body = record(document);
  const output = body?.output;
  if (!body || !Array.isArray(output))
    throw failed("The gateway did not answer in the Responses format");
  if (body.status !== "completed") throw failed("The gateway's response is not completed");
  const parts: string[] = [];
  for (const entry of output) {
    const item = record(entry);
    const type = item?.type;
    // Reasoning summaries are not part of the answer.
    if (type === "reasoning") continue;
    if (item && type === "message") {
      readMessageText(item, parts);
      continue;
    }
    if (typeof type === "string" && TOOL_ITEM_TYPES.has(type))
      throw failed(`The model answered with a ${type} item instead of text; Paseo ran nothing`);
    throw failed("The model answered with an item that is not text; Paseo ran nothing");
  }
  return parts.join("");
}

export function createResponsesTextGeneration(
  options: ResponsesTextGenerationOptions,
): AgentTextGeneration {
  const platform = options.deps?.platform ?? process.platform;
  const readSecret = options.deps?.readSecret ?? createMacosKeychainReader({ platform });
  const fetchImpl = options.deps?.fetch ?? fetch;
  const models = offeredModels(options.models);

  function preflight(): Endpoint {
    if (platform !== "darwin")
      refuse("unsupported", "Keychain credentials for text generation are only supported on macOS");
    return resolveEndpoint(options.baseUrl, options.credential);
  }

  function capability(): TextGenerationCapability {
    preflight();
    if (models.length === 0) refuse("unsupported", "This provider lists no models");
    return {
      runtimeVersion: RESPONSES_TEXT_GENERATION_RUNTIME,
      models,
      limitations: [...RESPONSES_TEXT_GENERATION_LIMITATIONS],
    };
  }

  async function readCredential(signal: AbortSignal): Promise<string> {
    try {
      return await readSecret(
        { service: options.credential.service, account: options.credential.account },
        signal,
      );
    } catch (error) {
      if (signal.aborted) throw abortError(signal, "no");
      if (error instanceof TextGenerationError) throw error;
      throw new TextGenerationError(
        "provider_unavailable",
        "The Keychain item for this provider could not be read",
        "no",
      );
    }
  }

  async function post(
    endpoint: Endpoint,
    secret: string,
    body: string,
    signal: AbortSignal,
  ): Promise<Response> {
    let response: Response;
    try {
      response = await fetchImpl(endpoint.responsesUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body,
        // A redirect would carry the prompt and the key to another URL; it is never followed.
        redirect: "manual",
        signal,
      });
    } catch {
      if (signal.aborted) throw abortError(signal, "possibly");
      throw failed("Cannot reach the gateway");
    }
    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel().catch(() => undefined);
      throw failed(
        `The gateway answered with a redirect (HTTP ${response.status}); Paseo does not follow it`,
      );
    }
    return response;
  }

  async function generate(request: TextGenerationRequest): Promise<TextGenerationResult> {
    const { signal } = request;
    if (signal.aborted) throw abortError(signal, "no");
    const endpoint = preflight();
    const model = models.find((entry) => entry.id === request.model);
    if (!model)
      throw new TextGenerationError(
        "model_unavailable",
        "The model is not one this provider lists",
        "no",
      );
    const thinking = request.thinkingOptionId;
    if (thinking !== undefined && !model.thinkingOptionIds.includes(thinking))
      throw new TextGenerationError(
        "thinking_option_unavailable",
        "The thinking option is not one Paseo sends to this gateway",
        "no",
      );
    const secret = await readCredential(signal);
    if (signal.aborted) throw abortError(signal, "no");
    const body = JSON.stringify({
      model: model.id,
      input: [{ role: "user", content: [{ type: "input_text", text: request.prompt }] }],
      store: false,
      stream: false,
      ...(thinking !== undefined ? { reasoning: { effort: thinking } } : {}),
    });

    // From here the prompt may have reached the gateway.
    const response = await post(endpoint, secret, body, signal);
    if (!response.ok) {
      const raw = await readBounded(response, ERROR_BODY_LIMIT, signal);
      throw failed(describeHttpError(response.status, raw.text));
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!/^application\/json\b/iu.test(contentType)) {
      await response.body?.cancel().catch(() => undefined);
      throw failed("The gateway did not answer with JSON");
    }
    const raw = await readBounded(response, SUCCESS_BODY_LIMIT, signal);
    if (raw.truncated) throw failed("The gateway's response is too large");
    let document: unknown;
    try {
      document = JSON.parse(raw.text);
    } catch {
      throw failed("The gateway's response is not valid JSON");
    }
    const text = readResponsesText(document).trim();
    if (!text)
      throw new TextGenerationError("empty_result", "The model returned no text", "possibly");
    return {
      text,
      model: model.id,
      thinkingOptionId: thinking ?? null,
      runtimeVersion: RESPONSES_TEXT_GENERATION_RUNTIME,
    };
  }

  return {
    async getCapability() {
      return capability();
    },
    generate,
  };
}
