import { execFile } from "node:child_process";
import { TextGenerationError } from "../../text-generation.js";

/**
 * Reads one generic password from the macOS Keychain for one-shot text generation.
 *
 * Only `/usr/bin/security find-generic-password -s <service> -a <account> -w` runs: a fixed
 * binary, no shell, no PATH lookup, a fixed argument shape and a near-empty environment. The
 * service and account come from the hand-edited `textGenerationCredentials` section. Failures
 * never carry the service, the account, the secret or the tool's own output.
 */

export const SECURITY_BINARY = "/usr/bin/security";

const READ_TIMEOUT_MS = 5_000;
const MAX_SECRET_BYTES = 4_096;

export interface KeychainItem {
  service: string;
  account: string;
}

export interface KeychainCommandResult {
  /** null when the process did not exit normally (signal, timeout, spawn failure). */
  exitCode: number | null;
  stdout: Buffer;
}

/** Runs `/usr/bin/security` with exactly these arguments. Injected by tests. */
export type KeychainCommandRunner = (
  args: readonly string[],
  options: { signal: AbortSignal },
) => Promise<KeychainCommandResult>;

export type KeychainSecretReader = (item: KeychainItem, signal: AbortSignal) => Promise<string>;

/** `security` exits 44 (errSecItemNotFound) when no item matches. */
const ITEM_NOT_FOUND_EXIT_CODE = 44;

function runSecurity(
  args: readonly string[],
  options: { signal: AbortSignal },
): Promise<KeychainCommandResult> {
  return new Promise((resolve) => {
    execFile(
      SECURITY_BINARY,
      [...args],
      {
        encoding: "buffer",
        env: { PATH: "/usr/bin:/bin" },
        maxBuffer: MAX_SECRET_BYTES + 2,
        shell: false,
        signal: options.signal,
        timeout: READ_TIMEOUT_MS,
        windowsHide: true,
      },
      (error, stdout) => {
        if (!error) {
          resolve({ exitCode: 0, stdout });
          return;
        }
        const code = (error as NodeJS.ErrnoException & { code?: unknown }).code;
        resolve({ exitCode: typeof code === "number" ? code : null, stdout: Buffer.alloc(0) });
      },
    );
  });
}

function unavailable(message: string): TextGenerationError {
  return new TextGenerationError("provider_unavailable", message, "no");
}

/** A printable single-line secret, with the one trailing newline `security -w` prints. */
function parseSecret(stdout: Buffer): string | null {
  const text = stdout.toString("utf8").replace(/\r?\n$/u, "");
  if (text.length === 0 || Buffer.byteLength(text) > MAX_SECRET_BYTES) return null;
  return /^[\x21-\x7e]+$/u.test(text) ? text : null;
}

export function createMacosKeychainReader(
  options: { run?: KeychainCommandRunner; platform?: NodeJS.Platform } = {},
): KeychainSecretReader {
  const run = options.run ?? runSecurity;
  const platform = options.platform ?? process.platform;
  return async (item, signal) => {
    if (platform !== "darwin")
      throw new TextGenerationError(
        "unsupported",
        "Keychain credentials for text generation are only supported on macOS",
        "no",
      );
    // `--` is not accepted by `security`; the schema keeps both values from starting with "-".
    if (item.service.startsWith("-") || item.account.startsWith("-"))
      throw unavailable("The Keychain item for this provider is not valid");
    signal.throwIfAborted();
    const result = await run(
      ["find-generic-password", "-s", item.service, "-a", item.account, "-w"],
      { signal },
    );
    signal.throwIfAborted();
    if (result.exitCode === ITEM_NOT_FOUND_EXIT_CODE)
      throw unavailable("No Keychain item for this provider was found");
    if (result.exitCode !== 0)
      throw unavailable(
        "The Keychain item for this provider could not be read (locked, denied or timed out)",
      );
    const secret = parseSecret(result.stdout);
    if (secret === null) throw unavailable("The Keychain item for this provider is not usable");
    return secret;
  };
}
