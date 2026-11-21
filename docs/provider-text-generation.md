# Provider text generation

`provider.text.*` runs one prompt through a provider runtime and returns one text, on the daemon that receives the request. It creates no agent, workspace, provider session, timeline or Paseo MCP server. Plugins reach it through `paseo.providers.getTextCapability` and `paseo.providers.generateText`; use `paseo.hosts.client(serverId)` to target another host.

Only OpenCode v2 implements it, in `packages/server/src/server/agent/providers/opencode/v2/text-generation.ts`. Every other provider answers `unsupported`.

## The route

The daemon calls OpenCode's stateless `POST /api/experimental/generate`. The request carries only `{ prompt, model: { providerID, id, variant? } }`. On 2.2.x and later this path is a deprecated alias of `/api/experimental/generate/text`; 2.0.10 has only the alias.

Never use `/api/session/{id}/generate`. It sends the session's tools and system prompt to the model.

## Validated versions

`OPENCODE_TEXT_GENERATION_VERSIONS` lists exact versions: 2.0.10, 2.2.6 and 2.3.2. Any other version gets `version_unsupported`, even a newer patch.

For each of those versions, a sandboxed binary against a loopback synthetic model showed:

- The model received one user message and no `tools`, `tool_choice` or system message.
- When the model answered with tool calls, the runtime dropped them. No tool ran, no MCP tool was called, no session was created and no prompt was stored.
- A probe plugin's hooks fired in an ordinary session and never on this route.

Add a version only after `text-generation.local.e2e.test.ts` passes against it. That test runs the real binary against the synthetic model in `opencode/test-utils/synthetic-model-server.ts`. It uses `opencode` from `PATH` unless `PASEO_OPENCODE_TEST_COMMAND` holds a JSON argv. Point that variable at a sandbox wrapper: the binary otherwise reads files in your home directory, such as `~/.claude` on 2.0.10.

## Preflight

The daemon sends the prompt only after every check below passes. A failure here reports `promptSent: "no"`:

1. The server is Paseo's own helper or listens on loopback. An explicitly configured remote server gets `remote_server_refused`; nothing falls back to another server.
2. `server.info` reports a validated version.
3. `GET /openapi.json` describes the route with exactly `prompt` and `model`, and no extra fields.
4. A shared server (discovered or explicit) uses the configuration directory this daemon expects.
5. The base configuration location lists the model, waiting while a cold location loads it. The thinking option is one of the model's variants. Nothing is substituted.
6. The plugin inventory has settled, and holds only OpenCode's built-ins and Paseo's own plugin from Paseo's directories. A cold location lists no plugins until all of them register at once, so a single empty read proves nothing.

Once the POST starts, every failure reports `promptSent: "possibly"`. A 404 or 500 does not prove the server ignored the body. Nothing retries the prompt.

## Base configuration only

The route reads OpenCode's global configuration directory (`OPENCODE_CONFIG_DIR`, otherwise `$XDG_CONFIG_HOME/opencode`). A model defined only in a project's `opencode.json` is not available to it and gets `model_unavailable`. Credentials from a provider's `env` variables and from OpenCode's stored credentials work.

## Requests the daemon makes itself

The route bypasses the generated OpenCode client, because its fetch follows a 307 or 308 redirect and resends the body to the new origin. The daemon's own request uses `redirect: "manual"` and rejects any 3xx. Every other OpenCode call keeps its existing behavior.

The daemon applies a deadline (60 s by default, at most 300 s). Cancel, closing the session, and the helper exiting each abort the request. Errors carry OpenCode's error class and reason only, never provider messages. The daemon never logs the prompt or the result.

## Limits

These are returned as `limitations` with every supported capability. Callers must show them:

- `provider_runtime_builtin_hooks_unobserved`: OpenCode's built-in AI SDK hooks (`aisdk.sdk`, `aisdk.language`) never fired in validation, on any path, so their effect on this route is unknown.
- `provider_runtime_mcp_servers_connect`: MCP servers in the base configuration connect when it loads. The model is not offered their tools.
- `prompt_sent_to_provider_runtime_and_model_provider`: the prompt goes to the local OpenCode server and the model provider it is configured for.

The plugin check runs at preflight time. A plugin added between preflight and the POST is not seen.

## Hosts

The request names the target `serverId`. A daemon refuses a request that names another host with `server_mismatch`. The client also rejects an answer whose `serverId` differs from the host it sent the request to.
