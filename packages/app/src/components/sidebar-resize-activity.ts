import { useSyncExternalStore } from "react";

/**
 * Whether a docked sidebar is being dragged to a new width. Surfaces that switch layout with the
 * workspace width read it to hold that switch until the drag ends: swapping a whole subtree on
 * every threshold crossing turns a drag into a series of full re-renders.
 *
 * Gestures call `begin` once they activate and `end` once they finish, so a tap on a grip never
 * counts. Overlapping drags (two pointers on two grips) keep the activity until both end.
 */
let activeResizes = 0;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function beginSidebarResize(): void {
  activeResizes += 1;
  if (activeResizes === 1) emit();
}

export function endSidebarResize(): void {
  if (activeResizes === 0) return;
  activeResizes -= 1;
  if (activeResizes === 0) emit();
}

export function isSidebarResizeActive(): boolean {
  return activeResizes > 0;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSidebarResizeActive(): boolean {
  return useSyncExternalStore(subscribe, isSidebarResizeActive, isSidebarResizeActive);
}
