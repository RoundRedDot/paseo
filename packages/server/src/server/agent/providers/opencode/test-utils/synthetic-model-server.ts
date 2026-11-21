import http from "node:http";
import type { AddressInfo } from "node:net";

/**
 * A loopback OpenAI-compatible chat endpoint and streamable-HTTP MCP server for OpenCode tests.
 * It never calls a real model. In `hostile` mode it answers with tool calls whether or not the
 * request declared tools, so a test can tell whether the runtime executes them.
 */
export type SyntheticModelMode = "text" | "hostile" | "slow";

export interface SyntheticModelRequest {
  kind: "model";
  path: string;
  body: {
    model?: string;
    messages?: Array<{ role: string; content?: unknown; tool_calls?: unknown[] }>;
    tools?: Array<{ function?: { name?: string } }>;
    tool_choice?: unknown;
    stream?: boolean;
    [key: string]: unknown;
  };
  declaredTools: string[];
  headers: Record<string, string>;
}

export type SyntheticRecord =
  | SyntheticModelRequest
  | { kind: "mcp"; method: string }
  | { kind: "mcp_tool_call"; name: string }
  | { kind: "upstream_closed" };

export const SYNTHETIC_API_KEY = "synthetic-not-a-secret";
export const SYNTHETIC_TEXT = "SYNTHETIC-TRANSLATION-OK";

export interface SyntheticModelServer {
  url: string;
  records: SyntheticRecord[];
  modelRequests(): SyntheticModelRequest[];
  setMode(mode: SyntheticModelMode): void;
  /** Files a hostile answer asks the shell and write tools to create. */
  canaries: { shell: string; write: string };
  close(): Promise<void>;
}

export async function startSyntheticModelServer(canaries: {
  shell: string;
  write: string;
}): Promise<SyntheticModelServer> {
  const records: SyntheticRecord[] = [];
  let mode: SyntheticModelMode = "text";
  let sequence = 0;

  function answer(body: SyntheticModelRequest["body"], declared: string[]) {
    if (mode !== "hostile") return { text: SYNTHETIC_TEXT, calls: [] };
    if ((body.messages ?? []).some((message) => message.role === "tool"))
      return { text: "SYNTHETIC-AFTER-TOOL", calls: [] };
    const pick = (fallback: string, match: (name: string) => boolean) =>
      declared.find(match) ?? fallback;
    return {
      text: "",
      calls: [
        {
          name: pick("probe_probe_canary", (name) => name.includes("probe_canary")),
          args: { note: "SYNTHETIC" },
        },
        {
          name: pick("bash", (name) => name === "shell" || name === "bash"),
          args: { command: `touch ${canaries.shell}`, description: "synthetic" },
        },
        {
          name: pick("write", (name) => name === "write"),
          args: { filePath: canaries.write, content: "SYNTHETIC" },
        },
      ],
    };
  }

  function sendCompletion(
    res: http.ServerResponse,
    body: SyntheticModelRequest["body"],
    reply: { text: string; calls: Array<{ name: string; args: unknown }> },
  ) {
    const id = `chatcmpl-${++sequence}`;
    const created = Math.floor(Date.now() / 1000);
    const toolCalls = reply.calls.map((call, index) => ({
      index,
      id: `call_${sequence}_${index}`,
      type: "function",
      function: { name: call.name, arguments: JSON.stringify(call.args) },
    }));
    const finish = toolCalls.length > 0 ? "tool_calls" : "stop";
    const usage = { prompt_tokens: 11, completion_tokens: 7, total_tokens: 18 };
    const chunk = (delta: unknown, finishReason: string | null, extra: object = {}) =>
      `data: ${JSON.stringify({
        id,
        object: "chat.completion.chunk",
        created,
        model: body.model,
        choices: [{ index: 0, delta, finish_reason: finishReason }],
        ...extra,
      })}\n\n`;
    if (body.stream) {
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
      res.write(chunk({ role: "assistant", content: "" }, null));
      if (reply.text) res.write(chunk({ content: reply.text }, null));
      if (toolCalls.length > 0) res.write(chunk({ tool_calls: toolCalls }, null));
      res.write(chunk({}, finish, { usage }));
      res.end("data: [DONE]\n\n");
      return;
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        id,
        object: "chat.completion",
        created,
        model: body.model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: reply.text || null,
              ...(toolCalls.length > 0
                ? { tool_calls: toolCalls.map(({ index: _index, ...call }) => call) }
                : {}),
            },
            finish_reason: finish,
          },
        ],
        usage,
      }),
    );
  }

  function handleMcp(
    res: http.ServerResponse,
    rpc: { id?: unknown; method?: string; params?: { name?: string; protocolVersion?: string } },
  ) {
    records.push({ kind: "mcp", method: rpc.method ?? "" });
    const reply = (result: unknown) => {
      res.writeHead(200, { "content-type": "application/json", "mcp-session-id": "synthetic" });
      res.end(JSON.stringify({ jsonrpc: "2.0", id: rpc.id, result }));
    };
    if (rpc.method === "initialize")
      return reply({
        protocolVersion: rpc.params?.protocolVersion ?? "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "probe", version: "0.0.1" },
      });
    if (rpc.method?.startsWith("notifications/")) {
      res.writeHead(202);
      res.end();
      return;
    }
    if (rpc.method === "tools/list")
      return reply({
        tools: [
          {
            name: "probe_canary",
            description: "Synthetic probe tool that records each call.",
            inputSchema: { type: "object", properties: { note: { type: "string" } } },
          },
        ],
      });
    if (rpc.method === "tools/call") {
      records.push({ kind: "mcp_tool_call", name: rpc.params?.name ?? "" });
      return reply({ content: [{ type: "text", text: "recorded" }] });
    }
    return reply({});
  }

  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk: Buffer) => (raw += chunk.toString()));
    req.on("end", () => {
      let body: Record<string, unknown> = {};
      try {
        body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      } catch {
        body = {};
      }
      const pathname = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
      if (pathname === "/mcp") {
        if (req.method !== "POST") {
          res.writeHead(405);
          res.end();
          return;
        }
        handleMcp(res, body);
        return;
      }
      if (pathname.endsWith("/chat/completions")) {
        const typed = body as SyntheticModelRequest["body"];
        const declared = (typed.tools ?? []).map((tool) => tool.function?.name ?? "");
        const headers = Object.fromEntries(
          Object.entries(req.headers).map(([key, value]) => [key, summarizeHeader(key, value)]),
        );
        records.push({
          kind: "model",
          path: pathname,
          body: typed,
          declaredTools: declared,
          headers,
        });
        if (mode === "slow") {
          res.on("close", () => {
            if (!res.writableEnded) records.push({ kind: "upstream_closed" });
          });
          return;
        }
        sendCompletion(res, typed, answer(typed, declared));
        return;
      }
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "not found" }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    records,
    modelRequests: () =>
      records.filter((record): record is SyntheticModelRequest => record.kind === "model"),
    setMode: (next) => {
      mode = next;
    },
    canaries,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}

function summarizeHeader(key: string, value: string | string[] | undefined): string {
  if (key !== "authorization") return String(value);
  return String(value).includes(SYNTHETIC_API_KEY) ? "<synthetic-key>" : "<other>";
}

/** Source of a test-only OpenCode v2 plugin that appends each hook invocation to `log`. */
export const HOOK_PROBE_PLUGIN = `import { appendFileSync } from "node:fs";
export default {
  id: "hook-probe",
  async setup(context) {
    const log = context.options.log;
    const write = (entry) => appendFileSync(log, JSON.stringify({ t: Date.now(), ...entry }) + "\\n");
    const plan = [
      ["session", ["context", "compaction", "generate", "title", "model.request", "http.request", "http.response", "retry"]],
      ["aisdk", ["sdk", "language"]],
      ["tool", ["execute.before", "execute.after"]],
      ["permission", ["evaluate"]],
    ];
    const disposers = [];
    for (const [namespace, names] of plan) {
      for (const name of names) {
        disposers.push(await context[namespace].hook(name, async (input) => {
          write({ hook: namespace + "." + name, sessionID: input?.sessionID ?? null });
        }));
      }
    }
    write({ hook: "setup", location: context.location.directory });
    return async () => { for (const disposer of disposers) await disposer?.dispose?.(); };
  },
};
`;
