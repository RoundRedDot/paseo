import type { AgentTimelinePromptIndexPayload } from "@getpaseo/client/internal/daemon-client";
import type { StreamItem } from "@/types/stream";

export type ChatOutlinePrompt = AgentTimelinePromptIndexPayload["prompts"][number];

export function shouldAcceptPromptIndexEpoch(timelineEpoch: string, indexEpoch: string): boolean {
  return timelineEpoch === indexEpoch;
}

/**
 * Slots further than this from the pointer keep their resting size, so a long rail
 * magnifies a local band instead of swelling the whole column.
 */
export const OUTLINE_MAGNIFY_RADIUS = 3;

/**
 * Dock-style falloff: 1 under the pointer, easing to 0 at the radius. The raised cosine
 * has no corner at either end, so sweeping the rail reads as one bulge travelling with
 * the pointer rather than a band switching on and off.
 */
export function promptTickMagnification(slotDistance: number): number {
  const distance = Math.abs(slotDistance);
  if (!Number.isFinite(distance) || distance >= OUTLINE_MAGNIFY_RADIUS) {
    return 0;
  }
  return (1 + Math.cos((Math.PI * distance) / OUTLINE_MAGNIFY_RADIUS)) / 2;
}

/**
 * The prompt whose turn the reader is inside: the last indexed prompt at or before the
 * timeline position under the top of the viewport. It reads the complete daemon index,
 * so a prompt outside the loaded window still lights up while its turn is on screen.
 */
export function resolveActivePromptSeq(
  prompts: readonly ChatOutlinePrompt[],
  anchorSeq: number | null,
): number | null {
  if (anchorSeq === null) {
    return null;
  }
  let activeSeq: number | null = null;
  for (const prompt of prompts) {
    if (prompt.seq > anchorSeq) {
      break;
    }
    activeSeq = prompt.seq;
  }
  return activeSeq;
}

export interface ActivePromptSource {
  subscribe: (listener: () => void) => () => void;
  getActiveSeq: () => number | null;
}

export interface ActivePromptPublisher extends ActivePromptSource {
  publish: (seq: number | null) => void;
}

/**
 * The transcript reports its reading position on every scroll frame, far more often than
 * it re-renders. Keeping the active prompt outside React lets the rail subscribe to it
 * without dragging the transcript through a render on each frame.
 */
export function createActivePromptPublisher(): ActivePromptPublisher {
  const listeners = new Set<() => void>();
  let activeSeq: number | null = null;
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getActiveSeq: () => activeSeq,
    publish(seq) {
      if (seq === activeSeq) {
        return;
      }
      activeSeq = seq;
      for (const listener of listeners) {
        listener();
      }
    },
  };
}

/** Where the reader is: the timeline position under the top of the viewport, and whether
 * the row there is itself a prompt. */
export interface ReadingPosition {
  seq: number;
  isPromptRow: boolean;
}

export interface ReadingRow {
  item: StreamItem;
  aboveItem: StreamItem | null;
}

/**
 * Display rows such as Markdown blocks, live rows and optimistic prompts carry no timeline
 * cursor of their own. They belong to the turn of the nearest earlier row that has one, so a
 * reader parked on them still sits inside that turn.
 */
export function resolveReadingPosition(
  rowId: string | null,
  getRow: (id: string) => ReadingRow | undefined,
): ReadingPosition | null {
  let row = rowId === null ? undefined : getRow(rowId);
  const isPromptRow = row?.item.kind === "user_message";
  while (row) {
    const seq = row.item.timelineCursor?.seq;
    if (seq !== undefined) {
      return { seq, isPromptRow };
    }
    row = row.aboveItem ? getRow(row.aboveItem.id) : undefined;
  }
  return null;
}
