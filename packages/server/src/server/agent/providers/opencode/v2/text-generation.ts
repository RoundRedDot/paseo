import { realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import type { ModelInfo, PluginInfo } from "@opencode/client";
import {
  TextGenerationError,
  type AgentTextGeneration,
  type TextGenerationCapability,
  type TextGenerationModel,
  type TextGenerationRequest,
  type TextGenerationResult,
} from "../../../text-generation.js";
import type { OpenCodeTextEndpoint, V2Api } from "./api.js";
import type { V2Connection } from "./runtime.js";

/**
 * OpenCode v2's stateless route: `POST /api/experimental/generate` runs one model call from the
 * server's base configuration with no session, system prompt or tools. The session-scoped
 * `/api/session/{id}/generate` declares the session's tools and is never used here.
 *
 * Each version below was validated against a sandboxed binary and a synthetic model: the upstream
 * request carried one user message and no tools, a model that answered with tool calls had them
 * dropped, no session or stored prompt appeared, and no plugin hook observable from an ordinary
 * session fired. Add a version only after repeating that validation.
 */
export const OPENCODE_TEXT_GENERATION_VERSIONS: ReadonlySet<string> = new Set([
  "2.0.10",
  "2.2.6",
  "2.3.2",
]);

export const OPENCODE_TEXT_ROUTE = "/api/experimental/generate";
const ROUTE_OPERATIONS = new Set([
  "experimental.generate.text",
  "experimental.generate.textLegacy",
]);

/** What validation could not observe; callers disclose these alongside the capability. */
export const OPENCODE_TEXT_LIMITATIONS = [
  // OpenCode's built-in AI SDK hooks (`aisdk.sdk`, `aisdk.language`) never fired in validation,
  // on this route or in ordinary sessions, so their effect on this route is unknown.
  "provider_runtime_builtin_hooks_unobserved",
  // MCP servers in the base configuration connect when it loads. Their tools are not offered.
  "provider_runtime_mcp_servers_connect",
  // The prompt reaches the local OpenCode server and the model provider it is configured for.
  "prompt_sent_to_provider_runtime_and_model_provider",
] as const;

const DEFAULT_MODEL_WAIT_MS = 10_000;
const MODEL_POLL_MS = 250;
const PLUGIN_SETTLE_MS = 250;
const MAX_ERROR_BODY_BYTES = 16_384;

export interface OpenCodeTextGenerationOptions {
  acquire(signal: AbortSignal): Promise<V2Connection>;
  /** Paseo's own plugin directories; a plugin loaded from anywhere else is unaccounted for. */
  paseoPluginRoots: string[];
  modelWaitMs?: number;
}

interface Preflight {
  version: string;
  baseLocation: { directory: string };
  models: ModelInfo[];
}

export function createOpenCodeTextGeneration(
  options: OpenCodeTextGenerationOptions,
): AgentTextGeneration {
  const modelWaitMs = options.modelWaitMs ?? DEFAULT_MODEL_WAIT_MS;

  async function withConnection<T>(
    signal: AbortSignal,
    run: (connection: V2Connection, endpoint: OpenCodeTextEndpoint) => Promise<T>,
  ): Promise<T> {
    let connection: V2Connection;
    try {
      connection = await options.acquire(signal);
    } catch (error) {
      if (signal.aborted) throw abortError(signal, "no");
      throw new TextGenerationError(
        "provider_unavailable",
        `OpenCode is unavailable: ${errorMessage(error)}`,
        "no",
      );
    }
    try {
      const endpoint = connection.textEndpoint;
      if (!endpoint)
        throw new TextGenerationError(
          "unsupported",
          "This OpenCode connection cannot run one-shot text generation",
          "no",
        );
      return await run(connection, endpoint);
    } finally {
      await connection.release();
    }
  }

  async function preflight(
    client: V2Api,
    endpoint: OpenCodeTextEndpoint,
    signal: AbortSignal,
    waitForModel?: string,
  ): Promise<Preflight> {
    assertLoopback(endpoint);
    const version = await call(signal, () => client.server.info({ signal }));
    if (!OPENCODE_TEXT_GENERATION_VERSIONS.has(version.version))
      throw new TextGenerationError(
        "version_unsupported",
        `OpenCode ${version.version} has not been validated for one-shot text generation; validated versions: ${[...OPENCODE_TEXT_GENERATION_VERSIONS].join(", ")}`,
        "no",
      );
    await verifyRoute(endpoint, signal);
    const baseLocation = { directory: endpoint.configDirectory };
    if (endpoint.kind !== "owned") await verifyBaseConfiguration(client, endpoint, signal);
    const models = await waitForModels(client, baseLocation, signal, waitForModel);
    const plugins = await waitForSettledPlugins(client, baseLocation, signal);
    await assertAccountedPlugins(plugins, endpoint, options.paseoPluginRoots);
    return { version: version.version, baseLocation, models };
  }

  /**
   * A cold location lists no plugins until its built-in and configured plugins register, which
   * they do together. Judge the inventory only once it is non-empty, includes built-ins and reads
   * the same twice; otherwise refuse.
   */
  async function waitForSettledPlugins(
    client: V2Api,
    location: { directory: string },
    signal: AbortSignal,
  ): Promise<PluginInfo[]> {
    const deadline = Date.now() + Math.max(modelWaitMs, PLUGIN_SETTLE_MS * 2);
    let previous: string | null = null;
    while (true) {
      const listed = await call(signal, () => client.plugin.list({ location }, { signal }));
      const loaded = listed.data.some((plugin) => plugin.source.type === "builtin");
      const signature = loaded ? pluginSignature(listed.data) : null;
      if (signature !== null && signature === previous) return listed.data;
      if (Date.now() >= deadline)
        throw new TextGenerationError(
          "route_unverified",
          "OpenCode's plugin inventory for its base configuration did not settle",
          "no",
        );
      previous = signature;
      await delay(PLUGIN_SETTLE_MS, undefined, { signal }).catch(() => {
        throw abortError(signal, "no");
      });
    }
  }

  async function waitForModels(
    client: V2Api,
    location: { directory: string },
    signal: AbortSignal,
    model: string | undefined,
  ): Promise<ModelInfo[]> {
    // The base location loads on first use; OpenCode 2.0.10 lists its models a moment later.
    const deadline = Date.now() + modelWaitMs;
    while (true) {
      const listed = await call(signal, () => client.model.list({ location }, { signal }));
      const enabled = listed.data.filter((entry) => entry.enabled);
      const ready = model ? enabled.some((entry) => modelId(entry) === model) : enabled.length > 0;
      if (ready || Date.now() >= deadline) return enabled;
      await delay(MODEL_POLL_MS, undefined, { signal }).catch(() => {
        throw abortError(signal, "no");
      });
    }
  }

  return {
    async getCapability({ signal }): Promise<TextGenerationCapability> {
      return withConnection(signal, async (connection, endpoint) => {
        const checked = await preflight(connection.client, endpoint, signal);
        return {
          runtimeVersion: checked.version,
          models: checked.models.map(toTextModel),
          limitations: [...OPENCODE_TEXT_LIMITATIONS],
        };
      });
    },

    async generate(request: TextGenerationRequest): Promise<TextGenerationResult> {
      const { signal } = request;
      const ref = parseModel(request.model, request.thinkingOptionId);
      if (request.prompt.trim().length === 0)
        throw new TextGenerationError("invalid_request", "The prompt is empty", "no");
      return withConnection(signal, async (connection, endpoint) => {
        const checked = await preflight(connection.client, endpoint, signal, request.model);
        const model = checked.models.find((entry) => modelId(entry) === request.model);
        if (!model)
          throw new TextGenerationError(
            "model_unavailable",
            `${request.model} is not in OpenCode's base configuration. One-shot generation cannot use models defined only in a project's opencode.json.`,
            "no",
          );
        if (
          request.thinkingOptionId !== undefined &&
          !model.variants.some((variant) => variant.id === request.thinkingOptionId)
        )
          throw new TextGenerationError(
            "thinking_option_unavailable",
            `${request.model} has no thinking option "${request.thinkingOptionId}"`,
            "no",
          );
        const text = await postGenerate(endpoint, { prompt: request.prompt, model: ref }, signal);
        return {
          text,
          model: request.model,
          thinkingOptionId: request.thinkingOptionId ?? null,
          runtimeVersion: checked.version,
        };
      });
    },
  };
}

function parseModel(
  model: string,
  variant: string | undefined,
): { providerID: string; id: string; variant?: string } {
  const slash = model.indexOf("/");
  if (slash < 1 || slash === model.length - 1)
    throw new TextGenerationError(
      "invalid_request",
      "OpenCode models are named providerID/modelID",
      "no",
    );
  return {
    providerID: model.slice(0, slash),
    id: model.slice(slash + 1),
    ...(variant !== undefined ? { variant } : {}),
  };
}

function pluginSignature(plugins: PluginInfo[]): string {
  return plugins
    .map((plugin) => JSON.stringify([plugin.id ?? null, plugin.source, plugin.state.status]))
    .sort()
    .join("\n");
}

function modelId(model: ModelInfo): string {
  return `${model.providerID}/${model.id}`;
}

function toTextModel(model: ModelInfo): TextGenerationModel {
  return {
    id: modelId(model),
    label: model.name,
    thinkingOptionIds: model.variants.map((variant) => variant.id),
  };
}

export function isLoopbackHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host === "::1") return true;
  return /^127(?:\.\d{1,3}){3}$/.test(host);
}

function assertLoopback(endpoint: OpenCodeTextEndpoint): void {
  if (endpoint.kind === "owned") return;
  let hostname: string;
  try {
    hostname = new URL(endpoint.baseUrl).hostname;
  } catch {
    throw new TextGenerationError("route_unverified", "The OpenCode server URL is invalid", "no");
  }
  if (!isLoopbackHost(hostname))
    throw new TextGenerationError(
      "remote_server_refused",
      `One-shot text generation only runs on an OpenCode server on this machine's loopback address; ${hostname} is configured. Paseo does not switch to another server.`,
      "no",
    );
}

/** Reads the server's own description of the route, without the prompt, before trusting it. */
async function verifyRoute(endpoint: OpenCodeTextEndpoint, signal: AbortSignal): Promise<void> {
  const response = await directFetch(endpoint, "/openapi.json", { method: "GET" }, signal, "no");
  if (!response.ok)
    throw new TextGenerationError(
      "route_unverified",
      `OpenCode did not describe its API (HTTP ${response.status})`,
      "no",
    );
  const document: unknown = await response.json().catch(() => null);
  const problem = describeRouteProblem(document);
  if (problem)
    throw new TextGenerationError(
      "route_unverified",
      `OpenCode's one-shot route is not the validated shape: ${problem}`,
      "no",
    );
}

export function describeRouteProblem(document: unknown): string | null {
  const paths = record(record(document)?.paths);
  const operation = record(record(paths?.[OPENCODE_TEXT_ROUTE])?.post);
  if (!operation) return `${OPENCODE_TEXT_ROUTE} is missing`;
  if (typeof operation.operationId !== "string" || !ROUTE_OPERATIONS.has(operation.operationId))
    return `unexpected operation ${String(operation.operationId)}`;
  const content = record(record(operation.requestBody)?.content);
  const schema = record(record(content?.["application/json"])?.schema);
  return describeRequestProblem(document, schema);
}

function describeRequestProblem(
  document: unknown,
  schema: Record<string, unknown> | null,
): string | null {
  const properties = record(schema?.properties);
  if (!schema || !properties) return "no request schema";
  const keys = Object.keys(properties).sort();
  if (keys.join(",") !== "model,prompt") return `request fields ${keys.join(", ")}`;
  if (schema.additionalProperties !== false) return "request accepts extra fields";
  const required = Array.isArray(schema.required) ? schema.required : [];
  if (required.length !== 1 || required[0] !== "prompt") return "unexpected required fields";
  if (record(properties.prompt)?.type !== "string") return "prompt is not a string";
  const refName = findRef(properties.model);
  const schemas = record(record(record(document)?.components)?.schemas);
  const ref = refName ? record(schemas?.[refName]) : null;
  const refKeys = Object.keys(record(ref?.properties) ?? {}).sort();
  if (refKeys.join(",") !== "id,providerID,variant") return "unexpected model reference";
  return null;
}

function findRef(value: unknown): string | null {
  const direct = record(value)?.$ref;
  if (typeof direct === "string") return direct.replace("#/components/schemas/", "");
  const options = record(value)?.anyOf;
  if (!Array.isArray(options)) return null;
  for (const option of options) {
    const ref = record(option)?.$ref;
    if (typeof ref === "string") return ref.replace("#/components/schemas/", "");
  }
  return null;
}

/** A shared server may run with another configuration directory than this daemon expects. */
async function verifyBaseConfiguration(
  client: V2Api,
  endpoint: OpenCodeTextEndpoint,
  signal: AbortSignal,
): Promise<void> {
  const config = client.config;
  if (!config)
    throw new TextGenerationError(
      "route_unverified",
      "Cannot read the OpenCode server's configuration directory",
      "no",
    );
  let entries: Awaited<ReturnType<typeof config.get>>;
  try {
    entries = await config.get({ location: { directory: endpoint.configDirectory } }, { signal });
  } catch {
    if (signal.aborted) throw abortError(signal, "no");
    throw new TextGenerationError(
      "route_unverified",
      `The OpenCode server could not read the configuration directory ${endpoint.configDirectory}; its base models cannot be confirmed`,
      "no",
    );
  }
  const expected = path.resolve(endpoint.configDirectory);
  if (!entries.some((entry) => entry.type === "directory" && path.resolve(entry.path) === expected))
    throw new TextGenerationError(
      "route_unverified",
      `The OpenCode server does not use the configuration directory ${endpoint.configDirectory}; its base models cannot be confirmed`,
      "no",
    );
}

/**
 * Built-in plugins ship in the validated binary and Paseo's own plugin only registers session
 * context hooks, which the stateless route does not run. Anything else could hook the request.
 */
export async function assertAccountedPlugins(
  plugins: PluginInfo[],
  endpoint: OpenCodeTextEndpoint,
  paseoRoots: string[],
): Promise<void> {
  const managed = path.join(endpoint.configDirectory, "plugins", "paseo-managed-bridge");
  const roots = await Promise.all([...paseoRoots, managed].map(canonical));
  const unaccounted: PluginInfo[] = [];
  for (const plugin of plugins) {
    if (plugin.source.type === "builtin") continue;
    const location = plugin.id === "paseo" ? await pluginLocation(plugin) : null;
    const inside =
      location !== null &&
      roots.some((root) => location === root || location.startsWith(root + path.sep));
    if (!inside) unaccounted.push(plugin);
  }
  if (unaccounted.length > 0)
    throw new TextGenerationError(
      "plugins_unverified",
      `OpenCode loads plugins Paseo cannot account for in its base configuration: ${unaccounted
        .map((plugin) => plugin.id ?? plugin.source.type)
        .join(", ")}. Remove them to use one-shot text generation.`,
      "no",
    );
}

function pluginSourcePath(plugin: PluginInfo): string | null {
  switch (plugin.source.type) {
    case "local":
      return plugin.source.path;
    case "package":
      return plugin.source.target;
    default:
      return null;
  }
}

async function pluginLocation(plugin: PluginInfo): Promise<string | null> {
  const raw = pluginSourcePath(plugin);
  if (!raw) return null;
  try {
    return await canonical(raw.startsWith("file:") ? fileURLToPath(raw) : raw);
  } catch {
    return null;
  }
}

/** OpenCode may report a plugin by its real path, for example `/private/tmp` for `/tmp`. */
async function canonical(location: string): Promise<string> {
  const resolved = path.resolve(location);
  try {
    return await realpath(resolved);
  } catch {
    return resolved;
  }
}

async function postGenerate(
  endpoint: OpenCodeTextEndpoint,
  payload: { prompt: string; model: { providerID: string; id: string; variant?: string } },
  signal: AbortSignal,
): Promise<string> {
  // From here on the prompt may have reached OpenCode: no failure claims otherwise, and nothing
  // retries it.
  const response = await directFetch(
    endpoint,
    OPENCODE_TEXT_ROUTE,
    { method: "POST", body: JSON.stringify(payload) },
    signal,
    "possibly",
  );
  if (!response.ok) {
    const detail = await errorDetail(response);
    throw new TextGenerationError(
      "generation_failed",
      `OpenCode returned HTTP ${response.status}${detail ? ` (${detail})` : ""}`,
      "possibly",
    );
  }
  const body: unknown = await response.json().catch(() => null);
  const text = record(record(body)?.data)?.text;
  if (typeof text !== "string")
    throw new TextGenerationError(
      "generation_failed",
      "OpenCode returned an unexpected response",
      "possibly",
    );
  if (text.trim().length === 0)
    throw new TextGenerationError("empty_result", "The model returned no text", "possibly");
  return text;
}

async function directFetch(
  endpoint: OpenCodeTextEndpoint,
  pathname: string,
  init: { method: "GET" | "POST"; body?: string },
  signal: AbortSignal,
  promptSent: "no" | "possibly",
): Promise<Response> {
  const combined = AbortSignal.any([signal, endpoint.lifetime]);
  let response: Response;
  try {
    response = await fetch(new URL(pathname, endpoint.baseUrl), {
      method: init.method,
      headers: {
        ...(endpoint.authorization ? { Authorization: endpoint.authorization } : {}),
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
        Accept: "application/json",
      },
      ...(init.body !== undefined ? { body: init.body } : {}),
      // A redirect would carry the prompt to another origin; it is never followed.
      redirect: "manual",
      signal: combined,
    });
  } catch (error) {
    if (signal.aborted) throw abortError(signal, promptSent);
    if (endpoint.lifetime.aborted)
      throw new TextGenerationError("provider_unavailable", "OpenCode stopped", promptSent);
    throw new TextGenerationError(
      promptSent === "no" ? "provider_unavailable" : "generation_failed",
      `Cannot reach OpenCode: ${errorMessage(error)}`,
      promptSent,
    );
  }
  if (response.status >= 300 && response.status < 400) {
    await response.body?.cancel().catch(() => undefined);
    throw new TextGenerationError(
      promptSent === "no" ? "route_unverified" : "generation_failed",
      `OpenCode answered with a redirect (HTTP ${response.status}); Paseo does not follow it`,
      promptSent,
    );
  }
  return response;
}

/** Error class and reason only; provider messages are not passed on. */
async function errorDetail(response: Response): Promise<string | null> {
  const raw = await response.text().catch(() => "");
  let body: unknown = null;
  try {
    body = JSON.parse(raw.slice(0, MAX_ERROR_BODY_BYTES));
  } catch {
    return null;
  }
  const fields = record(body);
  const identifier = [fields?._tag, fields?.name, record(fields?.error)?._tag].find(
    (value): value is string => typeof value === "string" && /^[A-Za-z0-9_.]{1,80}$/.test(value),
  );
  const reason =
    typeof fields?.reason === "string" && /^[a-z_]{1,40}$/.test(fields.reason)
      ? fields.reason
      : null;
  return [identifier, reason].filter(Boolean).join(": ") || null;
}

async function call<T>(signal: AbortSignal, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (signal.aborted) throw abortError(signal, "no");
    if (error instanceof TextGenerationError) throw error;
    throw new TextGenerationError(
      "provider_unavailable",
      `OpenCode preflight failed: ${errorMessage(error)}`,
      "no",
    );
  }
}

function abortError(signal: AbortSignal, promptSent: "no" | "possibly"): TextGenerationError {
  const reason: unknown = signal.reason;
  const timedOut = reason instanceof Error && reason.name === "TimeoutError";
  return new TextGenerationError(
    timedOut ? "timeout" : "cancelled",
    timedOut ? "One-shot text generation timed out" : "One-shot text generation was cancelled",
    promptSent,
  );
}

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.length > 200 ? `${message.slice(0, 200)}…` : message;
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
