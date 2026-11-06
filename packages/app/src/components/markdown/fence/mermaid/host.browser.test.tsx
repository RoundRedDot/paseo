import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { userEvent } from "vitest/browser";
import { afterEach, expect, it, vi } from "vitest";
import { MermaidFenceHost } from "./host.web";
import { HighlightedCodeBlock } from "@/components/highlighted-code-block";

const clipboard = vi.hoisted(() => ({ copy: vi.fn(async () => true) }));
vi.mock("expo-clipboard", () => ({ setStringAsync: clipboard.copy }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("./fullscreen-viewer.web", () => ({ MermaidFullscreenViewer: () => null }));

let root: Root;
let container: HTMLDivElement;
const code = "flowchart TD\n A[Start] --> B[Done]\n\n";
const textStyle = { backgroundColor: "#eee", padding: 12, borderRadius: 8 };
const inheritedStyles = { fontSize: 14 };

function mount(content: React.ReactNode, width: number) {
  container = document.createElement("div");
  container.style.width = `${width}px`;
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(content));
}

function button(label: string): HTMLElement {
  const element = container.querySelector(`[aria-label="${label}"]`);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing button: ${label}`);
  return element;
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.clearAllMocks();
});

it.each([320, 900])("keeps source actions separate and usable at %ipx", async (width) => {
  mount(
    <MermaidFenceHost
      code={code}
      phase="complete"
      inheritedStyles={inheritedStyles}
      textStyle={textStyle}
    />,
    width,
  );
  await expect.poll(() => container.querySelector('[data-paseo-markdown-tag="pre"]')).toBeNull();
  await userEvent.hover(container);
  await userEvent.click(button("message.diagram.viewSource"));
  const diagram = button("message.diagram.viewDiagram");
  await userEvent.unhover(container);
  const copy = button("message.actions.copyCode");
  expect(getComputedStyle(copy).opacity).toBe("1");
  expect(getComputedStyle(copy).pointerEvents).not.toBe("none");
  const diagramBox = diagram.getBoundingClientRect();
  const copyBox = copy.getBoundingClientRect();
  expect(diagramBox.width).toBeGreaterThan(0);
  expect(copyBox.width).toBeGreaterThan(0);
  expect(diagramBox.right).toBeLessThanOrEqual(copyBox.left);
  expect(diagramBox.top).toBe(copyBox.top);
  expect(copyBox.right).toBeLessThanOrEqual(container.getBoundingClientRect().right);

  await userEvent.click(copy);
  expect(clipboard.copy).toHaveBeenCalledWith(code.trimEnd());
  expect(button("message.actions.copied")).toBeTruthy();
  await userEvent.click(diagram);
  expect(container.querySelector('[aria-label="message.diagram.viewDiagram"]')).toBeNull();
  expect(container.textContent).not.toContain("flowchart TD");
});

it("keeps a single copy action for ordinary code blocks", async () => {
  mount(
    <HighlightedCodeBlock
      code={code}
      language="text"
      inheritedStyles={inheritedStyles}
      textStyle={textStyle}
    />,
    320,
  );
  expect(getComputedStyle(button("message.actions.copyCode")).opacity).toBe("0");
  await userEvent.hover(container);
  await userEvent.click(button("message.actions.copyCode"));
  expect(clipboard.copy).toHaveBeenCalledWith(code.trimEnd());
  expect(container.querySelectorAll('[role="button"]')).toHaveLength(1);
});
