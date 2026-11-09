import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { StyleSheet as RNStyleSheet, View } from "react-native";
import { isNative } from "@/constants/platform";
import { StyleSheet } from "react-native-unistyles";
import { sidebarResizePreviewOpacity, sidebarResizePreviewX } from "@/utils/sidebar-resize-preview";

/**
 * The only thing that moves while a sidebar divider is dragged: a 2 px line at the width the
 * gesture would commit. Kept out of the sidebar's own tree because it has to be visible past the
 * sidebar's current edge, and kept to transform and opacity so no layout runs per frame.
 */
export function SidebarResizePreview({ insetLeft = 0 }: { insetLeft?: number }) {
  const previewStyle = useAnimatedStyle(() => ({
    opacity: sidebarResizePreviewOpacity.value,
    transform: [{ translateX: sidebarResizePreviewX.value - 1 }],
  }));
  // Pointer layouts keep the live width animation, so there is nothing to preview there.
  if (!isNative) return null;
  return (
    <Animated.View
      pointerEvents="none"
      testID="sidebar-resize-preview"
      // Absolute children are offset from the parent's border box, not its padding, and the row
      // pads by the safe-area inset that the sidebar itself starts after.
      style={[staticStyles.frame, { left: insetLeft }, previewStyle]}
    >
      <View style={styles.line} />
    </Animated.View>
  );
}

// The animated node carries only a React Native static style: Unistyles and Reanimated patching the
// same Fabric node is the combination docs/unistyles.md rules out.
const staticStyles = RNStyleSheet.create({
  frame: {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    left: 0,
    width: 2,
    zIndex: 20,
  },
});

const styles = StyleSheet.create((theme) => ({
  line: {
    flex: 1,
    backgroundColor: theme.colors.accent,
  },
}));
