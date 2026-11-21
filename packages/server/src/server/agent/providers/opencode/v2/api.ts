import type { OpenCodeClient } from "@opencode/client";

export interface V2Api {
  server: OpenCodeClient["server"];
  shell: Pick<OpenCodeClient["shell"], "list" | "remove">;
  session: Pick<
    OpenCodeClient["session"],
    | "create"
    | "get"
    | "list"
    | "active"
    | "remove"
    | "switchAgent"
    | "switchModel"
    | "environment"
    | "instructions"
    | "prompt"
    | "command"
    | "compact"
    | "interrupt"
    | "revert"
    | "log"
  > & {
    inbox: Pick<OpenCodeClient["session"]["inbox"], "list">;
    form: Pick<OpenCodeClient["session"]["form"], "list" | "reply" | "cancel">;
  };
  plugin: Pick<OpenCodeClient["plugin"], "list">;
  /** Optional so test doubles can omit it; text generation refuses shared servers without it. */
  config?: Pick<OpenCodeClient["config"], "get">;
  model: OpenCodeClient["model"];
  provider: Pick<OpenCodeClient["provider"], "list">;
  agent: Pick<OpenCodeClient["agent"], "list">;
  command: OpenCodeClient["command"];
  skill: OpenCodeClient["skill"];
  message: OpenCodeClient["message"];
  mcp: Pick<OpenCodeClient["mcp"], "add" | "list">;
  permission: Pick<OpenCodeClient["permission"], "list" | "reply">;
  event: OpenCodeClient["event"];
}

/**
 * How to reach the OpenCode server directly, for routes that must not go through the shared
 * client's fetch: the one-shot text route refuses redirects itself. Stays inside the daemon.
 */
export interface OpenCodeTextEndpoint {
  kind: "owned" | "explicit" | "discovered";
  baseUrl: string;
  authorization?: string;
  /** The base configuration directory the server is expected to use (`OPENCODE_CONFIG_DIR`). */
  configDirectory: string;
  /** Exits with the connection; aborts requests in flight. */
  lifetime: AbortSignal;
}
