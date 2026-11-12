import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet as RNStyleSheet, View } from "react-native";
import { GestureDetector, type GestureType } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import {
  resolveSidebarResizeHandleGeometry,
  type SidebarResizeEdge,
} from "@/components/sidebar-resize-handle-layout";
import { isWeb } from "@/constants/platform";
import { useHasFinePointer } from "@/hooks/use-fine-pointer";

interface SidebarResizeHandleProps {
  edge: SidebarResizeEdge;
  gesture: GestureType;
  /** Written by the gesture on the UI thread; drives the touch grip without a React render. */
  pressed: SharedValue<boolean>;
  testID: string;
  prominent?: boolean;
}

const HIGHLIGHT_DELAY_MS = 100;

const webResizeCursorStyle = isWeb
  ? ({
      cursor: "col-resize",
    } as object)
  : null;

function edgeOffsetStyle(edge: SidebarResizeEdge, edgeOffset: number) {
  return edge === "left" ? { left: edgeOffset } : { right: edgeOffset };
}

export function SidebarResizeHandle({
  edge,
  gesture,
  pressed,
  testID,
  prominent,
}: SidebarResizeHandleProps) {
  const finePointer = useHasFinePointer();

  if (finePointer) {
    return <PointerResizeHandle edge={edge} gesture={gesture} pressed={pressed} testID={testID} />;
  }
  return (
    <TouchResizeHandle
      edge={edge}
      gesture={gesture}
      pressed={pressed}
      testID={testID}
      prominent={prominent}
    />
  );
}

function PointerResizeHandle({ edge, gesture, testID }: SidebarResizeHandleProps) {
  const [highlighted, setHighlighted] = useState(false);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geometry = resolveSidebarResizeHandleGeometry(true);
  const hitAreaStyle = [
    styles.hitArea,
    { width: geometry.width },
    edgeOffsetStyle(edge, geometry.edgeOffset),
    webResizeCursorStyle,
  ];

  const cancelHighlightTimer = useCallback(() => {
    if (highlightTimerRef.current === null) return;
    clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = null;
  }, []);

  const handleHoverIn = useCallback(() => {
    cancelHighlightTimer();
    highlightTimerRef.current = setTimeout(() => {
      highlightTimerRef.current = null;
      setHighlighted(true);
    }, HIGHLIGHT_DELAY_MS);
  }, [cancelHighlightTimer]);

  const handleHoverOut = useCallback(() => {
    cancelHighlightTimer();
    setHighlighted(false);
  }, [cancelHighlightTimer]);

  useEffect(() => cancelHighlightTimer, [cancelHighlightTimer]);

  return (
    <GestureDetector gesture={gesture}>
      <Pressable
        testID={testID}
        style={hitAreaStyle}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
      >
        {highlighted ? (
          <View pointerEvents="none" testID={`${testID}-highlight`} style={styles.highlight} />
        ) : null}
      </Pressable>
    </GestureDetector>
  );
}

function TouchResizeHandle({
  edge,
  gesture,
  pressed,
  testID,
  prominent,
}: SidebarResizeHandleProps) {
  const geometry = resolveSidebarResizeHandleGeometry(false);
  // `box-none` keeps the full-height column out of hit-testing so only the
  // grab target steals taps from the rows behind it.
  const layerStyle = [
    styles.touchLayer,
    { width: geometry.width },
    edgeOffsetStyle(edge, geometry.edgeOffset),
  ];
  const targetStyle = [
    styles.touchTarget,
    { width: geometry.width, height: geometry.height ?? undefined },
  ];
  const plainOpacityStyle = useAnimatedStyle(() => ({
    opacity: pressed.value ? GRIP_PRESSED_OPACITY : GRIP_IDLE_OPACITY,
  }));
  const prominentIdleOpacityStyle = useAnimatedStyle(() => ({
    opacity: pressed.value ? 0 : 1,
  }));
  const prominentPressedOpacityStyle = useAnimatedStyle(() => ({
    opacity: pressed.value ? 1 : 0,
  }));
  const gripLayerStyle =
    edge === "left" ? staticStyles.leftEdgeGripLayer : staticStyles.rightEdgeGripLayer;
  const grip = prominent ? (
    <View pointerEvents="none" style={gripLayerStyle}>
      <Animated.View style={prominentIdleOpacityStyle}>
        <View testID={`${testID}-grip`} style={styles.prominentIdleGrip} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[staticStyles.prominentPressedOverlay, prominentPressedOpacityStyle]}
      >
        <View style={styles.prominentPressedGrip} />
      </Animated.View>
    </View>
  ) : (
    <Animated.View pointerEvents="none" style={[gripLayerStyle, plainOpacityStyle]}>
      <View testID={`${testID}-grip`} style={styles.grip} />
    </Animated.View>
  );

  return (
    <View pointerEvents="box-none" style={layerStyle}>
      <GestureDetector gesture={gesture}>
        <View
          testID={testID}
          role="separator"
          aria-orientation="vertical"
          collapsable={false}
          style={targetStyle}
        >
          {grip}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  hitArea: {
    position: "absolute",
    top: 0,
    bottom: 0,
    zIndex: 10,
  },
  highlight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 5,
    width: 1,
    backgroundColor: theme.colors.foreground,
    opacity: 0.25,
  },
  touchLayer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  touchTarget: {
    alignItems: "center",
    justifyContent: "center",
  },
  grip: {
    width: 4,
    height: 36,
    borderRadius: 2,
    backgroundColor: theme.colors.foreground,
  },
  prominentIdleGrip: {
    width: 4,
    height: 40,
    borderRadius: 2,
    backgroundColor: theme.colors.foregroundMuted,
    opacity: 0.5,
  },
  prominentPressedGrip: {
    width: 4,
    height: 40,
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
  },
}));

const GRIP_IDLE_OPACITY = 0.15;
const GRIP_PRESSED_OPACITY = 0.3;

// Static styles for the Animated.View: Unistyles and Reanimated must not patch the same node.
// The 2pt margin matches theme.spacing[0.5].
const staticStyles = RNStyleSheet.create({
  leftEdgeGripLayer: { alignSelf: "flex-start", marginLeft: 2 },
  rightEdgeGripLayer: { alignSelf: "flex-end", marginRight: 2 },
  prominentPressedOverlay: { position: "absolute", top: 0, left: 0 },
});
