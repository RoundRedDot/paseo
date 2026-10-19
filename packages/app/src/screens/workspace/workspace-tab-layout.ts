export type WorkspaceTabCloseButtonPolicy = "all";

export interface WorkspaceTabLayoutMetrics {
  rowHorizontalInset: number;
  actionsReservedWidth: number;
  rowPaddingHorizontal: number;
  tabGap: number;
  minTabWidth: number;
  tabIconWidth: number;
  tabContentGap: number;
  tabHorizontalPadding: number;
  closeButtonWidth: number;
}

export interface WorkspaceTabLayoutInput {
  viewportWidth: number;
  tabLabelWidths: number[];
  metrics: WorkspaceTabLayoutMetrics;
}

export interface WorkspaceTabLayoutItem {
  width: number;
  showLabel: boolean;
}

export interface WorkspaceTabLayoutResult {
  items: WorkspaceTabLayoutItem[];
  closeButtonPolicy: WorkspaceTabCloseButtonPolicy;
  requiresHorizontalScrollFallback: boolean;
}

export function retainWorkspaceTabMeasuredWidth(
  currentWidth: number,
  measuredWidth: number,
): number {
  if (measuredWidth <= 0 || Math.abs(currentWidth - measuredWidth) <= 1) {
    return currentWidth;
  }
  return measuredWidth;
}

/**
 * Hands the rail's width to the tabs, so a label is never cut while the rail still has width to
 * give. A tab whose need (the width that shows its label whole) fits inside its equal share keeps
 * that need; the tabs that do not fit share what is left equally, cheapest need first. Every tab
 * keeps `minTabWidth`, and no tab grows past its own need, so the rail is only as empty as its
 * labels are short.
 */
function allocateTabWidths(needs: number[], availableWidth: number, minTabWidth: number): number[] {
  const tabCount = needs.length;
  const widths = needs.map(() => minTabWidth);
  let remainingWidth = availableWidth - minTabWidth * tabCount;
  let unresolvedTabCount = tabCount;
  const byNeed = needs
    .map((need, index) => ({ need, index }))
    .sort((left, right) => left.need - right.need);

  for (const { need, index } of byNeed) {
    const share = Math.max(remainingWidth / unresolvedTabCount, 0);
    const granted = Math.min(Math.max(need - minTabWidth, 0), share);
    widths[index] = minTabWidth + granted;
    remainingWidth -= granted;
    unresolvedTabCount -= 1;
  }

  return widths;
}

/** Round to whole pixels without changing the total by more than half a pixel. */
function roundTabWidths(widths: number[]): number[] {
  const rounded = widths.map((width) => Math.floor(width));
  const target = Math.round(widths.reduce((total, width) => total + width, 0));
  let remainder = target - rounded.reduce((total, width) => total + width, 0);
  const byFraction = widths
    .map((width, index) => ({ index, fraction: width - Math.floor(width) }))
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index);

  for (const { index } of byFraction) {
    if (remainder <= 0) {
      break;
    }
    rounded[index] += 1;
    remainder -= 1;
  }

  return rounded;
}

export function computeWorkspaceTabLayout(
  input: WorkspaceTabLayoutInput,
): WorkspaceTabLayoutResult {
  const tabCount = input.tabLabelWidths.length;
  if (tabCount === 0) {
    return {
      items: [],
      closeButtonPolicy: "all",
      requiresHorizontalScrollFallback: false,
    };
  }

  const availableWidth = Math.max(
    0,
    input.viewportWidth - input.metrics.rowHorizontalInset * 2 - input.metrics.actionsReservedWidth,
  );
  const rowOverhead =
    input.metrics.rowPaddingHorizontal * 2 + Math.max(tabCount - 1, 0) * input.metrics.tabGap;
  const availableTabsWidth = Math.max(0, availableWidth - rowOverhead);
  const tabChromeWidth =
    input.metrics.tabIconWidth +
    input.metrics.tabContentGap +
    input.metrics.tabHorizontalPadding * 2 +
    input.metrics.closeButtonWidth;
  const labelNeeds = input.tabLabelWidths.map((labelWidth) => tabChromeWidth + labelWidth);
  const minimumTotalWidth = input.metrics.minTabWidth * tabCount;
  const requiresHorizontalScrollFallback = availableTabsWidth < minimumTotalWidth;

  const resolvedWidths = requiresHorizontalScrollFallback
    ? Array.from({ length: tabCount }, () => input.metrics.minTabWidth)
    : allocateTabWidths(labelNeeds, availableTabsWidth, input.metrics.minTabWidth);

  const roundedWidths = roundTabWidths(resolvedWidths);

  return {
    items: roundedWidths.map((width) => ({
      width,
      showLabel: width > tabChromeWidth,
    })),
    closeButtonPolicy: "all",
    requiresHorizontalScrollFallback,
  };
}
