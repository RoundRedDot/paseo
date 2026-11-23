import type { ComponentProps, ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type { SidebarResizePreviewValues } from "@/components/sidebar-resize-preview";
import type { MobilePanelOverlay } from "@/mobile-panels/presentation";
export interface ExplorerGeometryInput {
  width: number;
  containerWidth: number;
  overlay: boolean;
  resizeEnabled: boolean;
  onResize: (width: number) => void;
}
export interface ExplorerGeometry {
  frameStyle: ComponentProps<typeof MobilePanelOverlay>["frameStyle"];
  panelStyle: StyleProp<ViewStyle>;
  resizeHandle: ReactNode;
  /**
   * Native held drag. The frame shifts the dock with these values. The dock clips its own panel,
   * so the shift wraps the dock and can cross into the workspace. Web follows the drag live and
   * leaves this unset.
   */
  resizeShift?: SidebarResizePreviewValues | null;
}
