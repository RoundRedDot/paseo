# Provider text generation

`provider.text.*` runs one prompt through a provider runtime and returns one text, on the daemon that receives the request. It creates no agent, workspace, provider session, timeline or Paseo MCP server. Plugins reach it through `paseo.providers.listTextProviders`, `paseo.providers.getTextCapability` and `paseo.providers.generateText`; use `paseo.hosts.client(serverId)` to target another host.

List providers with `listTextProviders`, never `paseo.providers.snapshot`. A snapshot on a cold catalog warms every enabled provider, which can start an unrelated OpenCode runtime with the user's plugins and MCP servers. `listTextProviders` reads the registry and checks nothing. It needs `features.providerTextList`: earlier hosts report `providerTextGeneration` without knowing the request, so the SDK refuses before sending it, with an error whose `code` is `PROVIDER_TEXT_LIST_UNSUPPORTED`. Tell that apart from a lost connection by the code, not the message.

Only a Codex custom provider with a host-local Keychain credential binding supports it ([Codex custom providers](#codex-custom-providers)), and only on macOS. Every other provider answers `unsupported` or `isolation_unverified`, and nothing is sent. The OpenCode v2 implementation (`packages/server/src/server/agent/providers/opencode/v2/text-generation.ts`) is complete, but it needs a runtime Paseo does not have.

An invalid credential file is reported by the registry as optional `credentialIssues`. Those entries are excluded from the selectable list; reading the diagnostic does not check a provider or read Keychain. Error `reason` is an open diagnostic string; routing and prompt delivery use the existing `code` and `promptSent` fields.

## Codex custom providers

A provider that extends `codex` and sets `OPENAI_BASE_URL` can run one-shot text generation without Codex: the daemon sends one `POST {base_url}/responses` itself (`providers/codex/responses-text-generation.ts`). No Codex process, agent or tool runs.

Create `text-generation-credentials.json` in the daemon home. The file maps provider IDs to dedicated Keychain items:

```json
{
  "newapi": {
    "source": "macos-keychain",
    "service": "paseo.text-generation.newapi",
    "account": "you",
    "origin": "https://gateway.example.com"
  }
}
```

Store the key in a dedicated item with `security add-generic-password -s paseo.text-generation.newapi -a you -w` (it prompts, so the key stays out of shell history), then restart the daemon. The daemon reads the file at startup. An unreadable file, invalid JSON or invalid binding disables one-shot text for Codex custom providers. The daemon stays online and reports the problem in its startup log and in the provider’s text capability. Fix the file and restart to re-enable the route. If you used the earlier unpublished candidate, move the provider map from `textGenerationCredentials` into this file and remove the old top-level key before startup or downgrade. Released daemons ignore the separate file and use their existing `config.json` schema.

Rules the code enforces, and why:

- The file is never part of the mutable config, so `get_daemon_config` does not return it and `set_daemon_config` cannot write it. A client with `daemon.read` sees neither the key nor the item it lives in.
- The key never comes from the provider's `env`. A placeholder `OPENAI_API_KEY` there is fine and is ignored.
- `service` must start with `paseo.text-generation.`, and both `service` and `account` are required, so the entry cannot name another app's item or match the first item that shares an account.
- The provider's `OPENAI_BASE_URL`, after the same normalization Codex gets, must have exactly the entry's `origin`. Clients can edit the provider's env; pointing it at another origin makes the route refuse before the key is read. The binding is the origin only: a client can still change the path, so one origin that serves several tenants on different paths does not keep their keys apart.
- The key is read for each request with `/usr/bin/security find-generic-password -s … -a … -w`: a fixed binary, no shell, no wrapper. The capability check does not read it, so opening settings never prompts.
- The request carries only `model`, `input`, `store: false`, `stream: false` and, for `low`, `medium` or `high`, `reasoning.effort`. No `tools` or `instructions`. Other thinking options are not offered, and an unlisted model is refused.
- The answer must be a Responses document with `status: "completed"` whose output is completed assistant `message` items of `output_text` (reasoning items are skipped). A missing status, an unfinished or non-assistant message, a tool call, a refusal or any other shape fails with `generation_failed`, even with text in it; nothing in it is run.
- Errors name only the HTTP status, a fixed list of public gateway error codes, and known tool call types. Any other value the gateway sends can echo the prompt or a key, so it is dropped.

Not covered: Linux and Windows (`unsupported`), a daemon whose login Keychain is locked (for example one started over ssh), and gateways that do not accept this request. Whether a gateway accepts it, and whether macOS prompts for the item, has only been checked against fakes.

## Why Claude Code refuses

Claude Code also refuses before any process launch, for both the built-in provider and profiles
derived from it. Empty tools, strict MCP configuration and a pre-prompt inventory do not constrain
managed hooks that take effect while the request is running. Claude Code's `ConfigChange` hook
can audit local managed-policy edits but cannot block them. `--bare` leaves organization-managed
plugin hooks enabled and skips the OAuth and Keychain reads needed to reuse the normal login.
See the [CLI reference](https://code.claude.com/docs/en/cli-reference) and
[ConfigChange reference](https://code.claude.com/docs/en/hooks#configchange).

## Why OpenCode refuses

The route must not let the prompt cause any host action. Starting or reading an OpenCode location that loads the user's configuration already does that: it imports and sets up their plugins and connects their MCP servers, before any check can run. Plugin enable/disable directives in `OPENCODE_CONFIG_CONTENT` do not prevent it. On 2.2.x and 2.3.x the loader imports each declared package before a later `-*` can disable it, and 2.0.10 has no directives.

So `trust` runs before `acquire` and refuses (`refuseUnisolatedRuntime`) without selecting a server, probing the version or connecting. Neither the agent helper nor a discovered or explicit server is ever started or contacted for text generation.

An isolated runtime would be a separate `opencode serve` with:

- a private `XDG_CONFIG_HOME` and `OPENCODE_CONFIG_DIR`
- a private working directory
- `OPENCODE_DISABLE_PROJECT_CONFIG=1` and `OPENCODE_DISABLE_CLAUDE_CODE=1`
- no Paseo plugin
- providers only from the config content Paseo passes in

Tests use one of these (`opencode/test-utils/bare-opencode.ts`). With plugins and MCP servers placed under `~/.agents`, `~/.claude`, `~/.opencode`, `~/.config/opencode`, `~/.claude.json` and `~/.mcp.json`, nothing loaded on 2.0.10, 2.2.6 or 2.3.2. The same declarations in the runtime's own config directory did load. Reusing the user's data directory kept stored credentials and loaded no plugins.

Such a runtime cannot see providers or models defined in the user's global `opencode.json`. That trade-off is why it is not shipped.

## The route

The OpenCode implementation calls only the stateless `POST /api/experimental/generate`. On 2.2.x and later this path is a deprecated alias of `/api/experimental/generate/text`; 2.0.10 has only the alias. The request is `{ prompt, model: { providerID, id, variant? } }`.

Never use `/api/session/{id}/generate`: it sends the session's tools and system prompt.

`OPENCODE_TEXT_GENERATION_VERSIONS` lists the exact validated versions: 2.0.10, 2.2.6 and 2.3.2. Add a version only after `text-generation.local.e2e.test.ts` passes against it. That test uses `opencode` from `PATH` unless `PASEO_OPENCODE_TEST_COMMAND` holds a JSON argv. Point the variable at a sandbox wrapper: the binary otherwise reads files in your home directory.

## Preflight

On a trusted OpenCode runtime, the prompt is sent only after every check below passes. Each failure reports `promptSent: "no"`:

1. The runtime is on loopback.
2. `server.info` reports a validated version.
3. `/openapi.json` describes the route with exactly `prompt` and `model`.
4. A shared server uses the expected configuration directory.
5. The model, and any thinking option, exists in the base configuration. Nothing is substituted. Models defined only in a project's `opencode.json` get `model_unavailable`.
6. The plugin inventory has settled and holds only built-ins.
7. There are no MCP servers.

Steps 6 and 7 are a second check, not the isolation: by the time they can run, a loaded plugin has run.

Once the POST starts, every failure reports `promptSent: "possibly"`. A 404 or 500 does not prove the body was ignored, so nothing retries.

The daemon's own request uses `redirect: "manual"` and rejects any 3xx, because the generated client would resend the body to the redirect target. Response bodies are read up to a limit and the rest is cancelled. Errors carry OpenCode's error class and reason, never provider text, configured URLs or paths. Nothing logs the prompt or the result.

## Requests and cancellation

The deadline defaults to 60 s, capped at 300 s. A prompt over 1 MiB of UTF-8 is refused before any provider code runs. Each socket runs up to four generations, with up to eight more waiting in arrival order. The deadline includes time in the queue. A full queue returns `provider_unavailable` with reason `queue_full`. Expiry before dispatch returns `timeout` with reason `queue_timeout`. In both cases `promptSent` is `no`, so clients can offer a manual retry. Cancellation, detachment, and expiry prevent a waiting request from dispatching. A request belongs to the socket that sent it: only that socket can cancel it, the same request ID on two sockets runs as two requests, and the socket detaching aborts it.

The SDK always uses a fresh wire ID. Cancellation, a lost answer, or an answer from a host other than the connected one all come back as an error result with `promptSent: "possibly"`, never as a rejection. `generateText` rejects only when nothing was sent: the host lacks `features.providerTextGeneration`, has not identified itself, or is not connected.

## Limits

A supported capability returns `limitations` that callers must show:

- `provider_runtime_builtin_hooks_unobserved`: OpenCode's built-in AI SDK hooks (`aisdk.sdk`, `aisdk.language`) never fired in validation, so their effect on the route is unknown.
- `prompt_sent_to_provider_runtime_and_model_provider`: the prompt goes to the local OpenCode server and the configured model provider.
- `prompt_sent_to_configured_gateway`: the prompt goes to the gateway the Codex custom provider is configured for.
- `credential_read_from_host_keychain`: the daemon reads the gateway key from this host's Keychain for the request.
