import { describe, expect, it } from "vitest";
import {
  resolveSidebarFooterButtonWidth,
  resolveSidebarFooterSlots,
} from "./sidebar-footer-overflow";

describe("resolveSidebarFooterSlots", () => {
  it("shows every slot when the line fits them", () => {
    expect(resolveSidebarFooterSlots({ availableWidth: 220, buttonWidth: 44 })).toEqual({
      visible: ["addProject", "usage", "hosts", "help", "settings"],
      hidden: [],
    });
  });

  it("shows every slot before the line is measured", () => {
    expect(resolveSidebarFooterSlots({ availableWidth: 0, buttonWidth: 44 }).hidden).toEqual([]);
  });

  it("gives More the last place and hides slots from the end", () => {
    // A 160dp sidebar leaves 144dp between the footer's 8dp insets: three 44dp places.
    expect(resolveSidebarFooterSlots({ availableWidth: 144, buttonWidth: 44 })).toEqual({
      visible: ["addProject", "usage"],
      hidden: ["hosts", "help", "settings"],
    });
  });

  it("moves two slots behind More when one place is missing", () => {
    // Four places: three slots and More.
    expect(resolveSidebarFooterSlots({ availableWidth: 219, buttonWidth: 44 })).toEqual({
      visible: ["addProject", "usage", "hosts"],
      hidden: ["help", "settings"],
    });
  });

  it("hides every slot behind More when only one place fits", () => {
    expect(resolveSidebarFooterSlots({ availableWidth: 50, buttonWidth: 44 }).visible).toEqual([]);
  });
});

describe("resolveSidebarFooterButtonWidth", () => {
  it("uses the touch size below the md breakpoint and the pointer size from it", () => {
    expect(resolveSidebarFooterButtonWidth(698)).toBe(44);
    expect(resolveSidebarFooterButtonWidth(720)).toBe(28);
  });
});
