import type { Page } from "@playwright/test";
import { test, expect } from "../support/fixtures";
import { expectComposerVisible } from "../support/helpers/composer";
import { openAgentRoute, seedMockAgentWorkspace } from "../support/helpers/mock-agent";

interface ClosingFenceFrameSample {
  codeBlockHeights: number[];
  codeBlockTexts: string[];
  messageHeights: number[];
  partialFenceLines: string[];
}

interface ClosingFenceFrameReport {
  finished: boolean;
  firstPauseSamples: ClosingFenceFrameSample[];
  secondPauseSamples: ClosingFenceFrameSample[];
}

async function sampleClosingFenceFrames(page: Page): Promise<ClosingFenceFrameReport> {
  return await page.evaluate(async () => {
    const firstPauseSamples: ClosingFenceFrameSample[] = [];
    const secondPauseSamples: ClosingFenceFrameSample[] = [];
    let finished = false;

    await new Promise<void>((resolve) => {
      const tick = () => {
        const messages = Array.from(
          document.querySelectorAll<HTMLElement>('[data-testid="assistant-message"]'),
        );
        const text = messages.map((message) => message.textContent ?? "").join("");
        const sample: ClosingFenceFrameSample = {
          codeBlockHeights: [],
          codeBlockTexts: [],
          messageHeights: messages.map((message) =>
            Math.round(message.getBoundingClientRect().height),
          ),
          partialFenceLines: [],
        };

        for (const message of messages) {
          for (const line of message.innerText.split(/\r?\n/)) {
            if (/^\s*`{1,2}\s*$/.test(line)) sample.partialFenceLines.push(line);
          }
          for (const block of message.querySelectorAll<HTMLElement>(
            '[data-paseo-markdown-tag="pre"]',
          )) {
            const code = block.querySelector<HTMLElement>('[data-paseo-markdown-tag="code"]');
            sample.codeBlockTexts.push((code?.textContent ?? block.textContent ?? "").trimEnd());
            sample.codeBlockHeights.push(Math.round(block.getBoundingClientRect().height));
          }
        }

        if (text.includes("console.log(answer);") && !text.includes("And a second one:")) {
          firstPauseSamples.push(sample);
        }
        if (text.includes("echo done") && !text.includes("Both blocks are closed.")) {
          secondPauseSamples.push(sample);
        }

        finished = text.includes("Both blocks are closed.");
        if (finished) {
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    return { finished, firstPauseSamples, secondPauseSamples };
  });
}

function expectStableGeometry(
  samples: readonly ClosingFenceFrameSample[],
  expectedCodeBlockTexts: readonly string[],
): void {
  expect(samples.length, "the paused text state should be sampled").toBeGreaterThan(0);
  expect(
    samples.every(
      (sample) => JSON.stringify(sample.codeBlockTexts) === JSON.stringify(expectedCodeBlockTexts),
    ),
    "the sampled code should contain only the authored lines",
  ).toBe(true);
  expect(
    samples.every((sample) => sample.partialFenceLines.length === 0),
    "no frame may show a partial closing fence as code",
  ).toBe(true);

  const geometries = new Set(
    samples.map((sample) => JSON.stringify([sample.messageHeights, sample.codeBlockHeights])),
  );
  expect(
    geometries.size,
    "message and code block geometry should stay fixed during the pause",
  ).toBe(1);
}

/**
 * A closing fence that is still being typed must not be painted as code.
 *
 * The mock reply closes each code block in two arrivals: one backtick, a pause,
 * then the other two. Painted, that first backtick is a line of code that
 * vanishes when the fence completes, so the block grows and shrinks and every
 * row below it moves twice. Each pause is sampled and its text geometry checked.
 */
test("does not paint a closing fence while it is still being typed", async ({ page }) => {
  test.setTimeout(90_000);
  const agent = await seedMockAgentWorkspace({
    repoPrefix: "closing-fence-",
    title: "Closing fence",
    model: "e2e-fast-stream",
  });
  try {
    await openAgentRoute(page, agent);
    await expectComposerVisible(page);
    const reportPromise = sampleClosingFenceFrames(page);
    await agent.client.sendAgentMessage(
      agent.agentId,
      "Stream a code block with a split closing fence.",
    );
    const report = await reportPromise;

    expect(report.finished, "the reply should finish streaming").toBe(true);
    expectStableGeometry(report.firstPauseSamples, ["const answer = 42;\nconsole.log(answer);"]);
    expectStableGeometry(report.secondPauseSamples, [
      "const answer = 42;\nconsole.log(answer);",
      "echo done",
    ]);
    expect(report.secondPauseSamples[0]?.codeBlockHeights[0]).toBe(
      report.firstPauseSamples[0]?.codeBlockHeights[0],
    );
  } finally {
    await agent.cleanup();
  }
});
