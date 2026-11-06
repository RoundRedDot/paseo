import React from "react";
import { View } from "react-native";
import { Scan, ZoomIn, ZoomOut } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";
import { PreviewToolbarButton } from "@/components/ui/preview-toolbar-button";
import type { ZoomableViewportAction } from "./types";

interface ViewportToolbarProps {
  actions: ZoomableViewportAction[];
  maxScale: number;
  minScale: number;
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  scale: number;
  visible: boolean;
}

interface ResolvedViewportAction extends ZoomableViewportAction {
  disabled: boolean;
}

export const ViewportToolbar = React.memo(function ViewportToolbar({
  actions,
  maxScale,
  minScale,
  onReset,
  onZoomIn,
  onZoomOut,
  scale,
  visible,
}: ViewportToolbarProps) {
  const { t } = useTranslation();
  const viewportActions: ResolvedViewportAction[] = [
    {
      icon: ZoomIn,
      label: t("message.diagram.zoomIn"),
      onPress: onZoomIn,
      disabled: scale >= maxScale,
    },
    {
      icon: ZoomOut,
      label: t("message.diagram.zoomOut"),
      onPress: onZoomOut,
      disabled: scale <= minScale,
    },
    {
      icon: Scan,
      label: t("message.diagram.resetZoom"),
      onPress: onReset,
      disabled: scale === 1,
    },
    ...actions.map((action) => ({ ...action, disabled: false })),
  ];

  return (
    <View style={styles.cluster} testID="zoomable-viewport-toolbar">
      {viewportActions.map((action) => (
        <PreviewToolbarButton
          key={action.label}
          icon={action.icon}
          label={action.label}
          onPress={action.onPress}
          testID={action.testID}
          disabled={action.disabled}
          visible={visible}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create((theme) => ({
  cluster: {
    position: "absolute",
    top: theme.spacing[2],
    right: theme.spacing[2],
    zIndex: 1,
    flexDirection: "row",
    gap: theme.spacing[1],
    pointerEvents: "box-none",
  },
}));
