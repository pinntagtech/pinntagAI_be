// ─────────────────────────────────────────────────────────────────────────────
//  agentRuntime.ts — business-agent execution on the Responses API
//
//  Replaces the OpenAI Assistants/Threads API, which was sunset (the endpoints
//  now return a bodyless 404). Everything that used to be a server-side
//  Assistant object plus a Thread plus a Run is collapsed into a single
//  `openai.responses.create()` call here.
//
//  The mapping, for anyone reading the old code alongside this:
//
//    assistants.create/update  → nothing remote. Instructions live in Mongo on
//                                the BusinessAIAssistant doc and are sent per
//                                request. `assistantId` is now a LOCAL id.
//    threads.create            → nothing. Each generation is one stateless call.
//    threads.messages.create   → the `input` argument.
//    threads.runs.create       → the same `responses.create()` call.
//    pollRunUntilComplete      → gone. Non-streaming responses come back done.
//    threads.messages.list     → `response.output_text`.
//    submitToolOutputs         → `function_call_output` items, looped below.
//    tool_resources.file_search→ an inline `file_search` tool with the store id.
//
//  Vector stores were NOT part of the sunset — they were promoted out of beta
//  and still back file_search. Existing `vectorStoreId` values keep working.
// ─────────────────────────────────────────────────────────────────────────────

import { openai } from "./openai.js";
import type {
  Response as OpenAIResponse,
  ResponseInput,
  Tool,
} from "openai/resources/responses/responses";
import { logger } from "./logger.js";

/**
 * Model used for business-agent generation. Matches the model the Assistants
 * objects were created with, so output quality is unchanged by this migration.
 */
export const AGENT_MODEL = "gpt-4o";

/** Max function-call round trips before we give up, mirroring the old run poll cap. */
const MAX_TOOL_ITERATIONS = 10;

/**
 * Shared topic restriction. Previously baked into every Assistant's stored
 * instructions; now appended when we build instructions locally.
 */
export const ASSISTANT_INSTRUCTIONS = `
You are the AI for the PinnTag Business app. You MUST restrict all discussions to app-relevant topics:
- Creating/managing offers, events, promotions
- Business onboarding, locations, schedules, pricing in-app
- App how-to, account/billing (PinnTag), analytics, notifications
- Integrations specifically related to PinnTag (Stripe/IAP status, etc.)

Hard refusals (do NOT answer; give a short refusal + suggest an allowed topic):
- Politics, news, elections, government policy
- Religion, ideology debates, adult content
- Personal legal/medical/financial advice unrelated to app usage
- Anything not directly about PinnTag or the business's use of it

Refusal style:
- 1 concise sentence: "I can't help with that here. I can help you with [allowed areas]."
- Never provide partial answers to disallowed topics.
`;

/** The subset of a BusinessAIAssistant doc needed to rebuild instructions. */
export interface AgentInstructionSource {
  businessName?: string;
  name?: string;
  description?: string;
  tags?: string[];
  category?: string;
  subCategories?: string[];
  tone?: unknown;
  instructions?: string;
}

export interface AgentUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AgentRunResult {
  text: string;
  usage: AgentUsage;
  responseId: string;
}

/**
 * Builds the canonical agent instruction block.
 *
 * This is the single source of truth. It previously existed as two near-identical
 * inline arrays in ai.service.ts (one in create, one in update), which meant a
 * business's instructions could drift depending on which path last touched it.
 */
export function buildAgentInstructions(agent: AgentInstructionSource): string {
  const displayName = agent.name || agent.businessName || "this business";
  return [
    `You are the AI agent for ${agent.businessName || displayName}.`,
    `Your knowledge is based on the following information about the business:`,
    `Name: ${displayName}`,
    `Description: ${agent.description ?? "Not provided"}`,
    `Tags: ${agent.tags?.join(", ") || "Not provided"}`,
    `Category: ${agent.category ?? "Not provided"}`,
    `Subcategories: ${agent.subCategories?.join(", ") || "Not provided"}`,
    `Primary goal: help the business engage customers with relevant events/offers and fast answers.`,
    `Tone: ${(agent.tone as string) ?? "professional, warm, succinct"}.`,
    `If you don't know, say so briefly and ask for missing info.`,
    `Use the provided tools to fetch live data from the business backend when relevant.`,
    ASSISTANT_INSTRUCTIONS,
  ].join("\n");
}

/**
 * Instructions to send for a given agent.
 *
 * Under the Assistants API the instructions lived remotely, and `createBusinessAgent`
 * never wrote them to Mongo — only `updateAgent` and the training flows did. So
 * agents created but never updated or trained have an empty `instructions` field.
 * For those we rebuild from the stored business fields rather than sending an
 * empty system prompt, which is what makes this migration safe without a backfill.
 */
export function resolveAgentInstructions(agent: AgentInstructionSource): string {
  const stored = agent.instructions?.trim();
  if (stored) return stored;
  return buildAgentInstructions(agent);
}

/**
 * Generates a local stand-in for the old OpenAI assistant id.
 *
 * `assistantId` is still required by the schema and is used across the codebase
 * as the "this business has an agent" gate, so we keep populating it. It is no
 * longer a remote handle — nothing dereferences it against OpenAI any more.
 */
export function localAssistantId(businessId: string): string {
  return `local_${businessId}`;
}

/** True for ids minted by this service rather than by the old Assistants API. */
export function isLocalAssistantId(assistantId?: string): boolean {
  return !!assistantId?.startsWith("local_");
}

function normalizeUsage(response: OpenAIResponse): AgentUsage {
  return {
    promptTokens: response.usage?.input_tokens ?? 0,
    completionTokens: response.usage?.output_tokens ?? 0,
    totalTokens: response.usage?.total_tokens ?? 0,
  };
}

export interface RunAgentPromptParams {
  /** Fully-resolved system instructions (see resolveAgentInstructions). */
  instructions: string;
  /** The user prompt. */
  input: string;
  /** Attaches file_search over this store when present. */
  vectorStoreId?: string;
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
  /** Function tools the model may call. */
  tools?: Tool[];
  /** Executes a function tool call and returns the JSON string result. */
  onToolCall?: (toolCall: {
    name: string;
    arguments: string;
    call_id: string;
  }) => Promise<string>;
}

/**
 * Runs one prompt against a business agent and returns the text plus usage.
 *
 * Replaces the create-thread → add-message → create-run → poll → list-messages
 * sequence that appeared in five places across the services. Non-streaming
 * responses arrive already complete, so there is no polling loop here — the
 * only loop is for function-tool round trips.
 */
export async function runAgentPrompt(
  params: RunAgentPromptParams,
): Promise<AgentRunResult> {
  const {
    instructions,
    input,
    vectorStoreId,
    model = AGENT_MODEL,
    maxOutputTokens,
    temperature,
    tools = [],
    onToolCall,
  } = params;

  const resolvedTools: Tool[] = [...tools];
  if (vectorStoreId) {
    resolvedTools.push({
      type: "file_search",
      vector_store_ids: [vectorStoreId],
    });
  }

  let conversation: ResponseInput = [{ role: "user", content: input }];

  // Usage accumulates across tool round trips so callers bill for the whole
  // exchange, not just the final leg.
  const total: AgentUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const response = await openai.responses.create({
      model,
      instructions,
      input: conversation,
      ...(resolvedTools.length > 0 ? { tools: resolvedTools } : {}),
      ...(maxOutputTokens !== undefined
        ? { max_output_tokens: maxOutputTokens }
        : {}),
      ...(temperature !== undefined ? { temperature } : {}),
    });

    const usage = normalizeUsage(response);
    total.promptTokens += usage.promptTokens;
    total.completionTokens += usage.completionTokens;
    total.totalTokens += usage.totalTokens;

    const functionCalls = response.output.filter(
      (item): item is Extract<typeof item, { type: "function_call" }> =>
        item.type === "function_call",
    );

    if (functionCalls.length === 0 || !onToolCall) {
      return {
        text: response.output_text ?? "",
        usage: total,
        responseId: response.id,
      };
    }

    // Feed each call's result back as a function_call_output item, which is the
    // Responses-API equivalent of runs.submitToolOutputs.
    conversation = [...conversation, ...functionCalls];
    for (const call of functionCalls) {
      const output = await onToolCall({
        name: call.name,
        arguments: call.arguments,
        call_id: call.call_id,
      });
      conversation.push({
        type: "function_call_output",
        call_id: call.call_id,
        output,
      });
    }
  }

  logger.error(
    { maxIterations: MAX_TOOL_ITERATIONS },
    "Agent run exceeded max tool iterations",
  );
  throw new Error(
    `Agent run did not settle within ${MAX_TOOL_ITERATIONS} tool iterations`,
  );
}
