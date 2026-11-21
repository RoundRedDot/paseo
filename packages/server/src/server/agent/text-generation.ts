import type { ProviderTextGenerationErrorCode } from "@getpaseo/protocol/messages";

/**
 * One-shot text generation through a provider runtime: one prompt, one text, no agent, session,
 * workspace or Paseo tool. A provider implements it only for a runtime route it can preflight
 * without the prompt; see `providers/opencode/v2/text-generation.ts`.
 */
export interface TextGenerationModel {
  id: string;
  label: string;
  thinkingOptionIds: string[];
}

export interface TextGenerationCapability {
  runtimeVersion: string;
  models: TextGenerationModel[];
  /** Stable identifiers for what the provider cannot rule out; callers disclose them. */
  limitations: string[];
}

export interface TextGenerationRequest {
  model: string;
  thinkingOptionId?: string;
  prompt: string;
  /** Aborts on cancel, deadline or session close. */
  signal: AbortSignal;
}

export interface TextGenerationResult {
  text: string;
  model: string;
  thinkingOptionId: string | null;
  runtimeVersion: string;
}

export interface AgentTextGeneration {
  getCapability(options: { signal: AbortSignal }): Promise<TextGenerationCapability>;
  generate(request: TextGenerationRequest): Promise<TextGenerationResult>;
}

export type PromptDelivery = "no" | "possibly";

/** Every failure says whether the prompt may have left the daemon. */
export class TextGenerationError extends Error {
  constructor(
    readonly code: ProviderTextGenerationErrorCode,
    message: string,
    readonly promptSent: PromptDelivery,
  ) {
    super(message);
    this.name = "TextGenerationError";
  }
}
