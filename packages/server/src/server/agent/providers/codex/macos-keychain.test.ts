import { describe, expect, test, vi } from "vitest";
import { TextGenerationError } from "../../text-generation.js";
import { createMacosKeychainReader, type KeychainCommandRunner } from "./macos-keychain.js";

const ITEM = { service: "paseo.text-generation.synthetic", account: "synthetic-account" };
const SECRET = "sk-synthetic-secret-0123456789";

function runner(result: { exitCode: number | null; stdout?: string }) {
  return vi.fn<KeychainCommandRunner>(async () => ({
    exitCode: result.exitCode,
    stdout: Buffer.from(result.stdout ?? ""),
  }));
}

async function failure(read: Promise<string>): Promise<TextGenerationError> {
  const error = await read.then(
    () => null,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(TextGenerationError);
  return error as TextGenerationError;
}

describe("macOS Keychain reader", () => {
  test("runs only find-generic-password with the item's service and account, and trims one newline", async () => {
    const run = runner({ exitCode: 0, stdout: `${SECRET}\n` });
    const read = createMacosKeychainReader({ run, platform: "darwin" });
    await expect(read(ITEM, new AbortController().signal)).resolves.toBe(SECRET);
    expect(run).toHaveBeenCalledOnce();
    expect(run.mock.calls[0]![0]).toEqual([
      "find-generic-password",
      "-s",
      ITEM.service,
      "-a",
      ITEM.account,
      "-w",
    ]);
  });

  test.each([
    { name: "a missing item", result: { exitCode: 44 }, message: "No Keychain item" },
    { name: "a locked or denied Keychain", result: { exitCode: 51 }, message: "could not be read" },
    {
      name: "a process that did not exit",
      result: { exitCode: null },
      message: "could not be read",
    },
    { name: "an empty secret", result: { exitCode: 0, stdout: "\n" }, message: "not usable" },
    {
      name: "a multi-line secret",
      result: { exitCode: 0, stdout: "a\nb\n" },
      message: "not usable",
    },
    { name: "a secret with spaces", result: { exitCode: 0, stdout: "a b" }, message: "not usable" },
    {
      name: "a secret over 4 KiB",
      result: { exitCode: 0, stdout: "a".repeat(4097) },
      message: "not usable",
    },
  ])("refuses $name without naming the item or echoing output", async ({ result, message }) => {
    const read = createMacosKeychainReader({ run: runner(result), platform: "darwin" });
    const error = await failure(read(ITEM, new AbortController().signal));
    expect(error).toMatchObject({ code: "provider_unavailable", promptSent: "no" });
    expect(error.message).toContain(message);
    for (const value of [ITEM.service, ITEM.account, "a b", "a\nb"])
      expect(error.message).not.toContain(value);
  });

  test("is unsupported off macOS and runs nothing", async () => {
    const run = runner({ exitCode: 0, stdout: SECRET });
    const read = createMacosKeychainReader({ run, platform: "linux" });
    expect(await failure(read(ITEM, new AbortController().signal))).toMatchObject({
      code: "unsupported",
      promptSent: "no",
    });
    expect(run).not.toHaveBeenCalled();
  });

  test("refuses an option-looking service or account before running anything", async () => {
    const run = runner({ exitCode: 0, stdout: SECRET });
    const read = createMacosKeychainReader({ run, platform: "darwin" });
    await failure(read({ ...ITEM, account: "-g" }, new AbortController().signal));
    expect(run).not.toHaveBeenCalled();
  });

  test("passes cancellation to the command and does not run once cancelled", async () => {
    const run = runner({ exitCode: 0, stdout: SECRET });
    const read = createMacosKeychainReader({ run, platform: "darwin" });
    const controller = new AbortController();
    controller.abort();
    await expect(read(ITEM, controller.signal)).rejects.toThrow();
    expect(run).not.toHaveBeenCalled();

    const live = new AbortController();
    const slow = vi.fn<KeychainCommandRunner>(async (_args, { signal }) => {
      expect(signal).toBe(live.signal);
      live.abort();
      return { exitCode: 0, stdout: Buffer.from(SECRET) };
    });
    await expect(
      createMacosKeychainReader({ run: slow, platform: "darwin" })(ITEM, live.signal),
    ).rejects.toThrow();
  });
});
