import { mkdtempSync, mkdirSync, realpathSync, rmSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import nodePath from "node:path";
import type { AddressInfo } from "node:net";
import { OpenCode, type ModelInfo, type PluginInfo } from "@opencode/client";
import { afterEach, describe, expect, test } from "vitest";
import { TextGenerationError } from "../../../text-generation.js";
import type { OpenCodeTextEndpoint, V2Api } from "./api.js";
import type { V2Connection } from "./runtime.js";
import { createOpenCodeTextGeneration, OPENCODE_TEXT_ROUTE } from "./text-generation.js";

// A local HTTP server stands in for OpenCode's own routes: `/openapi.json` and the one-shot
// route. The typed client calls (server info, models, plugins, config) are stubbed.

const MODEL_REF = {
  type: "object",
  properties: {
    id: { type: "string" },
    providerID: { type: "string" },
    variant: { type: "string" },
  },
  required: ["id", "providerID"],
};
// Shape captured from OpenCode 2.2.6's /openapi.json.
const ROUTE_SPEC = {
  post: {
    operationId: "experimental.generate.textLegacy",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              prompt: { type: "string" },
              model: { anyOf: [{ $ref: "#/components/schemas/Model.Ref" }, { type: "null" }] },
            },
            required: ["prompt"],
            additionalProperties: false,
          },
        },
      },
    },
  },
};

interface Recorded {
  method: string;
  path: string;
  authorization: string | null;
  body: string;
}

interface FakeServer {
  url: string;
  requests: Recorded[];
  closedEarly: number;
  close(): Promise<void>;
}

type Handler = (req: http.IncomingMessage, body: string, res: http.ServerResponse) => void;

const servers: FakeServer[] = [];

async function startServer(handler: Handler): Promise<FakeServer> {
  const requests: Recorded[] = [];
  const state = { closedEarly: 0 };
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk.toString()));
    req.on("end", () => {
      requests.push({
        method: req.method ?? "",
        path: req.url ?? "",
        authorization: req.headers.authorization ?? null,
        body,
      });
      res.on("close", () => {
        if (!res.writableEnded) state.closedEarly += 1;
      });
      handler(req, body, res);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const fake: FakeServer = {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    requests,
    get closedEarly() {
      return state.closedEarly;
    },
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
  servers.push(fake);
  return fake;
}

function json(res: http.ServerResponse, status: number, value: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(value));
}

function openApi(route: unknown = ROUTE_SPEC) {
  return {
    paths: { [OPENCODE_TEXT_ROUTE]: route },
    components: { schemas: { "Model.Ref": MODEL_REF } },
  };
}

/** OpenCode as validated: answers the route with `text`, describes itself with `spec`. */
function openCodeHandler(
  input: { text?: string; spec?: unknown; generate?: Handler } = {},
): Handler {
  return (req, body, res) => {
    if (req.url === "/openapi.json") return json(res, 200, input.spec ?? openApi());
    if (req.url === OPENCODE_TEXT_ROUTE && req.method === "POST") {
      if (input.generate) return input.generate(req, body, res);
      return json(res, 200, { data: { text: input.text ?? "SYNTHETIC-TRANSLATION" } });
    }
    json(res, 404, { error: "not found" });
  };
}

function model(id: string, variants: string[] = []): ModelInfo {
  const [providerID, modelID] = id.split("/");
  return {
    id: modelID,
    providerID,
    name: `Synthetic ${modelID}`,
    enabled: true,
    variants: variants.map((variant) => ({ id: variant })),
  } as unknown as ModelInfo;
}

interface Stubs {
  version?: string;
  models?: ModelInfo[] | (() => ModelInfo[]);
  plugins?: PluginInfo[] | (() => PluginInfo[]);
  configDirectories?: string[] | "fails";
}

interface Harness {
  connection: V2Connection;
  calls: string[];
  released: number;
}

function harness(endpoint: Partial<OpenCodeTextEndpoint> & { baseUrl: string }, stubs: Stubs = {}) {
  const calls: string[] = [];
  const state: Harness = { calls, released: 0, connection: undefined as never };
  const client = {
    server: {
      info: async () => {
        calls.push("server.info");
        return { version: stubs.version ?? "2.2.6", pid: 1, urls: [], paths: { tmp: "/tmp" } };
      },
    },
    model: {
      list: async (input: { location?: { directory?: string } }) => {
        calls.push(`model.list:${input.location?.directory}`);
        const models = typeof stubs.models === "function" ? stubs.models() : stubs.models;
        return {
          location: { directory: "/base" },
          data: models ?? [model("mock/mock-model", ["high"])],
        };
      },
    },
    plugin: {
      list: async () => {
        calls.push("plugin.list");
        const plugins = typeof stubs.plugins === "function" ? stubs.plugins() : stubs.plugins;
        return {
          location: { directory: "/base" },
          data: plugins ?? [builtin("opencode.tool.shell")],
        };
      },
    },
    config: {
      get: async () => {
        calls.push("config.get");
        if (stubs.configDirectories === "fails") throw new Error("Transport");
        return (stubs.configDirectories ?? ["/base"]).map((path) => ({ type: "directory", path }));
      },
    },
  } as unknown as V2Api;
  const lifetime = new AbortController();
  state.connection = {
    client,
    release: async () => {
      state.released += 1;
    },
    retain: () => state.connection,
    bindSession: async () => undefined,
    unbindSession: async () => undefined,
    refreshLocation: async () => undefined,
    exited: new Promise<Error>(() => undefined),
    textEndpoint: {
      kind: "owned",
      authorization: "Basic synthetic",
      configDirectory: "/base",
      lifetime: lifetime.signal,
      ...endpoint,
    },
  };
  return state;
}

function textGeneration(state: Harness, modelWaitMs = 0) {
  return createOpenCodeTextGeneration({
    acquire: async () => state.connection,
    paseoPluginRoots: ["/paseo-home/runtime/opencode"],
    modelWaitMs,
  });
}

function builtin(id: string): PluginInfo {
  return {
    id,
    source: { type: "builtin" },
    features: { server: true },
    state: { status: "active" },
  } as PluginInfo;
}

function local(id: string, path: string): PluginInfo {
  return {
    id,
    source: { type: "local", path },
    features: { server: true },
    state: { status: "active" },
  } as PluginInfo;
}

const PROMPT = "SYNTHETIC-PROMPT translate this";

async function expectRefusal(
  run: Promise<unknown>,
  code: string,
  promptSent: "no" | "possibly",
): Promise<TextGenerationError> {
  const error = await run.then(
    () => {
      throw new Error("expected a refusal");
    },
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(TextGenerationError);
  expect(error).toMatchObject({ code, promptSent });
  return error as TextGenerationError;
}

function redirectHandler(status: number, location: string): Handler {
  return (_req, _body, res) => {
    res.writeHead(status, { location });
    res.end();
  };
}

function jsonHandler(status: number, value: unknown): Handler {
  return (_req, _body, res) => json(res, status, value);
}

/** Accepts the request and never answers. */
const hang: Handler = () => undefined;

function closedEarlyOf(server: FakeServer): () => number {
  return () => server.closedEarly;
}

function generateCountOf(server: FakeServer): () => number {
  return () => generateCalls(server).length;
}

function promptsReceived(server: FakeServer): string[] {
  return generateCalls(server).map(
    (request) => (JSON.parse(request.body) as { prompt: string }).prompt,
  );
}

function generateCalls(server: FakeServer) {
  return server.requests.filter((request) => request.path === OPENCODE_TEXT_ROUTE);
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe("OpenCode v2 one-shot text generation", () => {
  test("posts only the prompt and exact model reference to the stateless route", async () => {
    const server = await startServer(openCodeHandler());
    const state = harness({ baseUrl: server.url });
    const result = await textGeneration(state).generate({
      model: "mock/mock-model",
      thinkingOptionId: "high",
      prompt: PROMPT,
      signal: AbortSignal.timeout(5_000),
    });
    expect(result).toEqual({
      text: "SYNTHETIC-TRANSLATION",
      model: "mock/mock-model",
      thinkingOptionId: "high",
      runtimeVersion: "2.2.6",
    });
    const [request] = generateCalls(server);
    expect(request.method).toBe("POST");
    expect(request.authorization).toBe("Basic synthetic");
    expect(JSON.parse(request.body)).toEqual({
      prompt: PROMPT,
      model: { providerID: "mock", id: "mock-model", variant: "high" },
    });
    // The preflight ran against the base configuration before the prompt was sent.
    expect(state.calls).toEqual(["server.info", "model.list:/base", "plugin.list", "plugin.list"]);
    expect(server.requests.map((entry) => entry.path)).toEqual([
      "/openapi.json",
      OPENCODE_TEXT_ROUTE,
    ]);
    expect(state.released).toBe(1);
  });

  test("omits the variant when no thinking option is requested", async () => {
    const server = await startServer(openCodeHandler());
    const result = await textGeneration(harness({ baseUrl: server.url })).generate({
      model: "mock/mock-model",
      prompt: PROMPT,
      signal: AbortSignal.timeout(5_000),
    });
    expect(result.thinkingOptionId).toBeNull();
    expect(JSON.parse(generateCalls(server)[0].body).model).toEqual({
      providerID: "mock",
      id: "mock-model",
    });
  });

  test("reports models and limitations without sending a prompt", async () => {
    const server = await startServer(openCodeHandler());
    const capability = await textGeneration(harness({ baseUrl: server.url })).getCapability({
      signal: AbortSignal.timeout(5_000),
    });
    expect(capability).toEqual({
      runtimeVersion: "2.2.6",
      models: [
        { id: "mock/mock-model", label: "Synthetic mock-model", thinkingOptionIds: ["high"] },
      ],
      limitations: [
        "provider_runtime_builtin_hooks_unobserved",
        "provider_runtime_mcp_servers_connect",
        "prompt_sent_to_provider_runtime_and_model_provider",
      ],
    });
    expect(generateCalls(server)).toHaveLength(0);
  });

  test("waits for the base configuration's models to load before deciding", async () => {
    const server = await startServer(openCodeHandler());
    let lists = 0;
    const state = harness(
      { baseUrl: server.url },
      { models: () => (++lists < 3 ? [] : [model("mock/mock-model")]) },
    );
    await textGeneration(state, 5_000).generate({
      model: "mock/mock-model",
      prompt: PROMPT,
      signal: AbortSignal.timeout(5_000),
    });
    expect(lists).toBe(3);
    expect(generateCalls(server)).toHaveLength(1);
  });

  describe("refuses before the prompt leaves the daemon", () => {
    test("an OpenCode version that has not been validated", async () => {
      const server = await startServer(openCodeHandler());
      const error = await expectRefusal(
        textGeneration(harness({ baseUrl: server.url }, { version: "2.2.7" })).generate({
          model: "mock/mock-model",
          prompt: PROMPT,
          signal: AbortSignal.timeout(5_000),
        }),
        "version_unsupported",
        "no",
      );
      expect(error.message).toContain("2.0.10, 2.2.6, 2.3.2");
      expect(server.requests).toHaveLength(0);
    });

    test.each([
      ["missing route", { paths: {} }],
      [
        "extra request field",
        openApi({
          post: {
            ...ROUTE_SPEC.post,
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { prompt: { type: "string" }, model: {}, tools: { type: "array" } },
                    required: ["prompt"],
                    additionalProperties: false,
                  },
                },
              },
            },
          },
        }),
      ],
      [
        "session-scoped operation",
        openApi({ post: { ...ROUTE_SPEC.post, operationId: "session.generate" } }),
      ],
    ])("a route description that is not the validated shape: %s", async (_name, spec) => {
      const server = await startServer(openCodeHandler({ spec }));
      await expectRefusal(
        textGeneration(harness({ baseUrl: server.url })).generate({
          model: "mock/mock-model",
          prompt: PROMPT,
          signal: AbortSignal.timeout(5_000),
        }),
        "route_unverified",
        "no",
      );
      expect(generateCalls(server)).toHaveLength(0);
    });

    test("a model that is not in the base configuration, such as a project-only model", async () => {
      const server = await startServer(openCodeHandler());
      const error = await expectRefusal(
        textGeneration(harness({ baseUrl: server.url })).generate({
          model: "projonly/proj-model",
          prompt: PROMPT,
          signal: AbortSignal.timeout(5_000),
        }),
        "model_unavailable",
        "no",
      );
      expect(error.message).toContain("project's opencode.json");
      expect(generateCalls(server)).toHaveLength(0);
    });

    test("a thinking option the model does not offer, instead of substituting one", async () => {
      const server = await startServer(openCodeHandler());
      await expectRefusal(
        textGeneration(harness({ baseUrl: server.url })).generate({
          model: "mock/mock-model",
          thinkingOptionId: "max",
          prompt: PROMPT,
          signal: AbortSignal.timeout(5_000),
        }),
        "thinking_option_unavailable",
        "no",
      );
      expect(generateCalls(server)).toHaveLength(0);
    });

    test.each([
      ["a third-party plugin", local("hook-probe", "/home/plugins/hook-probe")],
      ["a plugin claiming Paseo's ID from elsewhere", local("paseo", "/home/plugins/not-paseo")],
    ])("%s loaded in the base configuration", async (_name, plugin) => {
      const server = await startServer(openCodeHandler());
      const error = await expectRefusal(
        textGeneration(
          harness({ baseUrl: server.url }, { plugins: [builtin("opencode.agent"), plugin] }),
        ).generate({
          model: "mock/mock-model",
          prompt: PROMPT,
          signal: AbortSignal.timeout(5_000),
        }),
        "plugins_unverified",
        "no",
      );
      expect(error.message).toContain(plugin.id);
      expect(generateCalls(server)).toHaveLength(0);
    });

    test("a third-party plugin that registers after a cold location first lists nothing", async () => {
      // Regression: a cold base location lists no plugins until all of them register at once.
      const server = await startServer(openCodeHandler());
      let lists = 0;
      const plugins = () =>
        ++lists === 1
          ? []
          : [builtin("opencode.agent"), local("hook-probe", "/home/plugins/hook-probe")];
      await expectRefusal(
        textGeneration(harness({ baseUrl: server.url }, { plugins })).generate({
          model: "mock/mock-model",
          prompt: PROMPT,
          signal: AbortSignal.timeout(5_000),
        }),
        "plugins_unverified",
        "no",
      );
      expect(generateCalls(server)).toHaveLength(0);
    });

    test("a plugin inventory that never settles", async () => {
      const server = await startServer(openCodeHandler());
      let lists = 0;
      const plugins = () => [builtin(`opencode.changing-${++lists}`)];
      await expectRefusal(
        textGeneration(harness({ baseUrl: server.url }, { plugins })).generate({
          model: "mock/mock-model",
          prompt: PROMPT,
          signal: AbortSignal.timeout(5_000),
        }),
        "route_unverified",
        "no",
      );
      expect(generateCalls(server)).toHaveLength(0);
    });

    test("an explicitly configured OpenCode server that is not on loopback", async () => {
      const server = await startServer(openCodeHandler());
      const state = harness({ kind: "explicit", baseUrl: "http://203.0.113.10:4096" });
      await expectRefusal(
        textGeneration(state).generate({
          model: "mock/mock-model",
          prompt: PROMPT,
          signal: AbortSignal.timeout(5_000),
        }),
        "remote_server_refused",
        "no",
      );
      // Nothing is contacted, and nothing falls back to another server.
      expect(state.calls).toEqual([]);
      expect(server.requests).toHaveLength(0);
    });

    test("a shared server that cannot read the expected configuration directory", async () => {
      const server = await startServer(openCodeHandler());
      const error = await expectRefusal(
        textGeneration(
          harness({ kind: "discovered", baseUrl: server.url }, { configDirectories: "fails" }),
        ).generate({
          model: "mock/mock-model",
          prompt: PROMPT,
          signal: AbortSignal.timeout(5_000),
        }),
        "route_unverified",
        "no",
      );
      expect(error.message).toContain("/base");
      expect(generateCalls(server)).toHaveLength(0);
    });

    test("a shared server whose configuration directory cannot be confirmed", async () => {
      const server = await startServer(openCodeHandler());
      await expectRefusal(
        textGeneration(
          harness(
            { kind: "discovered", baseUrl: server.url },
            { configDirectories: ["/elsewhere"] },
          ),
        ).generate({
          model: "mock/mock-model",
          prompt: PROMPT,
          signal: AbortSignal.timeout(5_000),
        }),
        "route_unverified",
        "no",
      );
      expect(generateCalls(server)).toHaveLength(0);
    });

    test("an empty prompt or a malformed model name", async () => {
      const server = await startServer(openCodeHandler());
      const generation = textGeneration(harness({ baseUrl: server.url }));
      const signal = AbortSignal.timeout(5_000);
      await expectRefusal(
        generation.generate({ model: "mock/mock-model", prompt: "  ", signal }),
        "invalid_request",
        "no",
      );
      await expectRefusal(
        generation.generate({ model: "mock-model", prompt: PROMPT, signal }),
        "invalid_request",
        "no",
      );
      expect(server.requests).toHaveLength(0);
    });

    test("a redirect while reading the route description", async () => {
      const target = await startServer(openCodeHandler());
      const server = await startServer(redirectHandler(307, `${target.url}/openapi.json`));
      await expectRefusal(
        textGeneration(harness({ baseUrl: server.url })).generate({
          model: "mock/mock-model",
          prompt: PROMPT,
          signal: AbortSignal.timeout(5_000),
        }),
        "route_unverified",
        "no",
      );
      expect(target.requests).toHaveLength(0);
    });
  });

  describe("after the prompt was sent", () => {
    test.each([307, 308])("does not follow an HTTP %i redirect with the prompt", async (status) => {
      const target = await startServer(openCodeHandler({ text: "FROM-REDIRECT-TARGET" }));
      const server = await startServer(
        openCodeHandler({
          generate: redirectHandler(status, `${target.url}${OPENCODE_TEXT_ROUTE}`),
        }),
      );
      await expectRefusal(
        textGeneration(harness({ baseUrl: server.url })).generate({
          model: "mock/mock-model",
          prompt: PROMPT,
          signal: AbortSignal.timeout(5_000),
        }),
        "generation_failed",
        "possibly",
      );
      expect(target.requests).toHaveLength(0);
    });

    test("the shared OpenCode client follows such a redirect with the prompt body", async () => {
      // Why the route does not use the generated client: its default fetch forwards the POST.
      const target = await startServer(openCodeHandler({ text: "FROM-REDIRECT-TARGET" }));
      const server = await startServer(
        redirectHandler(
          307,
          `${target.url.replace("127.0.0.1", "localhost")}${OPENCODE_TEXT_ROUTE}`,
        ),
      );
      const client = OpenCode.make({ baseUrl: server.url });
      await expect(client.generate.text({ prompt: PROMPT })).resolves.toEqual({
        text: "FROM-REDIRECT-TARGET",
      });
      expect(promptsReceived(target)).toEqual([PROMPT]);
    });

    test("an empty model answer is an error, not a translation", async () => {
      const server = await startServer(openCodeHandler({ text: "   " }));
      await expectRefusal(
        textGeneration(harness({ baseUrl: server.url })).generate({
          model: "mock/mock-model",
          prompt: PROMPT,
          signal: AbortSignal.timeout(5_000),
        }),
        "empty_result",
        "possibly",
      );
    });

    test("an OpenCode error keeps its class and drops provider details, and is not retried", async () => {
      const server = await startServer(
        openCodeHandler({
          generate: jsonHandler(503, {
            _tag: "ProviderRequestError",
            reason: "rate_limit",
            message: "upstream said SYNTHETIC-SECRET-DETAIL",
          }),
        }),
      );
      const error = await expectRefusal(
        textGeneration(harness({ baseUrl: server.url })).generate({
          model: "mock/mock-model",
          prompt: PROMPT,
          signal: AbortSignal.timeout(5_000),
        }),
        "generation_failed",
        "possibly",
      );
      expect(error.message).toBe("OpenCode returned HTTP 503 (ProviderRequestError: rate_limit)");
      expect(generateCalls(server)).toHaveLength(1);
    });

    test("a deadline aborts the request in flight", async () => {
      const server = await startServer(openCodeHandler({ generate: hang }));
      await expectRefusal(
        textGeneration(harness({ baseUrl: server.url })).generate({
          model: "mock/mock-model",
          prompt: PROMPT,
          signal: AbortSignal.timeout(300),
        }),
        "timeout",
        "possibly",
      );
      await expect.poll(closedEarlyOf(server)).toBe(1);
    });

    test("cancelling aborts the request in flight", async () => {
      const server = await startServer(openCodeHandler({ generate: hang }));
      const cancel = new AbortController();
      const pending = textGeneration(harness({ baseUrl: server.url })).generate({
        model: "mock/mock-model",
        prompt: PROMPT,
        signal: cancel.signal,
      });
      await expect.poll(generateCountOf(server)).toBe(1);
      cancel.abort();
      await expectRefusal(pending, "cancelled", "possibly");
      await expect.poll(closedEarlyOf(server)).toBe(1);
    });
  });

  test("accepts Paseo's own plugin from Paseo's runtime directory", async () => {
    const server = await startServer(openCodeHandler());
    await textGeneration(
      harness(
        { baseUrl: server.url },
        {
          plugins: [
            builtin("opencode.agent"),
            local("paseo", "/paseo-home/runtime/opencode/paseo-v2-abc"),
          ],
        },
      ),
    ).generate({ model: "mock/mock-model", prompt: PROMPT, signal: AbortSignal.timeout(5_000) });
    expect(generateCalls(server)).toHaveLength(1);
  });

  test("recognises Paseo's plugin when OpenCode reports it by its real path", async () => {
    // Regression: OpenCode 2.0.10 reports /private/tmp/... for a plugin Paseo wrote under /tmp/...
    const root = mkdtempSync(nodePath.join(os.tmpdir(), "paseo-text-root-"));
    try {
      const pluginDirectory = nodePath.join(root, "paseo-v2-abc");
      mkdirSync(pluginDirectory);
      const server = await startServer(openCodeHandler());
      const state = harness(
        { baseUrl: server.url },
        { plugins: [builtin("opencode.agent"), local("paseo", realpathSync(pluginDirectory))] },
      );
      const generation = createOpenCodeTextGeneration({
        acquire: async () => state.connection,
        // A root whose spelling differs from its real path, as /tmp does on macOS.
        paseoPluginRoots: [nodePath.join(root, ".", "")],
        modelWaitMs: 0,
      });
      await generation.generate({
        model: "mock/mock-model",
        prompt: PROMPT,
        signal: AbortSignal.timeout(5_000),
      });
      expect(generateCalls(server)).toHaveLength(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("refuses a connection that cannot describe its endpoint", async () => {
    const server = await startServer(openCodeHandler());
    const state = harness({ baseUrl: server.url });
    const { textEndpoint: _omitted, ...connection } = state.connection;
    const generation = createOpenCodeTextGeneration({
      acquire: async () => connection,
      paseoPluginRoots: [],
    });
    await expectRefusal(
      generation.generate({
        model: "mock/mock-model",
        prompt: PROMPT,
        signal: AbortSignal.timeout(5_000),
      }),
      "unsupported",
      "no",
    );
    expect(server.requests).toHaveLength(0);
  });
});
