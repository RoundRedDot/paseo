import { z } from "zod";

/**
 * Credentials for one-shot text generation, declared only by editing `config.json` by hand.
 *
 * The section is keyed by provider id and never enters the mutable daemon config, so no client
 * can read it (`get_daemon_config`) or write it (`set_daemon_config`). Each entry names one
 * macOS Keychain item and the one gateway origin its secret may be sent to; the provider's
 * client-writable `OPENAI_BASE_URL` must resolve to exactly that origin. Absent means off.
 */

/** Paseo-owned Keychain items only, so the section cannot point at another app's secret. */
export const TEXT_GENERATION_KEYCHAIN_SERVICE_PREFIX = "paseo.text-generation.";

const KEYCHAIN_SERVICE_PATTERN = /^paseo\.text-generation\.[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const PROVIDER_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "[::1]", "localhost"]);

/** `scheme://host[:port]` exactly as `URL.origin` prints it: https, or http on loopback. */
export function isCanonicalGatewayOrigin(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.origin !== value) return false;
  if (url.protocol === "https:") return true;
  return url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname);
}

function isPlainAccountName(value: string): boolean {
  if (value.startsWith("-") || value.trim() !== value) return false;
  return [...value].every((char) => {
    const code = char.charCodeAt(0);
    return code >= 0x20 && code !== 0x7f;
  });
}

export const TextGenerationCredentialSchema = z
  .object({
    source: z.literal("macos-keychain"),
    service: z.string().regex(KEYCHAIN_SERVICE_PATTERN, {
      message: `must start with "${TEXT_GENERATION_KEYCHAIN_SERVICE_PREFIX}"`,
    }),
    // Not an option-looking or blank value: it becomes an argument of `security`.
    account: z.string().min(1).max(256).refine(isPlainAccountName, {
      message: "must be a plain account name",
    }),
    origin: z.string().refine(isCanonicalGatewayOrigin, {
      message: "must be an https origin such as https://gateway.example.com, with no path",
    }),
  })
  .strict();

export const TextGenerationCredentialsSchema = z.record(
  z.string().regex(PROVIDER_ID_PATTERN),
  TextGenerationCredentialSchema,
);

export type TextGenerationCredential = z.infer<typeof TextGenerationCredentialSchema>;
export type TextGenerationCredentials = z.infer<typeof TextGenerationCredentialsSchema>;
