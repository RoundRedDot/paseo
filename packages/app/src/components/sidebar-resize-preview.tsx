import { createContext, useMemo } from "react";
import { StyleSheet as RNStyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

/**
 * The edge a held sidebar drag moves on the UI thread. On native a drag keeps the committed layout
 * width until it ends: animating the width re-ran Yoga for the sibling column and re-measured its
 * text every frame, and the onLayout bursts that followed committed React work that stalled the
 * gesture. Only this preview's transform and opacity change during the drag.
 */
export interface SidebarResizePreviewValues {
  visible: SharedValue<boolean>;
  /** Horizontal distance from the preview's anchor to the dragged edge. */
  offset: SharedValue<number>;
}

export function useSidebarResizePreviewValues(): SidebarResizePreviewValues {
  const visible = useSharedValue(false);
  const offset = useSharedValue(0);
  return useMemo(() => ({ visible, offset }), [visible, offset]);
}

/**
 * The app sidebar's preview. It lives on the workspace column, not in the sidebar: the dock clips
 * the sidebar and the column draws over it, so a preview inside the sidebar could not pass the
 * committed edge when the drag widens it.
 */
export const AppSidebarResizePreviewContext = createContext<SidebarResizePreviewValues | null>(
  null,
);

interface SidebarResizePreviewProps {
  /** The host edge the preview starts on; `offset` moves it from there. */
  anchor: "left" | "right";
  preview: SidebarResizePreviewValues;
}

export function SidebarResizePreview({ anchor, preview }: SidebarResizePreviewProps) {
  const { offset, visible } = preview;
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: visible.value ? 1 : 0,
    transform: [{ translateX: offset.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        anchor === "left" ? staticStyles.leftAnchor : staticStyles.rightAnchor,
        animatedStyle,
      ]}
    >
      <View style={styles.line} />
      <View style={styles.grip} />
    </Animated.View>
  );
}

const PREVIEW_WIDTH = 12;

// Static styles for the Animated.View: Unistyles and Reanimated must not patch the same node.
const staticStyles = RNStyleSheet.create({
  leftAnchor: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: -PREVIEW_WIDTH / 2,
    width: PREVIEW_WIDTH,
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rightAnchor: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: -PREVIEW_WIDTH / 2,
    width: PREVIEW_WIDTH,
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

const styles = StyleSheet.create((theme) => ({
  line: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: PREVIEW_WIDTH / 2 - 1,
    width: 2,
    backgroundColor: theme.colors.accent,
  },
  grip: {
    width: 4,
    height: 40,
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
  },
}));
