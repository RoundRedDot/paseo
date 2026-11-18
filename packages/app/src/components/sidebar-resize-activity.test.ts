import { describe, expect, it } from "vitest";
import {
  beginSidebarResize,
  endSidebarResize,
  isSidebarResizeActive,
} from "@/components/sidebar-resize-activity";

describe("sidebar resize activity", () => {
  it("is active from the first begin until the matching end", () => {
    expect(isSidebarResizeActive()).toBe(false);
    beginSidebarResize();
    expect(isSidebarResizeActive()).toBe(true);
    endSidebarResize();
    expect(isSidebarResizeActive()).toBe(false);
  });

  it("stays active while overlapping drags are still running", () => {
    beginSidebarResize();
    beginSidebarResize();
    endSidebarResize();
    expect(isSidebarResizeActive()).toBe(true);
    endSidebarResize();
    expect(isSidebarResizeActive()).toBe(false);
  });

  it("ignores an end without a begin", () => {
    endSidebarResize();
    expect(isSidebarResizeActive()).toBe(false);
    beginSidebarResize();
    expect(isSidebarResizeActive()).toBe(true);
    endSidebarResize();
    expect(isSidebarResizeActive()).toBe(false);
  });
});
