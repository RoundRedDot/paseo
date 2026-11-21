import { describe, expect, test } from "vitest";
import { PersistedConfigSchema } from "./persisted-config.js";
import { TextGenerationCredentialSchema } from "./text-generation-credentials.js";

const VALID = {
  source: "macos-keychain",
  service: "paseo.text-generation.newapi",
  account: "synthetic-account",
  origin: "https://gateway.example.com",
};

describe("text generation credentials", () => {
  test("config.json accepts a Paseo Keychain item bound to one https origin", () => {
    expect(
      PersistedConfigSchema.parse({ textGenerationCredentials: { newapi: VALID } })
        .textGenerationCredentials,
    ).toEqual({ newapi: VALID });
    expect(
      TextGenerationCredentialSchema.safeParse({ ...VALID, origin: "http://127.0.0.1:8080" })
        .success,
    ).toBe(true);
  });

  test.each([
    { field: "service", value: "codex-newapi", why: "another app's item" },
    { field: "service", value: "paseo.text-generation.", why: "no item name" },
    { field: "account", value: "-g", why: "an option for security" },
    { field: "account", value: "", why: "a blank account" },
    { field: "account", value: "a\nb", why: "a control character" },
    { field: "origin", value: "https://gateway.example.com/v1", why: "a path" },
    { field: "origin", value: "https://gateway.example.com/", why: "a trailing slash" },
    { field: "origin", value: "http://gateway.example.com", why: "plain http off loopback" },
    { field: "origin", value: "https://user@gateway.example.com", why: "credentials" },
    { field: "source", value: "command", why: "a command source" },
  ])("refuses $field $value ($why)", ({ field, value }) => {
    expect(TextGenerationCredentialSchema.safeParse({ ...VALID, [field]: value }).success).toBe(
      false,
    );
  });

  test("refuses unknown fields, such as a command to run", () => {
    expect(
      TextGenerationCredentialSchema.safeParse({ ...VALID, command: ["/bin/sh", "-c", "x"] })
        .success,
    ).toBe(false);
  });
});
