/**
 * @vitest-environment jsdom
 */
import React, { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Animated } from "react-native";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createListenerSet,
  StickyInsetContext,
  StickyViewportContext,
  type StickyGeometry,
  type StickyViewport,
} from "./context";
import type { StickyOrientation } from "./model";
import { TimelineStickyScope, useTimelineStickyHeader } from "./scope";

type Translate = Animated.AnimatedInterpolation<number> | null;

// Animated nodes only expose their value to listeners once a view is attached; the
// synchronous getter is enough to check the composed expression.
function readValue(node: Animated.AnimatedInterpolation<number>): number {
  const readable: unknown = node;
  if (
    typeof readable !== "object" ||
    readable === null ||
    !("__getValue" in readable) ||
    typeof readable.__getValue !== "function"
  ) {
    throw new Error("Animated node has no synchronous value");
  }
  const value: unknown = readable.__getValue();
  if (typeof value !== "number") {
    throw new Error("Animated node value is not a number");
  }
  return value;
}

function createViewport(orientation: StickyOrientation, geometry: StickyGeometry) {
  const listeners = createListenerSet();
  const measure = vi.fn<StickyViewport["measure"]>((_target, _cell, onMeasured) =>
    onMeasured(geometry),
  );
  const viewport: StickyViewport = {
    orientation,
    scrollOffset: new Animated.Value(0),
    measure,
    subscribe: listeners.subscribe,
  };
  return { viewport, measure, notify: listeners.notify };
}

describe("useTimelineStickyHeader", () => {
  let container: HTMLDivElement;
  let root: Root;
  let latest: Translate = null;

  function Header({ enabled }: { enabled: boolean }) {
    latest = useTimelineStickyHeader({ headerHeight: 40, enabled });
    return null;
  }

  function render(node: ReactNode) {
    act(() => root.render(node));
  }

  beforeEach(() => {
    vi.stubGlobal("React", React);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    latest = null;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("is unavailable outside an agent timeline", () => {
    render(
      <TimelineStickyScope>
        <Header enabled />
      </TimelineStickyScope>,
    );
    expect(latest).toBeNull();
  });

  it("stays at zero and measures nothing while the header is disabled", () => {
    const { viewport, measure } = createViewport("forward", { base: -500, height: 1000 });
    render(
      <StickyViewportContext.Provider value={viewport}>
        <TimelineStickyScope>
          <Header enabled={false} />
        </TimelineStickyScope>
      </StickyViewportContext.Provider>,
    );
    viewport.scrollOffset.setValue(700);
    expect(readValue(latest!)).toBe(0);
    expect(measure).not.toHaveBeenCalled();
  });

  it("keeps one value across enabling and disabling", () => {
    const { viewport } = createViewport("forward", { base: -500, height: 1000 });
    function renderHeader(enabled: boolean) {
      render(
        <StickyViewportContext.Provider value={viewport}>
          <TimelineStickyScope>
            <Header enabled={enabled} />
          </TimelineStickyScope>
        </StickyViewportContext.Provider>,
      );
    }
    viewport.scrollOffset.setValue(700);
    renderHeader(true);
    const translate = latest!;
    expect(readValue(translate)).toBe(200);
    renderHeader(false);
    expect(latest).toBe(translate);
    expect(readValue(translate)).toBe(0);
  });

  it("follows a forward scroll offset within the card", () => {
    const { viewport } = createViewport("forward", { base: -500, height: 1000 });
    render(
      <StickyViewportContext.Provider value={viewport}>
        <TimelineStickyScope>
          <Header enabled />
        </TimelineStickyScope>
      </StickyViewportContext.Provider>,
    );
    const translate = latest!;

    viewport.scrollOffset.setValue(300);
    expect(readValue(translate)).toBe(0);
    viewport.scrollOffset.setValue(700);
    expect(readValue(translate)).toBe(200);
    viewport.scrollOffset.setValue(5000);
    expect(readValue(translate)).toBe(960);
  });

  it("follows an inverted scroll offset and starts below the prompt bar", () => {
    const { viewport } = createViewport("inverted", { base: 2350, height: 1000 });
    const stickyInset = new Animated.Value(0);
    const stickyClearance = stickyInset.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
    render(
      <StickyViewportContext.Provider value={viewport}>
        <StickyInsetContext.Provider value={stickyClearance}>
          <TimelineStickyScope>
            <Header enabled />
          </TimelineStickyScope>
        </StickyInsetContext.Provider>
      </StickyViewportContext.Provider>,
    );
    const translate = latest!;

    viewport.scrollOffset.setValue(2250);
    expect(readValue(translate)).toBe(100);
    stickyInset.setValue(36);
    expect(readValue(translate)).toBe(136);
  });

  it("re-measures when the viewport reports moved rows", () => {
    const { viewport, measure, notify } = createViewport("forward", { base: 0, height: 100 });
    render(
      <StickyViewportContext.Provider value={viewport}>
        <TimelineStickyScope>
          <Header enabled />
        </TimelineStickyScope>
      </StickyViewportContext.Provider>,
    );
    const calls = measure.mock.calls.length;
    act(() => notify());
    expect(measure.mock.calls.length).toBe(calls + 1);
  });
});
