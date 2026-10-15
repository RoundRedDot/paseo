import { test, expect } from "../support/fixtures";
import { awaitAssistantMessage } from "../support/helpers/agent-stream";
import { startRunningMockAgent } from "../support/helpers/composer";

/**
 * A closing fence that is still being typed must not be painted as code.
 *
 * The mock reply closes each code block in two arrivals: one backtick, a pause,
 * then the other two. Painted, that first backtick is a line of code that
 * vanishes when the fence completes, so the block grows and shrinks and every
 * row below it moves twice. Every frame of the stream is read here, so a lone
 * backtick line held for the pause cannot slip between samples.
 */
test("does not paint a closing fence while it is still being typed", async ({ page }) => {
  test.setTimeout(90_000);
  const agent = await startRunningMockAgent(page, {
    prefix: "closing-fence-",
    model: "e2e-fast-stream",
    prompt: "Stream a code block with a split closing fence.",
  });
  try {
    await awaitAssistantMessage(page);
    const report = await page.evaluate(async () => {
      const fenceLines = new Set<string>();
      let frames = 0;
      let finished = false;
      const startedAt = performance.now();
      await new Promise<void>((resolve) => {
        const tick = () => {
          frames += 1;
          const messages = document.querySelectorAll<HTMLElement>(
            '[data-testid="assistant-message"]',
          );
          let text = "";
          for (const message of messages) {
            text += message.textContent ?? "";
            for (const line of message.innerText.split("\n")) {
              if (/^\s*`{1,2}\s*$/.test(line)) fenceLines.add(line);
            }
          }
          finished = text.includes("Both blocks are closed.");
          if (finished || performance.now() - startedAt > 20_000) {
            resolve();
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      return { frames, finished, fenceLines: [...fenceLines] };
    });

    expect(report.finished, "the reply should finish streaming").toBe(true);
    expect(report.frames, "both pauses should be sampled frame by frame").toBeGreaterThan(60);
    expect(report.fenceLines, "no frame may show a partial closing fence as code").toEqual([]);
  } finally {
    await agent.cleanup();
  }
});
