import { createContext, type RefObject } from "react";
import type { Animated, View } from "react-native";
import type { CellFrame } from "../reading-anchor";
import type { StickyOrientation } from "./model";

export interface StickyGeometry {
  base: number;
  height: number;
}

/**
 * What the transcript viewport tells a sticky row: how its scroll offset moves rows, and how
 * to turn a row's layout into the `base` of `model.ts`. Each strategy measures differently.
 */
export interface StickyViewport {
  orientation: StickyOrientation;
  scrollOffset: Animated.Value;
  measure: (
    target: View,
    cell: StickyCell | null,
    onMeasured: (geometry: StickyGeometry) => void,
  ) => void;
  /** Fires after layout that can move rows without resizing them. */
  subscribe: (listener: () => void) => () => void;
}

/** A native list cell, the frame a row inside it is measured against. */
export interface StickyCell {
  node: RefObject<View | null>;
  getFrame: () => CellFrame | null;
  subscribe: (listener: () => void) => () => void;
}

export const StickyViewportContext = createContext<StickyViewport | null>(null);
export const StickyCellContext = createContext<StickyCell | null>(null);
/** Clearance taken at the visual top by the sticky prompt bar, animated with the bar. */
export const StickyInsetContext = createContext<Animated.AnimatedInterpolation<number> | null>(
  null,
);

export function createListenerSet() {
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    notify() {
      for (const listener of listeners) {
        listener();
      }
    },
  };
}
