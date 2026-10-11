import { test } from "../support/fixtures";
import {
  STICKY_PROMPTS,
  expectPinnedCardHeaderBelowBar,
  expectStickyPrompt,
  jumpWithStickyPrompt,
  scrollIntoReplyBefore,
  scrollUntilPromptBelowBar,
  withStickyTimeline,
} from "../support/helpers/sticky-prompt";
import { expectTimelinePromptLandedBelowTop } from "../support/helpers/timeline-pagination";

const [firstPrompt, secondPrompt, thirdPrompt] = STICKY_PROMPTS;

for (const width of [1280, 390]) {
  test.describe(`sticky prompt at width ${width}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
    });

    test("pins the prompt of the turn being read and switches between turns", async ({
      page,
    }, info) => {
      await withStickyTimeline(page, info, async () => {
        // The newest reply is taller than the viewport, so its prompt is above the fold.
        await expectStickyPrompt(page, thirdPrompt);

        // The next prompt on screen below the bar does not take over the reading turn.
        await scrollUntilPromptBelowBar(page, thirdPrompt);
        await expectStickyPrompt(page, secondPrompt);

        await scrollIntoReplyBefore(page, secondPrompt);
        await expectStickyPrompt(page, firstPrompt);
      });
    });

    test("jumps to the pinned prompt and hides while that prompt is on screen", async ({
      page,
    }, info) => {
      await withStickyTimeline(page, info, async () => {
        await scrollIntoReplyBefore(page, thirdPrompt);
        await expectStickyPrompt(page, secondPrompt);

        await jumpWithStickyPrompt(page);
        await expectTimelinePromptLandedBelowTop(page, secondPrompt);
        await expectStickyPrompt(page, null);
      });
    });

    test("keeps a sticky plugin header directly below the bar", async ({ page }, info) => {
      await withStickyTimeline(page, info, async () => {
        await expectStickyPrompt(page, thirdPrompt);
        await expectPinnedCardHeaderBelowBar(page);

        await scrollIntoReplyBefore(page, thirdPrompt);
        await expectPinnedCardHeaderBelowBar(page);
      });
    });
  });
}
