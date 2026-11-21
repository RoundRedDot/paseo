import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { setTimeout as sleep } from "node:timers/promises";

/**
 * A loopback stand-in for an OpenAI-compatible gateway's `/v1/responses`. It records every
 * request and answers with what the test sets; no real gateway, model or credential is used.
 */

export interface RecordedGatewayRequest {
  method: string;
  path: string;
  authorization: string | undefined;
  body: unknown;
}

export interface GatewayAnswer {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
  /** Raw text instead of JSON. */
  raw?: string;
  /** Wait for this long before answering, or until the client disconnects. */
  delayMs?: number;
}

export interface SyntheticResponsesGateway {
  origin: string;
  baseUrl: string;
  requests: RecordedGatewayRequest[];
  answer(next: GatewayAnswer | ((request: RecordedGatewayRequest) => GatewayAnswer)): void;
  close(): Promise<void>;
}

export function textAnswer(text: string): GatewayAnswer {
  return {
    body: {
      id: "resp_synthetic",
      object: "response",
      status: "completed",
      output: [
        {
          type: "message",
          role: "assistant",
          status: "completed",
          content: [{ type: "output_text", text, annotations: [] }],
        },
      ],
    },
  };
}

export function toolCallAnswer(type = "function_call"): GatewayAnswer {
  return {
    body: {
      id: "resp_synthetic",
      object: "response",
      status: "completed",
      output: [
        { type, call_id: "call_1", name: "shell", arguments: '{"command":"touch /tmp/pwned"}' },
      ],
    },
  };
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

export async function startSyntheticResponsesGateway(): Promise<SyntheticResponsesGateway> {
  const requests: RecordedGatewayRequest[] = [];
  let next: GatewayAnswer | ((request: RecordedGatewayRequest) => GatewayAnswer) =
    textAnswer("synthetic translation");
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    void (async () => {
      const recorded: RecordedGatewayRequest = {
        method: request.method ?? "",
        path: request.url ?? "",
        authorization: request.headers.authorization,
        body: await readBody(request),
      };
      requests.push(recorded);
      const answer = typeof next === "function" ? next(recorded) : next;
      if (answer.delayMs) {
        const closed = new AbortController();
        response.on("close", () => closed.abort());
        await sleep(answer.delayMs, undefined, { signal: closed.signal }).catch(() => undefined);
        if (response.destroyed) return;
      }
      const raw = answer.raw ?? JSON.stringify(answer.body ?? {});
      response.writeHead(answer.status ?? 200, {
        "content-type": "application/json",
        ...answer.headers,
      });
      response.end(raw);
    })();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  const origin = `http://127.0.0.1:${port}`;
  return {
    origin,
    baseUrl: `${origin}/v1`,
    requests,
    answer(value) {
      next = value;
    },
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}
