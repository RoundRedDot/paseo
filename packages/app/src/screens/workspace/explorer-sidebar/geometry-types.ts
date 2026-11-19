import type { ComponentProps, ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
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
   * The held drag's edge, for the frame to render beside the dock. The dock clips its panel, so a
   * preview inside it could not cross into the workspace when the drag widens the explorer. Web
   * follows the drag live and has none.
   */
  resizePreview?: ReactNode;
}
