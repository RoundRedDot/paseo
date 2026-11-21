import { describe, expect, test, vi } from "vitest";
import { createTestLogger } from "../../test-utils/test-logger.js";
import type { TextGenerationCredentials } from "../text-generation-credentials.js";
import { buildProviderRegistry } from "./provider-registry.js";
import type { ProviderOverride } from "./provider-launch-config.js";

const logger = createTestLogger();
const ORIGIN = "https://gateway.example.com";
const credentials: TextGenerationCredentials = {
  newapi: {
    source: "macos-keychain",
    service: "paseo.text-generation.newapi",
    account: "synthetic-account",
    origin: ORIGIN,
  },
  "claude-like": {
    source: "macos-keychain",
    service: "paseo.text-generation.claude-like",
    account: "synthetic-account",
    origin: ORIGIN,
  },
  codex: {
    source: "macos-keychain",
    service: "paseo.text-generation.codex",
    account: "synthetic-account",
    origin: ORIGIN,
  },
};
const overrides: Record<string, ProviderOverride> = {
  newapi: {
    extends: "codex",
    label: "NewAPI",
    env: { OPENAI_BASE_URL: `${ORIGIN}/v1`, OPENAI_API_KEY: "placeholder" },
    models: [{ id: "deepseek-flash", label: "DeepSeek Flash" }],
  },
  "plain-codex": {
    extends: "codex",
    label: "Plain Codex",
    env: { OPENAI_BASE_URL: `${ORIGIN}/v1`, OPENAI_API_KEY: "a-real-looking-key" },
    models: [{ id: "deepseek-flash", label: "DeepSeek Flash" }],
  },
  "claude-like": { extends: "claude", label: "Claude-like", env: { ANTHROPIC_BASE_URL: ORIGIN } },
};

function client(provider: string, textGenerationCredentials?: TextGenerationCredentials) {
  const readSecret = vi.fn(async () => "sk-synthetic");
  const registry = buildProviderRegistry(logger, {
    providerOverrides: overrides,
    textGenerationCredentials,
    textGenerationDeps: { readSecret, platform: "darwin" },
  });
  return { client: registry[provider]!.createClient(logger), readSecret };
}

describe("one-shot text generation in the provider registry", () => {
  test("a Codex custom provider gets the route only when the credentials section names it", async () => {
    const { client: newapi, readSecret } = client("newapi", credentials);
    expect(newapi.textGeneration).toBeDefined();
    await expect(
      newapi.textGeneration!.getCapability({ signal: AbortSignal.timeout(1000) }),
    ).resolves.toMatchObject({
      models: [{ id: "deepseek-flash", thinkingOptionIds: [] }],
    });
    expect(readSecret).not.toHaveBeenCalled();
    expect(client("newapi").client.textGeneration).toBeUndefined();
  });

  test.each([
    // An API key in the provider's env is never used: only the Keychain entry enables the route.
    { provider: "plain-codex", why: "has a key in env but no credentials entry" },
    { provider: "claude-like", why: "is not a Codex custom provider" },
    { provider: "codex", why: "is built-in Codex, which signs in its own way" },
  ])("$provider gets no route: it $why", ({ provider }) => {
    expect(client(provider, credentials).client.textGeneration).toBeUndefined();
  });
});
