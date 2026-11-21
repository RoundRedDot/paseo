/**
 * The `base_url` Paseo gives a Codex custom provider: `OPENAI_BASE_URL` without trailing
 * slashes, ending in `/v1`. One-shot text generation sends to the same URL Codex uses.
 */
export function normalizeOpenAICompatibleBaseUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const withoutTrailingSlashes = trimmed.replace(/\/+$/u, "");
  if (withoutTrailingSlashes.endsWith("/v1")) {
    return withoutTrailingSlashes;
  }
  return `${withoutTrailingSlashes}/v1`;
}
