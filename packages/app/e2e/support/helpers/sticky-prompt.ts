import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, type Locator, type Page, type TestInfo } from "@playwright/test";
import { pluginRequirements } from "./plugin-fixture";
import { connectNewWorkspaceDaemonClient } from "./new-workspace";
import { openAgentRoute, seedMockAgentWorkspace, type MockAgentWorkspace } from "./mock-agent";

const PLUGIN_ID = "sticky-prompt-e2e";
export const STICKY_PROMPTS = [
  "First sticky prompt",
  "Second sticky prompt",
  "Third sticky prompt",
];
const PARAGRAPHS = 40;
const WHEEL_STEP_PX = 240;
const MAX_WHEEL_STEPS = 200;

// Each assistant reply becomes one tall plugin card, so a turn is taller than the viewport.
const CLIENT_SOURCE = `import React from "react";
import { Text, View } from "react-native";
import { z } from "zod";

function Card({ item, theme }) {
  return <View testID="sticky-card" style={{ backgroundColor: theme.colors.surface1 }}>
    <Text style={{ color: theme.colors.foreground }}>{item.data.text}</Text>
  </View>;
}

export default function contribute(client) {
  client.addTimelineTransformer({
    id: "sticky-card",
    query: { itemType: "assistant_message" },
    transform({ item }) {
      return { items: [{ type: "plugin", kind: "sticky-card", version: 1, data: { text: item.text } }] };
    },
  });
  client.addTimelineRenderer({
    kind: "sticky-card", version: 1,
    schema: z.object({ text: z.string() }),
    Component: Card,
  });
  return () => {};
}`;

/** Three finished turns whose assistant replies are cards taller than the viewport. */
export async function withStickyTimeline(
  page: Page,
  info: TestInfo,
  run: (agent: MockAgentWorkspace) => Promise<void>,
): Promise<void> {
  info.setTimeout(180_000);
  const directory = await mkdtemp(path.join(tmpdir(), "paseo-sticky-prompt-plugin-"));
  const agent = await seedMockAgentWorkspace({
    repoPrefix: "sticky-prompt-",
    title: "Sticky prompt regression",
    model: "ten-second-stream",
    featureValues: {
      mockStreamingAssistantResponse: Array.from(
        { length: PARAGRAPHS },
        (_, index) => `Paragraph ${index + 1}.`,
      ).join("\n\n"),
      mockStreamingAssistantIntervalMs: 1,
    },
  });
  const pluginClient = await connectNewWorkspaceDaemonClient({ ownProjects: false });
  const previous = await pluginClient.getDaemonConfig();
  try {
    await writeFile(
      path.join(directory, "paseo-plugin.json"),
      JSON.stringify({ id: PLUGIN_ID, requirements: pluginRequirements }),
    );
    await writeFile(path.join(directory, "index.client.tsx"), CLIENT_SOURCE);
    await pluginClient.patchDaemonConfig({ pluginsEnabled: true });
    await pluginClient.installDirectoryPlugin(directory);
    for (const prompt of STICKY_PROMPTS) {
      await agent.client.sendAgentMessage(agent.agentId, prompt);
      await agent.client.waitForFinish(agent.agentId, 30_000);
    }
    await openAgentRoute(page, agent);
    await expect(stickyCards(page).last()).toBeVisible({ timeout: 60_000 });
    await run(agent);
  } catch (error) {
    await info.attach("sticky-prompt-before-cleanup", {
      body: await page.screenshot({ path: info.outputPath("sticky-prompt-before-cleanup.png") }),
      contentType: "image/png",
    });
    throw error;
  } finally {
    await pluginClient.removePlugin(PLUGIN_ID);
    await pluginClient.patchDaemonConfig({
      pluginsEnabled: previous.config.pluginsEnabled ?? false,
    });
    await pluginClient.close();
    await agent.cleanup();
    await rm(directory, { recursive: true, force: true });
  }
}

function timeline(page: Page): Locator {
  return page.locator('[data-testid="agent-chat-scroll"]:visible').first();
}

function stickyBar(page: Page): Locator {
  return page.getByTestId("sticky-prompt-bar");
}

function stickyCards(page: Page): Locator {
  return timeline(page).getByTestId("sticky-card");
}

function promptRow(page: Page, prompt: string): Locator {
  return timeline(page).locator("[data-history-row-id]").filter({ hasText: prompt });
}

async function readStickyPrompt(page: Page): Promise<string | null> {
  const bar = stickyBar(page);
  if ((await bar.count()) === 0) return null;
  const opacity = await bar.evaluate((element) => Number(getComputedStyle(element).opacity));
  if (opacity < 0.99) return null;
  return await page.getByTestId("sticky-prompt-bar-text").innerText();
}

export async function expectStickyPrompt(page: Page, prompt: string | null): Promise<void> {
  await expect
    .poll(async () => {
      const text = await readStickyPrompt(page);
      return text === null ? null : text.replace(/^\S+\s/, "");
    })
    .toBe(prompt);
}

/** Wheel toward older content, as a reader does, until `done` holds. */
async function wheelUntil(page: Page, done: () => Promise<boolean>): Promise<void> {
  const box = await timeline(page).boundingBox();
  if (!box) throw new Error("The timeline is not on screen");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let step = 0; step < MAX_WHEEL_STEPS; step += 1) {
    if (await done()) return;
    await page.mouse.wheel(0, -WHEEL_STEP_PX);
    await page.waitForTimeout(80);
  }
  throw new Error("Scrolling never reached the expected position");
}

async function offsetFromTimelineTop(page: Page, target: Locator): Promise<number | null> {
  const [timelineBox, targetBox] = await Promise.all([
    timeline(page).boundingBox(),
    target.boundingBox(),
  ]);
  return timelineBox && targetBox ? targetBox.y - timelineBox.y : null;
}

/** Scrolls until the prompt's row is on screen below the bar, with its turn's reply below. */
export async function scrollUntilPromptBelowBar(page: Page, prompt: string): Promise<void> {
  await wheelUntil(page, async () => {
    if ((await promptRow(page, prompt).count()) === 0) return false;
    const offset = await offsetFromTimelineTop(page, promptRow(page, prompt));
    return offset !== null && offset > 120;
  });
}

/** Scrolls until the reading line is inside the reply of the turn before `prompt`. */
export async function scrollIntoReplyBefore(page: Page, prompt: string): Promise<void> {
  await wheelUntil(page, async () => {
    if ((await promptRow(page, prompt).count()) === 0) return false;
    const offset = await offsetFromTimelineTop(page, promptRow(page, prompt));
    const height = (await timeline(page).boundingBox())?.height ?? 0;
    return offset !== null && offset > height;
  });
}

export async function jumpWithStickyPrompt(page: Page): Promise<void> {
  await stickyBar(page).click();
}
