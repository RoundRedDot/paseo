import { describe, expect, it } from "vitest";
import {
  resolveSidebarFooterButtonWidth,
  resolveSidebarFooterCapacity,
  resolveSidebarFooterSlots,
} from "./sidebar-footer-overflow";

describe("resolveSidebarFooterSlots", () => {
  it("shows every slot when the line fits them", () => {
    expect(resolveSidebarFooterSlots({ capacity: 5 })).toEqual({
      visible: ["addProject", "usage", "hosts", "help", "settings"],
      hidden: [],
    });
  });

  it("shows every slot before the line is measured", () => {
    expect(resolveSidebarFooterSlots({ capacity: null }).hidden).toEqual([]);
  });

  it("gives More the last place and hides slots from the end", () => {
    // A 160dp sidebar leaves 144dp between the footer's 8dp insets: three 44dp places.
    expect(resolveSidebarFooterSlots({ capacity: 3 })).toEqual({
      visible: ["addProject", "usage"],
      hidden: ["hosts", "help", "settings"],
    });
  });

  it("moves two slots behind More when one place is missing", () => {
    // Four places: three slots and More.
    expect(resolveSidebarFooterSlots({ capacity: 4 })).toEqual({
      visible: ["addProject", "usage", "hosts"],
      hidden: ["help", "settings"],
    });
  });

  it("hides every slot behind More when only one place fits", () => {
    expect(resolveSidebarFooterSlots({ capacity: 1 }).visible).toEqual([]);
  });
});

describe("resolveSidebarFooterCapacity", () => {
  it("counts whole places and reports nothing before the line is measured", () => {
    expect(resolveSidebarFooterCapacity({ availableWidth: 144, buttonWidth: 44 })).toBe(3);
    expect(resolveSidebarFooterCapacity({ availableWidth: 219, buttonWidth: 44 })).toBe(4);
    expect(resolveSidebarFooterCapacity({ availableWidth: 0, buttonWidth: 44 })).toBeNull();
  });

  it("holds the same value across the layout passes of a resize", () => {
    const widths = [300, 296, 191, 187, 183, 179, 175];
    const capacities = widths.map((availableWidth) =>
      resolveSidebarFooterCapacity({ availableWidth, buttonWidth: 44 }),
    );
    expect(capacities).toEqual([6, 6, 4, 4, 4, 4, 3]);
  });
});

describe("resolveSidebarFooterButtonWidth", () => {
  it("uses the touch size below the md breakpoint and the pointer size from it", () => {
    expect(resolveSidebarFooterButtonWidth(599)).toBe(44);
    expect(resolveSidebarFooterButtonWidth(600)).toBe(28);
    expect(resolveSidebarFooterButtonWidth(698)).toBe(28);
    expect(resolveSidebarFooterButtonWidth(720)).toBe(28);
  });
});
