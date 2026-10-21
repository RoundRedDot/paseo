import {
  WorkspaceHeaderExplorerToggle,
  WorkspaceExplorerSidebarToggle,
} from "./workspace-explorer-toggle";
import { describe, expect, it } from "vitest";
import { SidebarCloseButton } from "@/components/headers/sidebar-close-button";
import { resolveWorkspaceTabChipBackdrop } from "@/screens/workspace/workspace-tab-chip-backdrop";
import { darkPureBlackTheme, darkTheme, lightTheme } from "@/styles/theme";
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
      activeTab: null,
      viewportWidth: 1200,
      tabLabelWidths: [56, 70, 49],
      metrics,
      compact: false,
    });

    expect(result.closeButtonPolicy).toBe("all");
    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(result.items).toHaveLength(3);
    expect(result.items.every((item) => item.showLabel)).toBe(true);
    expect(result.items.map((item) => item.width)).toEqual([90, 104, 83]);
  });

  it("lets short labels use their content width below the old 96px floor", () => {
    const result = computeWorkspaceTabLayout({
      activeTab: null,
      viewportWidth: 300,
      tabLabelWidths: [29, 52],
      metrics: { ...metrics, actionsReservedWidth: 36 },
      compact: false,
    });
    expect(result.items).toEqual([
      { width: 64, showLabel: true },
      { width: 86, showLabel: true },
    ]);
    expect(result.requiresHorizontalScrollFallback).toBe(false);
  });

  it("sizes a single tab to the width its label needs", () => {
    const result = computeWorkspaceTabLayout({
      activeTab: null,
      viewportWidth: 1200,
      tabLabelWidths: [105],
      metrics,
      compact: false,
    });

    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(result.items.map((item) => item.width)).toEqual([139]);
  });

  it("shares what the rail can afford equally once no label fits whole", () => {
    const result = computeWorkspaceTabLayout({
      activeTab: null,
      viewportWidth: 460,
      tabLabelWidths: [168, 84, 56],
      metrics,
      compact: false,
    });

    expect(result.closeButtonPolicy).toBe("all");
    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(result.items.map((item) => item.width)).toEqual([113, 113, 90]);
    expect(result.items.every((item) => item.showLabel)).toBe(true);
  });

  it("spreads a crowded rail evenly instead of dropping every tab to one cap", () => {
    const result = computeWorkspaceTabLayout({
      activeTab: null,
      viewportWidth: 1004,
      tabLabelWidths: [280, 280, 280, 280],
      metrics: {
        ...metrics,
        actionsReservedWidth: 44,
        rowPaddingHorizontal: 0,
        tabGap: 0,
      },
      compact: false,
    });

    expect(result.closeButtonPolicy).toBe("all");
    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(result.items.map((item) => item.width)).toEqual([240, 240, 240, 240]);
  });

  it("keeps every tab at the clickable minimum at the exact fit boundary", () => {
    const result = computeWorkspaceTabLayout({
      activeTab: null,
      viewportWidth: 404,
      tabLabelWidths: [98, 98, 98, 98],
      metrics,
      compact: false,
    });

    expect(result.closeButtonPolicy).toBe("all");
    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(result.items.map((item) => item.width)).toEqual([64, 64, 64, 64]);
    expect(result.items.every((item) => item.showLabel)).toBe(true);
  });

  it("scrolls at natural widths rather than shrinking below the clickable minimum", () => {
    const result = computeWorkspaceTabLayout({
      activeTab: null,
      viewportWidth: 403,
      tabLabelWidths: [98, 98, 98, 98],
      metrics,
      compact: false,
    });

    expect(result.closeButtonPolicy).toBe("all");
    expect(result.requiresHorizontalScrollFallback).toBe(true);
    expect(result.items.map((item) => item.width)).toEqual([132, 132, 132, 132]);
    expect(result.items.every((item) => item.showLabel)).toBe(true);
  });

  it("keeps natural widths and no inline close on compact layouts while the tabs fit", () => {
    const result = computeWorkspaceTabLayout({
      activeTab: null,
      viewportWidth: 600,
      tabLabelWidths: [56, 70, 49],
      metrics,
      compact: true,
    });

    expect(result.closeButtonPolicy).toBe("none");
    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(result.items.map((item) => item.width)).toEqual([90, 104, 83]);
  });

  it("scrolls compact layouts as soon as natural widths overflow instead of squeezing labels", () => {
    const result = computeWorkspaceTabLayout({
      activeTab: null,
      viewportWidth: 460,
      tabLabelWidths: [168, 84, 56],
      metrics,
      compact: true,
    });

    expect(result.requiresHorizontalScrollFallback).toBe(true);
    expect(result.items.map((item) => item.width)).toEqual([202, 118, 90]);
    expect(result.items.every((item) => item.showLabel)).toBe(true);
  });

  it("widens tabs past the old cap when the rail has room for both labels", () => {
    // An unfolded foldable's pane: a wide rail, two long labels, and no other tab to spend it on.
    const result = computeWorkspaceTabLayout({
      activeTab: null,
      viewportWidth: 698,
      tabLabelWidths: [300, 180],
      metrics: { ...metrics, actionsReservedWidth: 36, rowPaddingHorizontal: 4 },
      compact: false,
    });

    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(result.items.map((item) => item.width)).toEqual([334, 214]);
    // Both labels are shown whole: nothing is truncated while the rail has width to spare.
    expect(result.items.map((item) => item.width - TAB_CHROME_WIDTH)).toEqual([300, 180]);
  });

  it("spends the rail on the label that still does not fit instead of capping every tab", () => {
    const result = computeWorkspaceTabLayout({
      activeTab: null,
      viewportWidth: 698,
      tabLabelWidths: [500, 120],
      metrics: { ...metrics, actionsReservedWidth: 36, rowPaddingHorizontal: 4 },
      compact: false,
    });

    const availableTabsWidth = 698 - 36 - 4 * 2 - 4;
    const widths = result.items.map((item) => item.width);
    expect(widths).toEqual([496, 154]);
    expect(widths[0]).toBeGreaterThan(160);
    expect(widths.reduce((total, width) => total + width, 0)).toBe(availableTabsWidth);
  });

  it("never shrinks a tab as a non-scrolling rail widens", () => {
    const tabLabelWidths = [300, 80, 220, 140];
    const widthsAt = (viewportWidth: number) =>
      computeWorkspaceTabLayout({
        activeTab: null,
        viewportWidth,
        tabLabelWidths,
        metrics,
        compact: false,
      }).items.map((item) => item.width);

    let previous = widthsAt(404);
    for (let viewportWidth = 420; viewportWidth <= 1400; viewportWidth += 20) {
      const current = widthsAt(viewportWidth);
      current.forEach((width, index) => {
        expect(width).toBeGreaterThanOrEqual(previous[index]);
      });
      previous = current;
    }
  });

  it("gives the selected tablet tab 240px before shrinking neighboring tabs", () => {
    const result = computeWorkspaceTabLayout({
      compact: false,
      viewportWidth: 620,
      tabLabelWidths: [400, 400, 400, 400],
      metrics,
      activeTab: { index: 2, preferredWidth: 240 },
    });

    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(result.items.map((item) => item.width)).toEqual([78, 77, 240, 77]);
  });

  it("keeps the selected title wide when the row must scroll", () => {
    const result = computeWorkspaceTabLayout({
      compact: false,
      viewportWidth: 500,
      tabLabelWidths: [400, 400, 400, 400],
      metrics,
      activeTab: { index: 3, preferredWidth: 240 },
    });

    expect(result.requiresHorizontalScrollFallback).toBe(true);
    expect(result.items.map((item) => item.width)).toEqual([64, 64, 64, 240]);
  });

  it("moves the width budget with selection", () => {
    for (const index of [0, 1, 2]) {
      const result = computeWorkspaceTabLayout({
        compact: false,
        viewportWidth: 450,
        tabLabelWidths: [400, 400, 400],
        metrics,
        activeTab: { index, preferredWidth: 240 },
      });
      expect(result.items.map((item) => item.width)).toEqual(
        [0, 1, 2].map((tabIndex) => (tabIndex === index ? 240 : 64)),
      );
    }
  });

  it("does not stretch a short selected title to the priority cap", () => {
    const result = computeWorkspaceTabLayout({
      compact: false,
      viewportWidth: 600,
      tabLabelWidths: [400, 30, 400],
      metrics,
      activeTab: { index: 1, preferredWidth: 240 },
    });
    expect(result.items.map((item) => item.width)).toEqual([196, 64, 196]);
  });

  it("keeps the selected tab within a narrow pane's visible scroll area", () => {
    const result = computeWorkspaceTabLayout({
      compact: false,
      viewportWidth: 300,
      tabLabelWidths: [400, 400, 400],
      metrics,
      activeTab: { index: 1, preferredWidth: 240 },
    });
    expect(result.requiresHorizontalScrollFallback).toBe(true);
    expect(result.items.map((item) => item.width)).toEqual([64, 160, 64]);
  });

  it("releases overflow after widening the tablet", () => {
    const result = computeWorkspaceTabLayout({
      compact: false,
      viewportWidth: 900,
      tabLabelWidths: [400, 400, 400, 400],
      metrics,
      activeTab: { index: 3, preferredWidth: 240 },
    });
    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(result.items.map((item) => item.width)).toEqual([171, 171, 170, 240]);
  });

  it("lets the selected title use spare width once other titles fit", () => {
    const result = computeWorkspaceTabLayout({
      compact: false,
      viewportWidth: 698,
      tabLabelWidths: [500, 120],
      metrics: { ...metrics, actionsReservedWidth: 36, rowPaddingHorizontal: 4 },
      activeTab: { index: 0, preferredWidth: 240 },
    });
    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(result.items.map((item) => item.width)).toEqual([496, 154]);
  });

  it("returns empty layout details when there are no tabs", () => {
    const result = computeWorkspaceTabLayout({
      activeTab: null,
      viewportWidth: 1200,
      tabLabelWidths: [],
      metrics,
      compact: false,
    });

    expect(result.closeButtonPolicy).toBe("all");
    expect(result.requiresHorizontalScrollFallback).toBe(false);
    expect(result.items).toEqual([]);
  });

  it("keeps rounded widths inside the rail when shares are fractional", () => {
    const result = computeWorkspaceTabLayout({
      activeTab: null,
      viewportWidth: 437,
      tabLabelWidths: [500, 500, 500],
      metrics,
      compact: false,
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
      activeTab: null,
      viewportWidth: 1200,
      tabLabelWidths: [68, 104],
      metrics,
      compact: false,
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

  it("closes the compact overlay with the same X as the compact agent list", () => {
    expect(WorkspaceExplorerSidebarToggle({ ...toggleProps, owner: "mobile" })?.type).toBe(
      SidebarCloseButton,
    );
    expect(WorkspaceExplorerSidebarToggle({ ...toggleProps, owner: "window" })?.type).not.toBe(
      SidebarCloseButton,
    );
  });
});

describe("resolveWorkspaceTabChipBackdrop", () => {
  const themes = { light: lightTheme, dark: darkTheme, pureBlack: darkPureBlackTheme };
  const rails = {
    sidebar: "surfaceSidebar",
    surface: "surface0",
  } as const;

  it("paints the active chip in a colour the rail does not already use, in every theme", () => {
    for (const [, theme] of Object.entries(themes)) {
      for (const [rail, resting] of Object.entries(rails) as Array<
        [keyof typeof rails, (typeof rails)[keyof typeof rails]]
      >) {
        const active = resolveWorkspaceTabChipBackdrop({
          rail,
          isActiveFocused: true,
          isFilled: true,
        });
        const filled = resolveWorkspaceTabChipBackdrop({
          rail,
          isActiveFocused: false,
          isFilled: true,
        });
        expect(theme.colors[active]).not.toBe(theme.colors[resting]);
        expect(theme.colors[filled]).not.toBe(theme.colors[resting]);
        expect(theme.colors[active]).not.toBe(theme.colors[filled]);
      }
    }
  });

  it("rests on the rail surface when the chip is neither active nor hovered", () => {
    expect(
      resolveWorkspaceTabChipBackdrop({ rail: "sidebar", isActiveFocused: false, isFilled: false }),
    ).toBe("surfaceSidebar");
    expect(
      resolveWorkspaceTabChipBackdrop({ rail: "surface", isActiveFocused: false, isFilled: false }),
    ).toBe("surface0");
  });
});
