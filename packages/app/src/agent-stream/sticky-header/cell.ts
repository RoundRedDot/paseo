import { useRef, useState } from "react";
import type { View } from "react-native";
import type { CellFrame } from "../reading-anchor";
import { createListenerSet, type StickyCell } from "./context";

export interface StickyCellHandle {
  cell: StickyCell;
  /** Records the cell's latest frame and re-measures the sticky rows inside it. */
  setFrame: (frame: CellFrame) => void;
}

export function useStickyCell(): StickyCellHandle {
  const node = useRef<View>(null);
  const [handle] = useState((): StickyCellHandle => {
    const listeners = createListenerSet();
    let frame: CellFrame | null = null;
    return {
      cell: { node, getFrame: () => frame, subscribe: listeners.subscribe },
      setFrame(next) {
        frame = next;
        listeners.notify();
      },
    };
  });
  return handle;
}
