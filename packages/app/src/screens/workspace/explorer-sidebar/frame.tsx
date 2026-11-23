import { useCallback } from "react";
import { View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import {
  FileExplorerCloseGestureContext,
  useCloseFileExplorerGesture,
} from "@/mobile-panels/gestures";
import { useIsMobilePanelActive } from "@/mobile-panels/provider";
import { MobilePanelOverlay } from "@/mobile-panels/presentation";
import { SidebarResizeShift } from "@/components/sidebar-resize-preview";
import { RetainedPanelActivity } from "@/components/retained-panel";
import { resolveExplorerSidebarWidth } from "@/components/explorer-sidebar-layout";
import { useWorkspaceLayoutStore } from "@/stores/workspace-layout-store";
import { useWorkspaceViewportWidth } from "../workspace-viewport-width";
import { useExplorerGeometry } from "./geometry";
import type { ExplorerFrameProps } from "./frame-props";

function ExplorerFrameBase({
  children,
  surfaceColor,
  workspaceFill,
  borderColor,
  gripColor,
  presentation,
  isOpen,
  isWorkspaceActive,
  persistenceKey,
  viewportWidth,
}: ExplorerFrameProps) {
  const overlay = presentation === "overlay";
  // A closed dock does not follow the workspace width; the overlay sizes to it even while closed.
  const containerWidth = useWorkspaceViewportWidth(viewportWidth, overlay || isOpen);
  const settledOpen = useIsMobilePanelActive("file-explorer");
  const active = isWorkspaceActive && (overlay ? settledOpen : isOpen);
  const resizeEnabled = isWorkspaceActive && !overlay && isOpen;
  const { gesture, gestureRef } = useCloseFileExplorerGesture(isWorkspaceActive && overlay);
  const storedWidth = useWorkspaceLayoutStore(
    (state) => state.explorerSidebarWidthByWorkspace[persistenceKey],
  );
  const resize = useWorkspaceLayoutStore((state) => state.resizeExplorerSidebar);
  const onResize = useCallback(
    (width: number) => resize(persistenceKey, width),
    [persistenceKey, resize],
  );
  const geometry = useExplorerGeometry({
    width: resolveExplorerSidebarWidth({ requestedWidth: storedWidth, containerWidth }),
    containerWidth,
    overlay,
    resizeEnabled,
    onResize,
  });
  const dock = (
    <MobilePanelOverlay
      panel="file-explorer"
      closeGesture={gesture}
      presentation={presentation}
      dockVisible={isOpen}
      frameStyle={geometry.frameStyle}
      panelStyle={[{ backgroundColor: surfaceColor }, geometry.panelStyle]}
    >
      <View style={styles.content}>
        {resizeEnabled ? geometry.resizeHandle : null}
        {children}
      </View>
    </MobilePanelOverlay>
  );
  // The dock clips, so the shift wraps it. A flex wrapper would take the whole row; this one
  // shrinks to the dock's width and can paint left over the center column.
  const frame =
    resizeEnabled && geometry.resizeShift && workspaceFill && borderColor && gripColor ? (
      <SidebarResizeShift
        preview={geometry.resizeShift}
        leadingFill={workspaceFill}
        trailingFill={surfaceColor ?? workspaceFill}
        borderColor={borderColor}
        gripColor={gripColor}
        layout="shrink"
      >
        {dock}
      </SidebarResizeShift>
    ) : (
      dock
    );
  return (
    <RetainedPanelActivity active={active}>
      <FileExplorerCloseGestureContext value={gestureRef}>{frame}</FileExplorerCloseGestureContext>
    </RetainedPanelActivity>
  );
}
export const ExplorerFrame = withUnistyles(ExplorerFrameBase, (theme) => ({
  surfaceColor: theme.colors.surfaceSidebar,
  workspaceFill: theme.colors.surfaceWorkspace,
  borderColor: theme.colors.border,
  gripColor: theme.colors.accent,
}));
const styles = StyleSheet.create({ content: { flex: 1, minHeight: 0 } });
