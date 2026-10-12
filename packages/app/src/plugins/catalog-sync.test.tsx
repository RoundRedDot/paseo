/**
 * @vitest-environment jsdom
 */
import appPackage from "../../package.json";
import React from "react";
import { act, cleanup, render } from "@testing-library/react";
import type { DaemonClient } from "@getpaseo/client/internal/daemon-client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { TimelineItemTransform } from "./timeline/model";

const host = vi.hoisted(() => ({ connected: true, supported: true }));
const audio = vi.hoisted(() => ({ play: async () => 0 }));
vi.mock("@/runtime/host-runtime", () => ({
  useHostRuntimeIsConnected: () => host.connected,
}));
vi.mock("@/runtime/host-features", () => ({
  useHostFeature: () => host.supported,
}));
vi.mock("@/contexts/voice-context", () => ({
  useVoiceAudioEngineOptional: () => audio,
}));
vi.mock("./navigation", () => ({
  createPluginNavigation: () => ({}),
}));
vi.mock("./client-runtime", () => ({
  createPluginClientRuntime: () => ({
    paseo: { dispose: async () => {} },
    rpc: async () => undefined,
    openSurface: () => undefined,
    openPanel: () => undefined,
    addComposerPill: () => ({ update() {}, remove() {} }),
    addHeaderButton: () => ({ update() {}, remove() {} }),
  }),
}));

import { PluginCatalogSync } from "./catalog-sync";
import { pluginRegistry } from "./registry";
import { useInstalledTimelineTransform } from "./timeline";

interface Counters {
  __catalogEvaluations?: number;
  __catalogCleanups?: number;
}
const counters = globalThis as Counters;

/** A plugin that draws tool calls in the timeline and counts its evaluations and cleanups. */
function timelineBundle(marker: string): string {
  return `(function() {
    return { default: function(plugin) {
      globalThis.__catalogEvaluations = (globalThis.__catalogEvaluations || 0) + 1;
      plugin.addTimelineTransformer({
        id: "report",
        query: { itemType: "tool_call" },
        transform() { return ${JSON.stringify(marker)} ? { items: [] } : undefined; },
      });
      return function() { globalThis.__catalogCleanups = (globalThis.__catalogCleanups || 0) + 1; };
    } };
  })`;
}

/** A host client whose catalog the test controls and whose event snapshot arrives on subscribe. */
function hostClient(initialBundle: string) {
  let clientBundle = initialBundle;
  const getPluginCatalog = vi.fn(async () => [
    { id: "reports", clientBundle, requirements: { paseo: `>=${appPackage.version}` } },
  ]);
  const client = {
    getPluginCatalog,
    observeEvents: () => ({
      subscribe: (handlers: { snapshot: () => void }) => {
        queueMicrotask(handlers.snapshot);
        return () => undefined;
      },
      release: async () => undefined,
    }),
  } as unknown as DaemonClient;
  return {
    client,
    fetches: () => getPluginCatalog.mock.calls.length,
    publish: (next: string) => {
      clientBundle = next;
    },
  };
}

const transforms: TimelineItemTransform[] = [];
function TransformProbe() {
  transforms.push(useInstalledTimelineTransform("host"));
  return null;
}

function mount(client: DaemonClient) {
  const view = render(
    <>
      <PluginCatalogSync serverId="host" client={client} />
      <TransformProbe />
    </>,
  );
  return {
    ...view,
    set(next: Partial<typeof host>) {
      Object.assign(host, next);
      view.rerender(
        <>
          <PluginCatalogSync serverId="host" client={client} />
          <TransformProbe />
        </>,
      );
    },
  };
}

const installed = () => pluginRegistry.getSnapshot().filter((plugin) => plugin.serverId === "host");
const latestTransform = () => transforms[transforms.length - 1];

beforeEach(() => {
  Object.assign(host, { connected: true, supported: true });
});

afterEach(() => {
  cleanup();
  pluginRegistry.removeHost("host");
  transforms.length = 0;
  delete counters.__catalogEvaluations;
  delete counters.__catalogCleanups;
});

async function connectedWithPlugin(bundle = timelineBundle("one")) {
  const daemon = hostClient(bundle);
  const view = mount(daemon.client);
  await vi.waitFor(() => expect(installed().map((plugin) => plugin.id)).toEqual(["reports"]));
  return { daemon, view };
}

it("keeps installed plugins and their timeline transform while the host is disconnected", async () => {
  const { view } = await connectedWithPlugin();
  const [plugin] = installed();
  const transform = latestTransform();

  act(() => view.set({ connected: false }));

  expect(installed()).toEqual([plugin]);
  expect(plugin?.timelineTransformers.map((transformer) => transformer.id)).toEqual(["report"]);
  expect(plugin?.lifetime.signal.aborted).toBe(false);
  expect(latestTransform()).toBe(transform);
  expect(counters.__catalogCleanups).toBeUndefined();
});

it("reconnecting with an unchanged catalog does not evaluate the bundle again", async () => {
  const { daemon, view } = await connectedWithPlugin();
  const [plugin] = installed();
  const transform = latestTransform();

  act(() => view.set({ connected: false }));
  act(() => view.set({ connected: true }));
  await vi.waitFor(() => expect(daemon.fetches()).toBe(2));
  await act(async () => {});

  expect(installed()).toEqual([plugin]);
  expect(latestTransform()).toBe(transform);
  expect(counters.__catalogEvaluations).toBe(1);
  expect(counters.__catalogCleanups).toBeUndefined();
});

it("reconnecting replaces a plugin whose bundle changed while disconnected", async () => {
  const { daemon, view } = await connectedWithPlugin();
  const [plugin] = installed();

  act(() => view.set({ connected: false }));
  daemon.publish(timelineBundle("two"));
  act(() => view.set({ connected: true }));

  await vi.waitFor(() => expect(installed()[0]).not.toBe(plugin));
  expect(installed().map((next) => next.id)).toEqual(["reports"]);
  expect(plugin?.lifetime.signal.aborted).toBe(true);
  expect(counters.__catalogEvaluations).toBe(2);
  expect(counters.__catalogCleanups).toBe(1);
});

it("removing the host disposes its plugins", async () => {
  const { view } = await connectedWithPlugin();
  const [plugin] = installed();

  view.unmount();

  expect(installed()).toEqual([]);
  expect(plugin?.lifetime.signal.aborted).toBe(true);
  expect(counters.__catalogCleanups).toBe(1);
});

it("a host that stops advertising plugins disposes them", async () => {
  const { view } = await connectedWithPlugin();

  act(() => view.set({ supported: false }));

  expect(installed()).toEqual([]);
  expect(counters.__catalogCleanups).toBe(1);
});
