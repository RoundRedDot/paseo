import { z } from "zod";
import { AgentProviderSchema } from "./provider-manifest.js";

/**
 * One-shot provider text generation: one prompt in, one text out, on the daemon that receives
 * the request. Nothing creates an agent, workspace, provider session or Paseo MCP server.
 *
 * The daemon only runs it through a provider route it has preflighted without the prompt. Every
 * refusal says whether the prompt left the daemon: `promptSent: "no"` is only reported for
 * failures that happen before the prompt is transmitted to the provider runtime.
 */

export const PROVIDER_TEXT_GENERATION_ERROR_CODES = [
  /** The provider has no verified one-shot text route in this daemon. */
  "unsupported",
  /** The provider is not registered, disabled, or its runtime could not be reached. */
  "provider_unavailable",
  /** The provider runtime's version is not one this daemon has validated. */
  "version_unsupported",
  /** The provider runtime does not expose the expected one-shot route and payload. */
  "route_unverified",
  /** The provider runtime is configured on a host this capability refuses to send text to. */
  "remote_server_refused",
  /** The request named a different daemon than the one that received it. */
  "server_mismatch",
  /**
   * The daemon cannot show that the provider runtime loads none of the user's plugins, MCP
   * servers or other extensions, so it neither starts nor contacts it for this request.
   */
  "isolation_unverified",
  /** The model is not available in the provider runtime's base configuration. */
  "model_unavailable",
  /** The requested thinking option is not one the model offers. */
  "thinking_option_unavailable",
  "invalid_request",
  "timeout",
  "cancelled",
  /** The provider runtime or model failed after the prompt was sent. */
  "generation_failed",
  /** The model returned no text. */
  "empty_result",
] as const;

export const ProviderTextGenerationErrorCodeSchema = z.enum(PROVIDER_TEXT_GENERATION_ERROR_CODES);

export const ProviderTextGenerationErrorSchema = z.object({
  code: ProviderTextGenerationErrorCodeSchema,
  message: z.string(),
  /** "no" only when the daemon stopped before transmitting the prompt to the provider runtime. */
  promptSent: z.enum(["no", "possibly"]),
  /** Open diagnostic identifier. Unknown reasons leave the code and delivery status intact. */
  reason: z.string().optional(),
});

export const ProviderTextModelSchema = z.object({
  /** Provider model ID, for OpenCode `providerID/modelID`. */
  id: z.string(),
  label: z.string(),
  /** Thinking options accepted verbatim; for OpenCode these are model variants. */
  thinkingOptionIds: z.array(z.string()),
});

/**
 * The providers that have a one-shot route on this daemon, read from its registry without
 * checking, starting or warming any provider runtime. Ask each one's capability next.
 */
export const ProviderTextListRequestMessageSchema = z.object({
  type: z.literal("provider.text.list.request"),
  requestId: z.string(),
});

export const ProviderTextCapabilityGetRequestMessageSchema = z.object({
  type: z.literal("provider.text.get_capability.request"),
  requestId: z.string(),
  provider: AgentProviderSchema,
});

export const ProviderTextGenerateRequestMessageSchema = z.object({
  type: z.literal("provider.text.generate.request"),
  requestId: z.string(),
  provider: AgentProviderSchema,
  /** The daemon the caller means to send the prompt to; any other daemon refuses it. */
  serverId: z.string(),
  model: z.string(),
  /** Passed through exactly. Omit to use the model's default; nothing is substituted. */
  thinkingOptionId: z.string().optional(),
  prompt: z.string(),
  timeoutMs: z.number().int().positive().optional(),
});

export const ProviderTextCancelRequestMessageSchema = z.object({
  type: z.literal("provider.text.cancel.request"),
  requestId: z.string(),
  /** The `requestId` of the generate request to cancel. */
  targetRequestId: z.string(),
});

const ProviderTextListEntrySchema = z.object({ provider: AgentProviderSchema, label: z.string() });

export const ProviderTextListResponseMessageSchema = z.object({
  type: z.literal("provider.text.list.response"),
  payload: z.object({
    requestId: z.string(),
    serverId: z.string().nullable(),
    providers: z.array(ProviderTextListEntrySchema),
    /** Routes blocked by an invalid credential file. These are not selectable providers. */
    credentialIssues: z.array(ProviderTextListEntrySchema).optional(),
  }),
});

export const ProviderTextCapabilityGetResponseMessageSchema = z.object({
  type: z.literal("provider.text.get_capability.response"),
  payload: z.object({
    requestId: z.string(),
    provider: AgentProviderSchema,
    serverId: z.string().nullable(),
    supported: z.boolean(),
    /** Provider runtime version the check ran against. */
    runtimeVersion: z.string().nullable(),
    /** Models the one-shot route can use; empty when unsupported. */
    models: z.array(ProviderTextModelSchema),
    /**
     * What the daemon cannot rule out even when supported, as stable identifiers such as
     * `provider_runtime_builtin_hooks_unobserved`. Callers show these to the user.
     */
    limitations: z.array(z.string()),
    error: ProviderTextGenerationErrorSchema.nullable(),
  }),
});

export const ProviderTextGenerateResponseMessageSchema = z.object({
  type: z.literal("provider.text.generate.response"),
  payload: z.object({
    requestId: z.string(),
    provider: AgentProviderSchema,
    serverId: z.string().nullable(),
    result: z.discriminatedUnion("status", [
      z.object({
        status: z.literal("ok"),
        text: z.string(),
        model: z.string(),
        thinkingOptionId: z.string().nullable(),
        runtimeVersion: z.string(),
      }),
      z.object({
        status: z.literal("error"),
        error: ProviderTextGenerationErrorSchema,
      }),
    ]),
  }),
});

export const ProviderTextCancelResponseMessageSchema = z.object({
  type: z.literal("provider.text.cancel.response"),
  payload: z.object({
    requestId: z.string(),
    targetRequestId: z.string(),
    cancelled: z.boolean(),
  }),
});

export type ProviderTextGenerationErrorCode = z.infer<typeof ProviderTextGenerationErrorCodeSchema>;
export type ProviderTextGenerationError = z.infer<typeof ProviderTextGenerationErrorSchema>;
export type ProviderTextModel = z.infer<typeof ProviderTextModelSchema>;
export type ProviderTextCapabilityGetRequestMessage = z.infer<
  typeof ProviderTextCapabilityGetRequestMessageSchema
>;
export type ProviderTextGenerateRequestMessage = z.infer<
  typeof ProviderTextGenerateRequestMessageSchema
>;
export type ProviderTextListRequestMessage = z.infer<typeof ProviderTextListRequestMessageSchema>;
export type ProviderTextCancelRequestMessage = z.infer<
  typeof ProviderTextCancelRequestMessageSchema
>;
export type ProviderTextCapabilityGetPayload = z.infer<
  typeof ProviderTextCapabilityGetResponseMessageSchema
>["payload"];
export type ProviderTextGeneratePayload = z.infer<
  typeof ProviderTextGenerateResponseMessageSchema
>["payload"];
export type ProviderTextCancelPayload = z.infer<
  typeof ProviderTextCancelResponseMessageSchema
>["payload"];
export type ProviderTextListPayload = z.infer<
  typeof ProviderTextListResponseMessageSchema
>["payload"];
