/**
 * A sticky header pins to the visual top of the transcript (below anything floating over
 * it) while its row is crossing that line, and stops at the end of its row. Every scroll
 * frame moves it, so the transcript expresses its position as one linear function of the
 * scroll offset, `hiddenTop = direction * scrollOffset + base + stickyInset`, and rebuilds
 * only `base` when layout changes. That keeps per-frame work on Animated's native driver.
 *
 * `hiddenTop` is how far the row's top has scrolled above the sticky line, in points,
 * positive downward on screen: the translation that keeps a header at the line.
 */
export type StickyOrientation = "inverted" | "forward";

/**
 * The scroll offset counts toward older content in an inverted list, which moves rows down
 * the screen, and toward newer content in a forward one, which moves them up.
 */
export function stickyScrollDirection(orientation: StickyOrientation): 1 | -1 {
  return orientation === "inverted" ? -1 : 1;
}

/**
 * The inverted list lays content out from the visual bottom: a cell occupies
 * `[cellStart, cellStart + cellLength]` measured from there. Inside a cell, rows keep their
 * normal top-down order, so a row's visual top is the cell's visual top plus its offset.
 */
export function invertedStickyBase(input: {
  cellStart: number;
  cellLength: number;
  offsetInCell: number;
  viewportHeight: number;
  topInset: number;
}): number {
  return (
    input.cellStart + input.cellLength - input.offsetInCell - input.viewportHeight + input.topInset
  );
}

/** A forward list measures a row's top from the start of the scrolled content. */
export function forwardStickyBase(input: { contentTop: number; topInset: number }): number {
  return input.topInset - input.contentTop;
}

export function stickyHiddenTop(input: {
  orientation: StickyOrientation;
  base: number;
  scrollOffset: number;
  stickyInset: number;
}): number {
  return (
    stickyScrollDirection(input.orientation) * input.scrollOffset + input.base + input.stickyInset
  );
}

/** How far a header can follow its row before the row's end pushes it out. */
export function stickyTravel(input: { contentHeight: number; headerHeight: number }): number {
  return Math.max(0, input.contentHeight - input.headerHeight);
}

/** Zero while the row's top is below the line, then the row drags the header out. */
export function clampStickyTranslate(input: {
  hiddenTop: number;
  contentHeight: number;
  headerHeight: number;
}): number {
  return Math.min(Math.max(input.hiddenTop, 0), stickyTravel(input));
}
