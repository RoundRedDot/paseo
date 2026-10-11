import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Animated, View } from "react-native";
import type { TimelineStickyHeaderOptions } from "@getpaseo/plugin/client/react-native";
import { isNative } from "@/constants/platform";
import { useStableEvent } from "@/hooks/use-stable-event";
import {
  StickyCellContext,
  StickyInsetContext,
  StickyViewportContext,
  type StickyViewport,
} from "./context";
import { stickyScrollDirection } from "./model";

interface StickyItem {
  hiddenTop: Animated.AnimatedAddition<number>;
  contentHeight: Animated.Value;
  register: () => () => void;
}

const StickyItemContext = createContext<StickyItem | null>(null);

/**
 * Makes the row it wraps a range that a header inside can stick within. Outside a
 * transcript viewport it renders its children unchanged.
 */
// Under Fabric a natively driven graph reaches the view only when an animation or event
// drives it: setValue, or swapping in a rebuilt graph, leaves a header stale until the next
// scroll. Geometry therefore lives in values the graph reads, and a zero-length animation
// applies each change at once. The renderer never re-renders for layout.
function applyNow(value: Animated.Value, toValue: number) {
  Animated.timing(value, { toValue, duration: 0, useNativeDriver: isNative }).start();
}

export function TimelineStickyScope({ children }: { children: ReactNode }) {
  const viewport = useContext(StickyViewportContext);
  if (!viewport) {
    return children;
  }
  return <MeasuredStickyScope viewport={viewport}>{children}</MeasuredStickyScope>;
}

function MeasuredStickyScope({
  viewport,
  children,
}: {
  viewport: StickyViewport;
  children: ReactNode;
}) {
  const cell = useContext(StickyCellContext);
  const stickyInset = useContext(StickyInsetContext);
  const nodeRef = useRef<View>(null);
  const [base] = useState(() => new Animated.Value(0));
  const [contentHeight] = useState(() => new Animated.Value(0));
  // Measuring costs a native round trip per layout, so rows measure only while a header
  // inside them is enabled.
  const [consumerCount, setConsumerCount] = useState(0);

  const hiddenTop = useMemo(() => {
    const scrolled = Animated.add(
      Animated.multiply(viewport.scrollOffset, stickyScrollDirection(viewport.orientation)),
      base,
    );
    return stickyInset ? Animated.add(scrolled, stickyInset) : scrolled;
  }, [base, stickyInset, viewport]);

  const measure = useStableEvent(() => {
    const node = nodeRef.current;
    if (!node || consumerCount === 0) {
      return;
    }
    viewport.measure(node, cell, (geometry) => {
      applyNow(base, geometry.base);
      applyNow(contentHeight, geometry.height);
    });
  });

  useEffect(() => {
    if (consumerCount === 0) {
      return;
    }
    measure();
    const unsubscribeViewport = viewport.subscribe(measure);
    const unsubscribeCell = cell?.subscribe(measure);
    return () => {
      unsubscribeViewport();
      unsubscribeCell?.();
    };
  }, [cell, consumerCount, measure, viewport]);

  const register = useCallback(() => {
    setConsumerCount((count) => count + 1);
    return () => setConsumerCount((count) => count - 1);
  }, []);
  const item = useMemo(
    () => ({ hiddenTop, contentHeight, register }),
    [contentHeight, hiddenTop, register],
  );

  return (
    <StickyItemContext.Provider value={item}>
      <View ref={nodeRef} collapsable={false} onLayout={measure}>
        {children}
      </View>
    </StickyItemContext.Provider>
  );
}

// max(x, 0). Animated has no min or max, but a clamped interpolation is one.
const NOT_BELOW_ZERO: Animated.InterpolationConfigType = {
  inputRange: [0, 1],
  outputRange: [0, 1],
  extrapolateLeft: "clamp",
  extrapolateRight: "extend",
};
const IDENTITY: Animated.InterpolationConfigType = { inputRange: [0, 1], outputRange: [0, 1] };

/** The plugin SDK's `useTimelineStickyHeader`. See public-docs/plugins/reference.md. */
export function useTimelineStickyHeader({
  headerHeight,
  enabled,
}: TimelineStickyHeaderOptions): Animated.AnimatedInterpolation<number> | null {
  const item = useContext(StickyItemContext);
  const register = item?.register;
  const hiddenTop = item?.hiddenTop;
  const contentHeight = item?.contentHeight;
  // Disabling scales the same graph to zero instead of returning a different value: a
  // native-driven view whose animated transform is swapped for a static one keeps its last
  // animated position under Fabric.
  const [enabledFactor] = useState(() => new Animated.Value(enabled ? 1 : 0));

  useEffect(() => (enabled && register ? register() : undefined), [enabled, register]);
  useEffect(() => applyNow(enabledFactor, enabled ? 1 : 0), [enabled, enabledFactor]);

  // clampStickyTranslate in model.ts, as a graph: min(max(hiddenTop, 0), travel), with
  // min(a, b) = b - max(b - a, 0).
  return useMemo(() => {
    if (!hiddenTop || !contentHeight) {
      return null;
    }
    const travel = Animated.add(contentHeight, -headerHeight).interpolate(NOT_BELOW_ZERO);
    const followed = hiddenTop.interpolate(NOT_BELOW_ZERO);
    const clamped = Animated.subtract(
      travel,
      Animated.subtract(travel, followed).interpolate(NOT_BELOW_ZERO),
    );
    return Animated.multiply(clamped, enabledFactor).interpolate(IDENTITY);
  }, [contentHeight, enabledFactor, headerHeight, hiddenTop]);
}
