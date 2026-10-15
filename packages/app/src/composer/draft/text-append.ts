import type { MessageInputRef } from "../input/input";

type AppendText = (text: string) => boolean;

// The mounted input owns publication, native text replacement and focus.
const appenders = new Map<string, AppendText>();

export function registerDraftTextAppender(draftKey: string, append: AppendText): () => void {
  appenders.set(draftKey, append);
  return () => {
    if (appenders.get(draftKey) === append) appenders.delete(draftKey);
  };
}

export function appendToDraft(draftKey: string, text: string): boolean {
  const append = appenders.get(draftKey);
  if (!append || !text) return false;
  return append(text);
}

export function appendDraftSnippet(before: string, snippet: string): string {
  if (!before || before.endsWith("\n\n")) return before + snippet;
  const lead = before.endsWith("\n") ? "\n" : "\n\n";
  return before + lead + snippet;
}

export function bindDraftTextAppender(
  draftKey: string,
  readInput: () => Pick<MessageInputRef, "getText" | "replaceText"> | null,
  focus: () => void,
): () => void {
  return registerDraftTextAppender(draftKey, (snippet) => {
    const input = readInput();
    if (!input) return false;
    // Read the live input, including edits not yet published to the draft store.
    input.replaceText(appendDraftSnippet(input.getText(), snippet));
    focus();
    return true;
  });
}
