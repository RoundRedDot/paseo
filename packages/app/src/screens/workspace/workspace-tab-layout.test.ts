import {
  WorkspaceHeaderExplorerToggle,
  WorkspaceExplorerSidebarToggle,
} from "./workspace-explorer-toggle";
import { describe, expect, it } from "vitest";
import {
  computeWorkspaceTabLayout,
  retainWorkspaceTabMeasuredWidth,
} from "@/screens/workspace/workspace-tab-layout";

const metrics = {
  rowHorizontalInset: 0,
  actionsReservedWidth: 120,
  rowPaddingHorizontal: 8,
  tabGap: 4,
  minTabWidth: 64,
  tabIconWidth: 14,
  tabContentGap: 4,
  tabHorizontalPadding: 8,
  closeButtonWidth: 0,
};

/** Chip chrome: icon + content gap + both paddings. A tab needs this plus its label. */
const TAB_CHROME_WIDTH = 34;

describe("computeWorkspaceTabLayout", () => {
  it("keeps each tab at its natural content width when space is available", () => {
    const result = computeWorkspaceTabLayout({
      viewportWidth: 1200,
      tabLabelWidths: [56, 70, 49],
      metrics,
    });

    expect(result.closeButtonPolicy).toBe("all");
    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(result.items).toHaveLength(3);
    expect(result.items.every((item) => item.showLabel)).toBe(true);
    expect(result.items.map((item) => item.width)).toEqual([90, 104, 83]);
  });

  it("lets short labels use their content width below the old 96px floor", () => {
    const result = computeWorkspaceTabLayout({
      viewportWidth: 300,
      tabLabelWidths: [29, 52],
      metrics: { ...metrics, actionsReservedWidth: 36 },
    });
    expect(result.items).toEqual([
      { width: 64, showLabel: true },
      { width: 86, showLabel: true },
    ]);
    expect(result.requiresHorizontalScrollFallback).toBe(false);
  });

  it("sizes a single tab to the width its label needs", () => {
    const result = computeWorkspaceTabLayout({
      viewportWidth: 1200,
      tabLabelWidths: [105],
      metrics,
    });

    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(result.items.map((item) => item.width)).toEqual([139]);
  });

  it("shares what the rail can afford equally once no label fits whole", () => {
    const result = computeWorkspaceTabLayout({
      viewportWidth: 460,
      tabLabelWidths: [168, 84, 56],
      metrics,
    });

    expect(result.closeButtonPolicy).toBe("all");
    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(result.items.map((item) => item.width)).toEqual([113, 113, 90]);
    expect(result.items.every((item) => item.showLabel)).toBe(true);
  });

  it("spreads a crowded rail evenly instead of dropping every tab to one cap", () => {
    const result = computeWorkspaceTabLayout({
      viewportWidth: 1004,
      tabLabelWidths: [280, 280, 280, 280],
      metrics: {
        ...metrics,
        actionsReservedWidth: 44,
        rowPaddingHorizontal: 0,
        tabGap: 0,
      },
    });

    expect(result.closeButtonPolicy).toBe("all");
    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(result.items.map((item) => item.width)).toEqual([240, 240, 240, 240]);
  });

  it("keeps every tab at the clickable minimum at the exact fit boundary", () => {
    const result = computeWorkspaceTabLayout({
      viewportWidth: 404,
      tabLabelWidths: [98, 98, 98, 98],
      metrics,
    });

    expect(result.closeButtonPolicy).toBe("all");
    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(result.items.map((item) => item.width)).toEqual([64, 64, 64, 64]);
    expect(result.items.every((item) => item.showLabel)).toBe(true);
  });

  it("uses horizontal scroll rather than shrinking below the clickable minimum", () => {
    const result = computeWorkspaceTabLayout({
      viewportWidth: 403,
      tabLabelWidths: [98, 98, 98, 98],
      metrics,
    });

    expect(result.closeButtonPolicy).toBe("all");
    expect(result.requiresHorizontalScrollFallback).toBe(true);
    expect(result.items.map((item) => item.width)).toEqual([64, 64, 64, 64]);
    expect(result.items.every((item) => item.showLabel)).toBe(true);
  });

  it("widens tabs past the old cap when the rail has room for both labels", () => {
    // An unfolded foldable's pane: a wide rail, two long labels, and no other tab to spend it on.
    const result = computeWorkspaceTabLayout({
      viewportWidth: 698,
      tabLabelWidths: [300, 180],
      metrics: { ...metrics, actionsReservedWidth: 36, rowPaddingHorizontal: 4 },
    });

    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(result.items.map((item) => item.width)).toEqual([334, 214]);
    // Both labels are shown whole: nothing is truncated while the rail has width to spare.
    expect(result.items.map((item) => item.width - TAB_CHROME_WIDTH)).toEqual([300, 180]);
  });

  it("spends the rail on the label that still does not fit instead of capping every tab", () => {
    const result = computeWorkspaceTabLayout({
      viewportWidth: 698,
      tabLabelWidths: [500, 120],
      metrics: { ...metrics, actionsReservedWidth: 36, rowPaddingHorizontal: 4 },
    });

    const availableTabsWidth = 698 - 36 - 4 * 2 - 4;
    const widths = result.items.map((item) => item.width);
    expect(widths).toEqual([496, 154]);
    expect(widths[0]).toBeGreaterThan(160);
    expect(widths.reduce((total, width) => total + width, 0)).toBe(availableTabsWidth);
  });

  it("never shrinks a tab as the rail widens", () => {
    const tabLabelWidths = [300, 80, 220, 140];
    const widthsAt = (viewportWidth: number) =>
      computeWorkspaceTabLayout({ viewportWidth, tabLabelWidths, metrics }).items.map(
        (item) => item.width,
      );

    let previous = widthsAt(400);
    for (let viewportWidth = 420; viewportWidth <= 1400; viewportWidth += 20) {
      const current = widthsAt(viewportWidth);
      current.forEach((width, index) => {
        expect(width).toBeGreaterThanOrEqual(previous[index]);
      });
      previous = current;
    }
  });

  it("returns empty layout details when there are no tabs", () => {
    const result = computeWorkspaceTabLayout({
      viewportWidth: 1200,
      tabLabelWidths: [],
      metrics,
    });

    expect(result.closeButtonPolicy).toBe("all");
    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(result.items).toEqual([]);
  });

  it("keeps rounded widths inside the rail when shares are fractional", () => {
    const result = computeWorkspaceTabLayout({
      viewportWidth: 437,
      tabLabelWidths: [500, 500, 500],
      metrics,
    });

    const availableTabsWidth =
      437 - metrics.actionsReservedWidth - metrics.rowPaddingHorizontal * 2 - metrics.tabGap * 2;
    const widths = result.items.map((item) => item.width);
    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(widths).toEqual([97, 98, 98]);
    expect(widths.reduce((total, width) => total + width, 0)).toBe(availableTabsWidth);
  });

  it("uses rendered label width rather than character count", () => {
    const result = computeWorkspaceTabLayout({
      viewportWidth: 1200,
      tabLabelWidths: [68, 104],
      metrics,
    });

    expect(result.items.map((item) => item.width)).toEqual([102, 138]);
  });
});

describe("retainWorkspaceTabMeasuredWidth", () => {
  it("retains the last usable width while a retained panel is hidden", () => {
    expect(retainWorkspaceTabMeasuredWidth(720, 0)).toBe(720);
  });

  it("accepts the next usable layout width", () => {
    expect(retainWorkspaceTabMeasuredWidth(720, 640)).toBe(640);
  });
});

describe("Explorer toggle ownership", () => {
  const toggleProps = {
    onPress: () => {},
    label: "Close Explorer sidebar",
    tooltipLabel: "Toggle Explorer sidebar",
    tooltipKeys: [],
    accessibilityState: { expanded: true },
  };

  it("keeps only the header toggle when window controls do not obstruct it", () => {
    expect(WorkspaceHeaderExplorerToggle({ ...toggleProps, owner: "header" })).not.toBeNull();
    expect(WorkspaceExplorerSidebarToggle({ ...toggleProps, owner: "header" })).toBeNull();
  });

  it("keeps the dock toggle for window-owned and compact overlay chrome", () => {
    for (const owner of ["window", "mobile"] as const) {
      expect(WorkspaceHeaderExplorerToggle({ ...toggleProps, owner })).toBeNull();
      expect(WorkspaceExplorerSidebarToggle({ ...toggleProps, owner })).not.toBeNull();
    }
  });
});
