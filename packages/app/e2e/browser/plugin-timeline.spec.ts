import { observeForkAttachment } from "../support/helpers/assistant-fork";
import { expect, test } from "../support/fixtures";
import {
  withTimelinePlugin,
  requestPluginTimeline,
  interactWithStreamingCard,
  expectWholeCompletedCard,
  expectBothConsecutiveTools,
  forkCompletedPluginReply,
  ASSISTANT_TEXT,
} from "../support/helpers/plugin-timeline";

for (const width of [1100, 390]) {
  test(`assistant plugin receives the whole streaming message at width ${width}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await withTimelinePlugin(page, info, "assistant", async (agent) => {
      await requestPluginTimeline(agent);
      await interactWithStreamingCard(page);
      await agent.client.waitForFinish(agent.agentId, 30_000);
      await expectWholeCompletedCard(page);
      // Local state is checked during growth; the viewport remounts on the history handoff.
      await page.reload({ waitUntil: "domcontentloaded" });
      await expectWholeCompletedCard(page);
    });
  });
}

test("Overview preserves both consecutive tool plugin cards", async ({ page }, info) => {
  await withTimelinePlugin(page, info, "tools", async (agent) => {
    await requestPluginTimeline(agent);
    await agent.client.waitForFinish(agent.agentId, 30_000);
    await expectBothConsecutiveTools(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expectBothConsecutiveTools(page);
  });
});

for (const target of ["tab", "workspace"] as const) {
  test(`forks a transformed reply into a new ${target}`, async ({ page }, info) => {
    const width = target === "tab" ? 1100 : 390;
    await page.setViewportSize({ width, height: 900 });
    const attachment = observeForkAttachment(page);
    await withTimelinePlugin(page, info, "assistant", async (agent) => {
      await requestPluginTimeline(agent);
      await interactWithStreamingCard(page);
      await expect(page.getByTestId("plugin-reply-fork-trigger")).toHaveCount(0);
      await agent.client.waitForFinish(agent.agentId, 30_000);
      await expectWholeCompletedCard(page);
      await forkCompletedPluginReply(page, info, target);
      expect(await attachment.waitForText()).toContain(ASSISTANT_TEXT);
    });
  });
}
