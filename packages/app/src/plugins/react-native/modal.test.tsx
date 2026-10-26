import React from "react";
import Module from "node:module";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { Modal } from "./modal";

vi.mock("@/contexts/toast-api-context", () => ({
  useToast: () => ({}),
  ToastApiProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@getpaseo/plugin/client/host", () => ({
  usePluginRuntimeContextBridge: () => (children: React.ReactNode) => children,
}));

afterEach(() => vi.restoreAllMocks());

const actions = <button type="button">Clear all</button>;

it.each([
  { headerActions: actions, expected: '<button type="button">Clear all</button>' },
  { headerActions: undefined, expected: "" },
])(
  "renders optional header actions separately from the body: $expected",
  ({ headerActions, expected }) => {
    const loader = Module as unknown as { _load(id: string, ...args: unknown[]): unknown };
    const load = loader._load;
    vi.spyOn(loader, "_load").mockImplementation((id, ...args) =>
      id === "../../components/adaptive-modal-sheet"
        ? {
            AdaptiveModalSheet: ({
              header,
              children,
            }: {
              header: { title: string; actions?: React.ReactNode };
              children: React.ReactNode;
            }) => (
              <section>
                <header>
                  {header.title}
                  {header.actions}
                </header>
                <main>{children}</main>
              </section>
            ),
          }
        : load(id, ...args),
    );
    const onOpenChange = vi.fn();
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <Modal title="Filters" headerActions={headerActions} open onOpenChange={onOpenChange}>
          <Modal.Content>Filter options</Modal.Content>
        </Modal>
      </QueryClientProvider>,
    );
    expect(markup).toBe(
      `<section><header>Filters${expected}</header><main>Filter options</main></section>`,
    );
  },
);
