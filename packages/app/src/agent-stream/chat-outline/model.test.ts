import { describe, expect, it } from "vitest";
import type { StreamItem } from "@/types/stream";
import {
  createActivePromptPublisher,
  createStickyPromptPublisher,
  deriveLoadedPrompts,
  shouldAcceptPromptIndexEpoch,
  promptTickMagnification,
  resolveActivePromptSeq,
  resolveReadingPosition,
  resolveStickyPrompt,
  OUTLINE_MAGNIFY_RADIUS,
  type ChatOutlinePrompt,
  type ReadingRow,
} from "./model";

describe("chat outline prompt index epoch", () => {
  it("accepts only the authoritative timeline epoch", () => {
    expect(shouldAcceptPromptIndexEpoch("epoch-2", "epoch-2")).toBe(true);
    expect(shouldAcceptPromptIndexEpoch("epoch-2", "epoch-1")).toBe(false);
  });
});

function prompt(seq: number): ChatOutlinePrompt {
  return { seq, timestamp: new Date(seq).toISOString(), preview: `prompt ${seq}` };
}

describe("promptTickMagnification", () => {
  it("peaks under the pointer and decays to nothing at the radius", () => {
    expect(promptTickMagnification(0)).toBe(1);
    expect(promptTickMagnification(OUTLINE_MAGNIFY_RADIUS)).toBe(0);
    expect(promptTickMagnification(OUTLINE_MAGNIFY_RADIUS + 10)).toBe(0);
  });

  it("falls off monotonically and symmetrically around the pointer", () => {
    const above = [0, 1, 2, 3].map((distance) => promptTickMagnification(distance));
    const below = [0, -1, -2, -3].map((distance) => promptTickMagnification(distance));

    expect(above).toEqual(below);
    expect(above).toEqual([...above].sort((left, right) => right - left));
  });
});

describe("resolveActivePromptSeq", () => {
  const prompts = [prompt(2), prompt(9), prompt(20)];

  it("marks the prompt whose turn the reading position sits in", () => {
    expect(resolveActivePromptSeq(prompts, 9)).toBe(9);
    expect(resolveActivePromptSeq(prompts, 14)).toBe(9);
    expect(resolveActivePromptSeq(prompts, 20)).toBe(20);
    expect(resolveActivePromptSeq(prompts, 99)).toBe(20);
  });

  it("marks nothing above the first prompt or without a reading position", () => {
    expect(resolveActivePromptSeq(prompts, 1)).toBeNull();
    expect(resolveActivePromptSeq(prompts, null)).toBeNull();
    expect(resolveActivePromptSeq([], 42)).toBeNull();
  });
});

describe("createActivePromptPublisher", () => {
  it("notifies subscribers only when the active prompt changes", () => {
    const publisher = createActivePromptPublisher();
    let notifications = 0;
    const unsubscribe = publisher.subscribe(() => {
      notifications += 1;
    });

    publisher.publish(9);
    publisher.publish(9);
    publisher.publish(20);
    unsubscribe();
    publisher.publish(null);

    expect(notifications).toBe(2);
    expect(publisher.getActiveSeq()).toBeNull();
  });
});

function userMessage(id: string, seq: number | null, text = id): StreamItem {
  return {
    kind: "user_message",
    id,
    text,
    timestamp: new Date(Math.max(seq ?? 0, 0)),
    ...(seq === null ? {} : { timelineCursor: { epoch: "epoch-1", seq } }),
  };
}

function assistantRow(id: string, seq: number | null): StreamItem {
  return {
    kind: "assistant_message",
    id,
    text: id,
    timestamp: new Date(0),
    ...(seq === null ? {} : { timelineCursor: { epoch: "epoch-1", seq } }),
  };
}

function rowsAboveEachOther(items: StreamItem[]): (id: string) => ReadingRow | undefined {
  const rows = new Map(
    items.map((item, index) => [item.id, { item, aboveItem: items[index - 1] ?? null }]),
  );
  return (id) => rows.get(id);
}

describe("resolveReadingPosition", () => {
  const getRow = rowsAboveEachOther([
    userMessage("prompt", 4),
    assistantRow("answer", 5),
    assistantRow("answer:block:1", null),
    userMessage("optimistic", null),
  ]);

  it("reads the row's own timeline position", () => {
    expect(resolveReadingPosition("answer", getRow)).toEqual({ seq: 5, isPromptRow: false });
    expect(resolveReadingPosition("prompt", getRow)).toEqual({ seq: 4, isPromptRow: true });
  });

  it("places rows without a cursor in the turn of the nearest earlier row", () => {
    expect(resolveReadingPosition("answer:block:1", getRow)).toEqual({
      seq: 5,
      isPromptRow: false,
    });
    expect(resolveReadingPosition("optimistic", getRow)).toEqual({ seq: 5, isPromptRow: true });
  });

  it("reads nothing without a row or any earlier cursor", () => {
    expect(resolveReadingPosition(null, getRow)).toBeNull();
    expect(resolveReadingPosition("missing", getRow)).toBeNull();
    expect(
      resolveReadingPosition("draft", rowsAboveEachOther([userMessage("draft", null)])),
    ).toBeNull();
  });
});

describe("deriveLoadedPrompts", () => {
  it("lists loaded prompts of the viewed epoch in timeline order with index previews", () => {
    const longText = `${"word ".repeat(40)}\n\nend`;
    const stale: StreamItem = {
      kind: "user_message",
      id: "stale",
      text: "stale",
      timestamp: new Date(1),
      timelineCursor: { epoch: "epoch-0", seq: 1 },
    };
    const prompts = deriveLoadedPrompts(
      [
        userMessage("second", 9, "  second\n prompt "),
        assistantRow("answer", 10),
        stale,
        userMessage("first", 2, longText),
        userMessage("optimistic", null),
      ],
      "epoch-1",
    );

    expect(prompts.map((entry) => entry.seq)).toEqual([2, 9]);
    expect(prompts[1]?.preview).toBe("second prompt");
    expect(prompts[0]?.preview).toHaveLength(120);
    expect(prompts[0]?.preview.endsWith("…")).toBe(true);
  });
});

describe("resolveStickyPrompt", () => {
  const prompts = [prompt(2), prompt(9), prompt(20)];

  it("pins the prompt of the turn under the reading line", () => {
    expect(resolveStickyPrompt({ prompts, position: { seq: 14, isPromptRow: false } })).toEqual(
      prompt(9),
    );
    expect(resolveStickyPrompt({ prompts, position: { seq: 99, isPromptRow: false } })).toEqual(
      prompt(20),
    );
  });

  it("hides while a prompt row is itself at the reading line", () => {
    expect(resolveStickyPrompt({ prompts, position: { seq: 9, isPromptRow: true } })).toBeNull();
  });

  it("hides above the first prompt and without a reading position", () => {
    expect(resolveStickyPrompt({ prompts, position: { seq: 1, isPromptRow: false } })).toBeNull();
    expect(resolveStickyPrompt({ prompts, position: null })).toBeNull();
    expect(
      resolveStickyPrompt({ prompts: [], position: { seq: 14, isPromptRow: false } }),
    ).toBeNull();
  });
});

describe("createStickyPromptPublisher", () => {
  it("notifies only when the pinned prompt or its text changes", () => {
    const publisher = createStickyPromptPublisher();
    let notifications = 0;
    publisher.subscribe(() => {
      notifications += 1;
    });

    publisher.publish(prompt(9));
    publisher.publish({ ...prompt(9) });
    publisher.publish({ ...prompt(9), preview: "edited" });
    publisher.publish(null);
    publisher.publish(null);

    expect(notifications).toBe(3);
    expect(publisher.getPrompt()).toBeNull();
  });
});
