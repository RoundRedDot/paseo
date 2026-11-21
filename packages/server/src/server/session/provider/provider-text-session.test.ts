import type pino from "pino";
import type { SessionOutboundMessage } from "@getpaseo/protocol/messages";
import { describe, expect, test } from "vitest";
import {
  TextGenerationError,
  type AgentTextGeneration,
  type TextGenerationRequest,
} from "../../agent/text-generation.js";
import { ProviderTextSession } from "./provider-text-session.js";

const PROMPT = "SYNTHETIC-PROMPT do not log me";

interface Recording {
  emitted: SessionOutboundMessage[];
  requests: TextGenerationRequest[];
  logs: unknown[];
}

function setup(
  options: {
    status?: "ok" | "disabled" | "unavailable" | "unsupported";
    serverId?: string;
    generate?: AgentTextGeneration["generate"];
  } = {},
) {
  const recording: Recording = { emitted: [], requests: [], logs: [] };
  const textGeneration: AgentTextGeneration = {
    getCapability: async () => ({ runtimeVersion: "2.2.6", models: [], limitations: ["x"] }),
    generate: async (request) => {
      recording.requests.push(request);
      if (options.generate) return options.generate(request);
      return {
        text: "SYNTHETIC-OUT",
        model: request.model,
        thinkingOptionId: null,
        runtimeVersion: "2.2.6",
      };
    },
  };
  const logger = {
    warn: (...args: unknown[]) => recording.logs.push(args),
  } as unknown as pino.Logger;
  const session = new ProviderTextSession({
    emit: (msg) => recording.emitted.push(msg),
    getTextGeneration: () =>
      (options.status ?? "ok") === "ok"
        ? { status: "ok", textGeneration }
        : { status: options.status as "disabled" | "unavailable" | "unsupported" },
    serverId: "serverId" in options ? options.serverId : "srv-a",
    logger,
  });
  return { session, recording };
}

function generateRequest(overrides: Record<string, unknown> = {}) {
  return {
    type: "provider.text.generate.request" as const,
    requestId: "req-1",
    provider: "opencode",
    serverId: "srv-a",
    model: "mock/mock-model",
    prompt: PROMPT,
    ...overrides,
  };
}

function lastGenerateResult(recording: Recording) {
  const message = recording.emitted.at(-1);
  if (message?.type !== "provider.text.generate.response") throw new Error("no generate response");
  return message.payload;
}

describe("ProviderTextSession", () => {
  test("returns the generated text with the answering host", async () => {
    const { session, recording } = setup();
    await session.handleGenerate(generateRequest({ thinkingOptionId: "high" }));
    expect(lastGenerateResult(recording)).toEqual({
      requestId: "req-1",
      provider: "opencode",
      serverId: "srv-a",
      result: {
        status: "ok",
        text: "SYNTHETIC-OUT",
        model: "mock/mock-model",
        thinkingOptionId: null,
        runtimeVersion: "2.2.6",
      },
    });
    expect(recording.requests[0]).toMatchObject({ thinkingOptionId: "high", prompt: PROMPT });
  });

  test.each([
    ["a request for another host", { serverId: "srv-a" }, { serverId: "srv-b" }, "server_mismatch"],
    ["a host without a server ID", { serverId: undefined }, {}, "server_mismatch"],
    ["a disabled provider", { status: "disabled" as const }, {}, "provider_unavailable"],
    ["an unregistered provider", { status: "unavailable" as const }, {}, "provider_unavailable"],
    ["a provider without the route", { status: "unsupported" as const }, {}, "unsupported"],
  ])("refuses %s without reaching the provider", async (_name, options, request, code) => {
    const { session, recording } = setup(options);
    await session.handleGenerate(generateRequest(request));
    expect(lastGenerateResult(recording).result).toEqual({
      status: "error",
      error: expect.objectContaining({ code, promptSent: "no" }),
    });
    expect(recording.requests).toHaveLength(0);
  });

  test("passes a provider failure through with its delivery claim and logs no prompt", async () => {
    const { session, recording } = setup({
      generate: async () => {
        throw new TextGenerationError(
          "generation_failed",
          "OpenCode returned HTTP 500",
          "possibly",
        );
      },
    });
    await session.handleGenerate(generateRequest());
    expect(lastGenerateResult(recording).result).toEqual({
      status: "error",
      error: {
        code: "generation_failed",
        message: "OpenCode returned HTTP 500",
        promptSent: "possibly",
      },
    });
    expect(JSON.stringify(recording.logs)).not.toContain("SYNTHETIC-PROMPT");
  });

  test("an unknown failure never claims the prompt was not sent", async () => {
    const { session, recording } = setup({
      generate: async () => {
        throw new Error("boom with details");
      },
    });
    await session.handleGenerate(generateRequest());
    expect(lastGenerateResult(recording).result).toEqual({
      status: "error",
      error: {
        code: "generation_failed",
        message: "One-shot text generation failed",
        promptSent: "possibly",
      },
    });
  });

  test("cancel aborts the in-flight request's signal", async () => {
    let observed: AbortSignal | undefined;
    const { session, recording } = setup({
      generate: (request) =>
        new Promise((_resolve, reject) => {
          observed = request.signal;
          request.signal.addEventListener("abort", () =>
            reject(new TextGenerationError("cancelled", "cancelled", "possibly")),
          );
        }),
    });
    const pending = session.handleGenerate(generateRequest());
    await expect.poll(() => observed).toBeDefined();
    session.handleCancel({
      type: "provider.text.cancel.request",
      requestId: "c-1",
      targetRequestId: "req-1",
    });
    await pending;
    expect(observed?.aborted).toBe(true);
    expect(recording.emitted).toContainEqual({
      type: "provider.text.cancel.response",
      payload: { requestId: "c-1", targetRequestId: "req-1", cancelled: true },
    });
    expect(lastGenerateResult(recording).result).toMatchObject({
      status: "error",
      error: { code: "cancelled" },
    });
  });

  test("closing the session aborts requests in flight", async () => {
    let observed: AbortSignal | undefined;
    const { session } = setup({
      generate: (request) =>
        new Promise((_resolve, reject) => {
          observed = request.signal;
          request.signal.addEventListener("abort", () => reject(request.signal.reason));
        }),
    });
    const pending = session.handleGenerate(generateRequest());
    await expect.poll(() => observed).toBeDefined();
    session.dispose();
    await pending;
    expect(observed?.aborted).toBe(true);
  });

  test("applies the requested deadline to the provider signal", async () => {
    let signal: AbortSignal | undefined;
    const { session } = setup({
      generate: async (request) => {
        signal = request.signal;
        return { text: "x", model: request.model, thinkingOptionId: null, runtimeVersion: "2.2.6" };
      },
    });
    await session.handleGenerate(generateRequest({ timeoutMs: 1 }));
    expect(signal?.aborted).toBe(false);
    await expect.poll(() => signal?.aborted).toBe(true);
  });

  test("refuses a duplicate request ID while the first is running", async () => {
    let release!: () => void;
    const { session, recording } = setup({
      generate: (request) =>
        new Promise((resolve) => {
          release = () =>
            resolve({
              text: "x",
              model: request.model,
              thinkingOptionId: null,
              runtimeVersion: "2.2.6",
            });
        }),
    });
    const first = session.handleGenerate(generateRequest());
    await expect.poll(() => recording.requests.length).toBe(1);
    await session.handleGenerate(generateRequest());
    expect(lastGenerateResult(recording).result).toMatchObject({
      status: "error",
      error: { code: "invalid_request", promptSent: "no" },
    });
    release();
    await first;
    expect(recording.requests).toHaveLength(1);
  });

  test("reports capability with limitations, and unsupported providers as unsupported", async () => {
    const supported = setup();
    await supported.session.handleGetCapability({
      type: "provider.text.get_capability.request",
      requestId: "cap-1",
      provider: "opencode",
    });
    expect(supported.recording.emitted.at(-1)).toEqual({
      type: "provider.text.get_capability.response",
      payload: {
        requestId: "cap-1",
        provider: "opencode",
        serverId: "srv-a",
        supported: true,
        runtimeVersion: "2.2.6",
        models: [],
        limitations: ["x"],
        error: null,
      },
    });
    const unsupported = setup({ status: "unsupported" });
    await unsupported.session.handleGetCapability({
      type: "provider.text.get_capability.request",
      requestId: "cap-2",
      provider: "claude",
    });
    expect(unsupported.recording.emitted.at(-1)).toMatchObject({
      payload: { supported: false, models: [], error: { code: "unsupported", promptSent: "no" } },
    });
  });
});
