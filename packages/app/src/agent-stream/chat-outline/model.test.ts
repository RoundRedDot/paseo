import { describe, expect, it } from "vitest";
import type { StreamItem } from "@/types/stream";
import {
  createActivePromptPublisher,
  shouldAcceptPromptIndexEpoch,
  promptTickMagnification,
  resolveActivePromptSeq,
  resolveReadingPosition,
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
