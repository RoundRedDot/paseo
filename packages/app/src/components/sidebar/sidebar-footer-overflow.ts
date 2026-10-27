import { APP_BREAKPOINTS } from "@/styles/breakpoints";
import { density } from "@/styles/density";

/** The footer's icon line, in display order. Slots that do not fit move into the More menu. */
export const SIDEBAR_FOOTER_SLOTS = ["addProject", "usage", "hosts", "help", "settings"] as const;

export type SidebarFooterSlot = (typeof SIDEBAR_FOOTER_SLOTS)[number];

/** The width `density.iconButton` resolves to, by the same breakpoint Unistyles uses. */
export function resolveSidebarFooterButtonWidth(windowWidth: number): number {
  return windowWidth >= APP_BREAKPOINTS.md ? density.iconButton.md : density.iconButton.xs;
}

/**
 * Splits the footer slots into the ones shown on the line and the ones behind More. When every
 * slot fits, none is hidden. Otherwise the More button takes the last place on the line, and the
 * slots from the end move behind it. An unmeasured line (`availableWidth` 0) shows every slot.
 */
export function resolveSidebarFooterSlots(input: { availableWidth: number; buttonWidth: number }): {
  visible: SidebarFooterSlot[];
  hidden: SidebarFooterSlot[];
} {
  const slotCount = SIDEBAR_FOOTER_SLOTS.length;
  const capacity =
    input.availableWidth > 0 && input.buttonWidth > 0
      ? Math.floor(input.availableWidth / input.buttonWidth)
      : slotCount;
  const visibleCount = capacity >= slotCount ? slotCount : Math.max(0, capacity - 1);
  return {
    visible: SIDEBAR_FOOTER_SLOTS.slice(0, visibleCount),
    hidden: SIDEBAR_FOOTER_SLOTS.slice(visibleCount),
  };
}
