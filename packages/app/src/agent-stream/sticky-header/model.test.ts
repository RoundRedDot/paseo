import { describe, expect, it } from "vitest";
import {
  clampStickyTranslate,
  forwardStickyBase,
  invertedStickyBase,
  stickyHiddenTop,
} from "./model";

describe("sticky header position in an inverted list", () => {
  // Viewport 800 tall under a 100-point floating header; the card is 1000 tall and sits
  // 50 points into a cell that spans 2000-3100 from the visual bottom of the content.
  const base = invertedStickyBase({
    cellStart: 2000,
    cellLength: 1100,
    offsetInCell: 50,
    viewportHeight: 800,
    topInset: 100,
  });

  function hiddenTopAt(scrollOffset: number, stickyInset = 0) {
    return stickyHiddenTop({ orientation: "inverted", base, scrollOffset, stickyInset });
  }

  it("is zero when the card's top meets the line under the floating header", () => {
    // Visual top of the card: 800 - (3100 - 50 - offset). It equals 100 at offset 2350.
    expect(hiddenTopAt(2350)).toBe(0);
  });

  it("grows as the reader scrolls toward newer content and the card moves up", () => {
    expect(hiddenTopAt(2250)).toBe(100);
    expect(hiddenTopAt(2450)).toBe(-100);
  });

  it("starts below the sticky prompt bar when one is shown", () => {
    expect(hiddenTopAt(2350, 36)).toBe(36);
    expect(hiddenTopAt(2386, 36)).toBe(0);
  });
});

describe("sticky header position in a forward list", () => {
  const base = forwardStickyBase({ contentTop: 1500, topInset: 0 });

  function hiddenTopAt(scrollOffset: number, stickyInset = 0) {
    return stickyHiddenTop({ orientation: "forward", base, scrollOffset, stickyInset });
  }

  it("is zero when the card's top reaches the viewport top", () => {
    expect(hiddenTopAt(1500)).toBe(0);
  });

  it("grows as the reader scrolls toward newer content", () => {
    expect(hiddenTopAt(1700)).toBe(200);
    expect(hiddenTopAt(1300)).toBe(-200);
  });

  it("starts below the sticky prompt bar when one is shown", () => {
    expect(hiddenTopAt(1464, 36)).toBe(0);
  });
});

describe("clampStickyTranslate", () => {
  const card = { contentHeight: 1000, headerHeight: 40 };

  it("leaves the header in place until the card's top crosses the line", () => {
    expect(clampStickyTranslate({ ...card, hiddenTop: -250 })).toBe(0);
    expect(clampStickyTranslate({ ...card, hiddenTop: 0 })).toBe(0);
  });

  it("follows the line while the card crosses it", () => {
    expect(clampStickyTranslate({ ...card, hiddenTop: 420 })).toBe(420);
  });

  it("stops where the header meets the card's end", () => {
    expect(clampStickyTranslate({ ...card, hiddenTop: 960 })).toBe(960);
    expect(clampStickyTranslate({ ...card, hiddenTop: 5000 })).toBe(960);
  });

  it("never moves a header that fills its card", () => {
    expect(clampStickyTranslate({ contentHeight: 30, headerHeight: 40, hiddenTop: 100 })).toBe(0);
  });
});
