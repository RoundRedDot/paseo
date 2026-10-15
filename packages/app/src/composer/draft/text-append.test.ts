import { describe, expect, it, vi } from "vitest";
import {
  appendDraftSnippet,
  appendToDraft,
  bindDraftTextAppender,
  registerDraftTextAppender,
} from "./text-append";

describe("composer text additions", () => {
  it.each([
    ["", "> cell\n\n"],
    ["draft", "draft\n\n> cell\n\n"],
    ["draft\n", "draft\n\n> cell\n\n"],
    ["draft\n\n", "draft\n\n> cell\n\n"],
  ])("separates a snippet from the existing draft %j", (before, expected) => {
    expect(appendDraftSnippet(before, "> cell\n\n")).toBe(expected);
  });

  it("uses the latest visible input, publishes the edit and requests focus", () => {
    let live = "typed since the store publication";
    const published: string[] = [];
    const focus = vi.fn();
    const release = bindDraftTextAppender(
      "agent:host-1:agent-1",
      () => ({
        getText: () => live,
        replaceText: (text) => {
          live = text;
          published.push(text);
        },
      }),
      focus,
    );
    try {
      expect(appendToDraft("agent:host-1:agent-1", "> first\n\n")).toBe(true);
      expect(appendToDraft("agent:host-1:agent-1", "> second\n\n")).toBe(true);
      expect(live).toBe("typed since the store publication\n\n> first\n\n> second\n\n");
      expect(published).toHaveLength(2);
      expect(focus).toHaveBeenCalledTimes(2);
      expect(appendToDraft("agent:other-host:agent-1", "> wrong host\n\n")).toBe(false);
      expect(appendToDraft("agent:host-1:other-agent", "> wrong agent\n\n")).toBe(false);
    } finally {
      release();
    }
    expect(appendToDraft("agent:host-1:agent-1", "> closed\n\n")).toBe(false);
  });

  it("rejects an unavailable input and an empty snippet without focusing", () => {
    const focus = vi.fn();
    const release = bindDraftTextAppender("unavailable", () => null, focus);
    try {
      expect(appendToDraft("unavailable", "> cell\n\n")).toBe(false);
      expect(appendToDraft("unavailable", "")).toBe(false);
      expect(focus).not.toHaveBeenCalled();
    } finally {
      release();
    }
  });

  it("does not unregister a remounted input when the old registration releases", () => {
    const first = registerDraftTextAppender("remount", () => false);
    const second = registerDraftTextAppender("remount", () => true);
    first();
    try {
      expect(appendToDraft("remount", "> cell\n\n")).toBe(true);
    } finally {
      second();
    }
  });
});
