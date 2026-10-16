import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import pino from "pino";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ClaudeAgentClient } from "./agent.js";
import { claudeProjectDirSync } from "./project-dir.js";
import { AgentManager } from "../../agent-manager.js";
import { AgentStorage } from "../../agent-storage.js";
import { ensureAgentLoaded } from "../../agent-loading.js";
import { createTestLogger } from "../../../../test-utils/test-logger.js";

/**
 * A resumed Claude agent whose transcript is missing or unreadable opens with an empty timeline.
 * The daemon log at its default level has to say which, and where it looked.
 */

const SESSION_ID = "history-load-session";

interface LogRecord {
  level: number;
  msg: string;
  sessionId?: string;
  historyPath?: string;
  err?: { message?: string };
}

describe("ClaudeAgentSession persisted history load", () => {
  let tempRoot: string;
  let cwd: string;
  let configDir: string;
  let records: LogRecord[];

  async function resume(): Promise<void> {
    const client = new ClaudeAgentClient({
      logger: pino({ level: "info" }, { write: (line: string) => records.push(JSON.parse(line)) }),
      queryFactory: vi.fn(() => {
        throw new Error("history load must not start a query");
      }),
      resolveVersion: async () => "2.1.220",
    });
    const session = await client.resumeSession(
      { provider: "claude", sessionId: SESSION_ID },
      { cwd },
    );
    await session.close();
  }

  function transcriptPath(): string {
    return path.join(claudeProjectDirSync(cwd, { configDir }), `${SESSION_ID}.jsonl`);
  }

  beforeEach(() => {
    tempRoot = mkdtempSync(path.join(os.tmpdir(), "claude-history-load-"));
    cwd = path.join(tempRoot, "repo");
    configDir = path.join(tempRoot, "claude-config");
    mkdirSync(cwd, { recursive: true });
    vi.stubEnv("CLAUDE_CONFIG_DIR", configDir);
    records = [];
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(tempRoot, { recursive: true, force: true });
  });

  test("logs the resolved transcript path when the transcript does not exist", async () => {
    await resume();

    expect(records).toContainEqual(
      expect.objectContaining({
        level: pino.levels.values.info,
        msg: "No Claude transcript to load history from",
        sessionId: SESSION_ID,
        historyPath: transcriptPath(),
      }),
    );
  });

  test("reloads live foreground and autonomous timings with distinct transcript IDs", async () => {
    const logger = createTestLogger();
    const storagePath = path.join(tempRoot, "agents");
    const storage = new AgentStorage(storagePath, logger);
    let releaseAutonomous!: () => void;
    const autonomous = new Promise<void>((resolve) => {
      releaseAutonomous = resolve;
    });
    let releaseQuery!: () => void;
    const closed = new Promise<void>((resolve) => {
      releaseQuery = resolve;
    });
    const replies = ["foreground", "autonomous"].map((owner) => ({
      type: "assistant",
      uuid: `transcript-${owner}`,
      session_id: SESSION_ID,
      timestamp: "2026-10-15T08:00:00.000Z",
      message: {
        id: `provider-${owner}`,
        role: "assistant",
        content: [{ type: "text", text: "identical reply" }],
      },
    }));
    async function* sdkMessages() {
      for (const reply of replies) {
        yield { type: "system", subtype: "init", session_id: SESSION_ID };
        yield {
          type: "stream_event",
          session_id: SESSION_ID,
          event: { type: "message_start", message: { id: reply.message.id } },
        };
        yield {
          type: "stream_event",
          session_id: SESSION_ID,
          event: {
            type: "content_block_delta",
            delta: { type: "text_delta", text: "identical reply" },
          },
        };
        yield reply;
        yield {
          type: "result",
          subtype: "success",
          session_id: SESSION_ID,
          usage: { input_tokens: 1, cache_read_input_tokens: 0, output_tokens: 1 },
          total_cost_usd: 0,
        };
        await autonomous;
      }
      await closed;
    }
    const queryFactory = vi.fn().mockImplementation(() =>
      Object.assign(sdkMessages(), {
        close: releaseQuery,
        supportedModels: async () => [],
        supportedCommands: async () => [],
        applyFlagSettings: async () => undefined,
      }),
    );
    function client() {
      return new ClaudeAgentClient({
        logger,
        queryFactory,
        resolveBinary: async () => "/test/claude/bin",
        resolveVersion: async () => "2.1.220",
      });
    }
    const manager = new AgentManager({ clients: { claude: client() }, registry: storage, logger });
    const reloadedStorage = new AgentStorage(storagePath, logger);
    const reloaded = new AgentManager({
      clients: { claude: client() },
      registry: reloadedStorage,
      logger,
    });
    let agentId: string | undefined;
    try {
      const agent = await manager.createAgent({ provider: "claude", cwd }, undefined, {
        workspaceId: undefined,
      });
      agentId = agent.id;
      await manager.runAgent(agent.id, "prompt");
      releaseAutonomous();
      await vi.waitFor(async () => {
        expect((await storage.get(agent.id))?.turnTimings).toHaveLength(2);
      });
      await manager.flush();
      const timings = (await storage.get(agent.id))!.turnTimings!;
      expect(timings.map((timing) => timing.messageIds)).toEqual([
        ["provider-foreground"],
        ["provider-autonomous"],
      ]);
      expect(timings.map((timing) => timing.turnId)).toEqual([
        expect.stringMatching(/^foreground-turn-/),
        expect.stringMatching(/^autonomous-turn-/),
      ]);
      mkdirSync(path.dirname(transcriptPath()), { recursive: true });
      const history = replies.toReversed();
      writeFileSync(transcriptPath(), history.map((reply) => JSON.stringify(reply)).join("\n"));
      releaseQuery();
      await manager.closeAgent(agent.id);
      await manager.flush();
      const record = (await reloadedStorage.get(agent.id))!;
      expect(record.turnTimings).toEqual(timings);
      await ensureAgentLoaded(agent.id, {
        agentManager: reloaded,
        agentStorage: reloadedStorage,
        logger,
      });
      const tail = reloaded.fetchTimeline(agent.id, { direction: "tail", limit: 1 });
      expect(tail.rows[0]!.turnId).toBeUndefined();
      expect(tail.hasOlder).toBe(true);
      const older = reloaded.fetchTimeline(agent.id, {
        direction: "before",
        cursor: { epoch: tail.epoch, seq: tail.startSeq! },
        limit: 1,
      });
      const after = reloaded.fetchTimeline(agent.id, {
        direction: "after",
        cursor: { epoch: tail.epoch, seq: tail.endSeq! },
        limit: 1,
      });
      for (const [page, expected] of [
        [tail, [timings[0]]],
        [older, [timings[1]]],
        [after, []],
      ] as const) {
        const messageIds = new Set<string>();
        for (const row of page.rows) {
          expect(row.turnId).toBeUndefined();
          if (row.item.type === "assistant_message" && row.item.messageId) {
            messageIds.add(row.item.messageId);
          }
        }
        expect(
          await reloadedStorage.getTurnTimings({
            agentId: agent.id,
            turnIds: new Set(),
            messageIds,
          }),
        ).toEqual(expected);
      }
      expect(tail.rows.map((row) => row.item)).toEqual([
        { type: "assistant_message", text: "identical reply", messageId: "provider-foreground" },
      ]);
      expect(queryFactory).toHaveBeenCalledTimes(1);
    } finally {
      releaseAutonomous();
      releaseQuery();
      if (agentId) {
        await manager.closeAgent(agentId);
        await reloaded.closeAgent(agentId);
      }
      await manager.flush();
      await reloaded.flush();
    }
  });

  test("logs a warning with the error when the transcript cannot be read", async () => {
    // A directory at the transcript path exists but cannot be read as a file.
    mkdirSync(transcriptPath(), { recursive: true });

    await resume();

    expect(records).toContainEqual(
      expect.objectContaining({
        level: pino.levels.values.warn,
        msg: "Failed to load Claude history from transcript",
        sessionId: SESSION_ID,
        historyPath: transcriptPath(),
        err: expect.objectContaining({ message: expect.stringContaining("EISDIR") }),
      }),
    );
  });

  // chmod does not remove read access on Windows, or for root.
  test.skipIf(process.platform === "win32" || process.getuid?.() === 0)(
    "logs a warning with the error when Claude's project folders cannot be listed",
    async () => {
      // The transcript is not under cwd's folder, so the lookup lists the other project folders.
      mkdirSync(path.join(configDir, "projects"), { recursive: true });
      chmodSync(path.join(configDir, "projects"), 0o000);

      try {
        await resume();
      } finally {
        chmodSync(path.join(configDir, "projects"), 0o755);
      }

      expect(records).toContainEqual(
        expect.objectContaining({
          level: pino.levels.values.warn,
          msg: "Failed to load Claude history from transcript",
          sessionId: SESSION_ID,
          err: expect.objectContaining({ message: expect.stringContaining("EACCES") }),
        }),
      );
    },
  );
});
