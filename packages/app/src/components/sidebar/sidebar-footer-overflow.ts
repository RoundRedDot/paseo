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
 * How many finger-sized places the icon line holds, or `null` before it is measured. Only this
 * count changes what the footer renders, so a caller can keep it in state and ignore every layout
 * pass that lands inside the same bucket — a sidebar drag produces one per frame.
 */
export function resolveSidebarFooterCapacity(input: {
  availableWidth: number;
  buttonWidth: number;
}): number | null {
  if (input.availableWidth <= 0 || input.buttonWidth <= 0) {
    return null;
  }
  return Math.floor(input.availableWidth / input.buttonWidth);
}

/**
 * Splits the footer slots into the ones shown on the line and the ones behind More. When every
 * slot fits, none is hidden. Otherwise the More button takes the last place on the line, and the
 * slots from the end move behind it. An unmeasured line (`capacity` null) shows every slot.
 */
export function resolveSidebarFooterSlots(input: { capacity: number | null }): {
  visible: SidebarFooterSlot[];
  hidden: SidebarFooterSlot[];
} {
  const slotCount = SIDEBAR_FOOTER_SLOTS.length;
  const capacity = input.capacity ?? slotCount;
  const visibleCount = capacity >= slotCount ? slotCount : Math.max(0, capacity - 1);
  return {
    visible: SIDEBAR_FOOTER_SLOTS.slice(0, visibleCount),
    hidden: SIDEBAR_FOOTER_SLOTS.slice(visibleCount),
  };
}
