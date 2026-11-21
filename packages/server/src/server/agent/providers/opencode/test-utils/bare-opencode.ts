import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { OpenCode } from "@opencode/client";
import type { V2Api } from "../v2/api.js";
import type { V2Connection } from "../v2/runtime.js";

/**
 * TEST ONLY: `opencode serve` with a private configuration directory, project configuration off
 * and no Paseo plugin, the shape an isolated text runtime would need. Paseo has no such runtime
 * yet; tests use this to exercise the one-shot route on the real binary.
 */
export interface BareOpenCode {
  connection: V2Connection;
  configDirectory: string;
  dataDirectory: string;
  stop(): Promise<void>;
}

export async function startBareOpenCode(input: {
  command: string[];
  root: string;
  configContent: unknown;
}): Promise<BareOpenCode> {
  const dirs = {
    config: path.join(input.root, "bare-xdg-config"),
    opencodeConfig: path.join(input.root, "bare-opencode-config"),
    data: path.join(input.root, "bare-xdg-data"),
    state: path.join(input.root, "bare-xdg-state"),
    cache: path.join(input.root, "bare-xdg-cache"),
    cwd: path.join(input.root, "bare-cwd"),
  };
  for (const directory of Object.values(dirs)) await mkdir(directory, { recursive: true });
  const password = randomBytes(24).toString("base64url");
  const [command, ...args] = input.command;
  const child = spawn(command, [...args, "serve", "--hostname", "127.0.0.1", "--port", "0"], {
    cwd: dirs.cwd,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "ignore"],
    env: {
      ...process.env,
      XDG_CONFIG_HOME: dirs.config,
      OPENCODE_CONFIG_DIR: dirs.opencodeConfig,
      XDG_DATA_HOME: dirs.data,
      XDG_STATE_HOME: dirs.state,
      XDG_CACHE_HOME: dirs.cache,
      OPENCODE_CONFIG_CONTENT: JSON.stringify(input.configContent),
      OPENCODE_PASSWORD: password,
      OPENCODE_DISABLE_PROJECT_CONFIG: "1",
      OPENCODE_DISABLE_CLAUDE_CODE: "1",
      OPENCODE_DISABLE_AUTOUPDATE: "1",
      OPENCODE_DISABLE_MODELS_FETCH: "1",
    },
  });
  const lifetime = new AbortController();
  child.once("exit", () => lifetime.abort(new Error("bare OpenCode exited")));
  let output = "";
  child.stdout?.on("data", (chunk: Buffer) => {
    output = (output + chunk.toString()).slice(-8192);
  });
  const stop = async () => {
    if (child.exitCode !== null) return;
    try {
      if (child.pid) process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
    await Promise.race([new Promise((resolve) => child.once("exit", resolve)), delay(5_000)]);
    try {
      if (child.pid && child.exitCode === null) process.kill(-child.pid, "SIGKILL");
    } catch {
      // already gone
    }
  };
  let url: string | undefined;
  for (let attempt = 0; attempt < 600 && !url; attempt++) {
    url = output.match(/server listening on (http:\/\/127\.0\.0\.1:\d+)/)?.[1];
    if (!url) await delay(50);
  }
  if (!url) {
    await stop();
    throw new Error("bare OpenCode did not start");
  }
  const authorization = `Basic ${Buffer.from(`opencode:${password}`).toString("base64")}`;
  const client = OpenCode.make({ baseUrl: url, headers: { Authorization: authorization } });
  const connection: V2Connection = {
    client: client as V2Api,
    release: async () => undefined,
    retain: () => connection,
    bindSession: async () => undefined,
    unbindSession: async () => undefined,
    refreshLocation: async () => undefined,
    exited: new Promise<Error>((resolve) => child.once("exit", () => resolve(new Error("exited")))),
    textEndpoint: {
      kind: "owned",
      baseUrl: url,
      authorization,
      configDirectory: dirs.opencodeConfig,
      lifetime: lifetime.signal,
    },
  };
  return { connection, configDirectory: dirs.opencodeConfig, dataDirectory: dirs.data, stop };
}
