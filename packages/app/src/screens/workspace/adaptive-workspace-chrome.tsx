import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import {
  isSidebarResizeActive,
  useSidebarResizeActive,
} from "@/components/sidebar-resize-activity";
import { retainWorkspaceChromeWidth, selectWorkspaceChrome } from "./workspace-tab-layout";
import { WorkspaceTabMeasurementScope } from "./workspace-desktop-tabs-row";
import type { WorkspaceTabDescriptor } from "./workspace-tabs-types";

/**
 * Shows `children` (full header and tab rail) or `compactHeader` below the compact width.
 * Without a compact header it always shows `children`, keeping the same tree so they never remount.
 */
export function AdaptiveWorkspaceChrome({
  compactHeader,
  children,
}: {
  compactHeader: ReactNode | null;
  children: ReactNode;
}) {
  const [width, setWidth] = useState<number | null>(null);
  const resizing = useSidebarResizeActive();
  // Widths measured while a sidebar is being dragged wait here: switching between the full and
  // compact header swaps the whole chrome, so it happens once, at the width the drag ends on.
  const pendingWidthRef = useRef<number | null>(null);
  // Only the compact decision reads the width; keeping it until that flips stops a sidebar drag
  // from re-rendering the header and tab rail on every layout pass.
  const measure = useCallback((event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.width;
    if (isSidebarResizeActive()) {
      pendingWidthRef.current = measured;
      setWidth((current) =>
        current === null ? retainWorkspaceChromeWidth(null, measured) : current,
      );
      return;
    }
    pendingWidthRef.current = null;
    setWidth((current) => retainWorkspaceChromeWidth(current, measured));
  }, []);
  useEffect(() => {
    if (resizing) return;
    const pending = pendingWidthRef.current;
    if (pending === null) return;
    pendingWidthRef.current = null;
    setWidth((current) => retainWorkspaceChromeWidth(current, pending));
  }, [resizing]);
  return (
    <WorkspaceTabMeasurementScope>
      <View onLayout={measure}>
        {compactHeader === null
          ? children
          : selectWorkspaceChrome({ width, compact: compactHeader, full: children })}
      </View>
    </WorkspaceTabMeasurementScope>
  );
}

/** One pane's tabs, as its compact tab switcher and pane menu need them. */
export interface WorkspaceCompactHeaderTabs {
  tabs: WorkspaceTabDescriptor[];
  activeTabKey: string;
  actions: WorkspaceCompactHeaderActions;
}

export interface WorkspaceCompactHeaderActions {
  pane?: {
    id: string;
    splitRight?: () => void;
    splitDown?: () => void;
    toggleMaximized?: () => void;
    maximized: boolean;
  };
  closeAbove: (key: string) => Promise<void> | void;
  closeBelow: (key: string) => Promise<void> | void;
  closeOthers: (key: string) => Promise<void> | void;
}
