// ─────────────────────────────────────────────────────────────────────────────
//  llm.ts — text LLM facade
//
//  Single switch point for which LLM serves text completions. Mirrors the
//  IMAGE_GENERATION_PROVIDER pattern from imageGeneration.service.ts, but for
//  text. The goal of Phase 0 of the local-LLM migration: make the codebase
//  model-agnostic WITHOUT changing any behavior.
//
//  Why this exists:
//    Today every service calls `openai.chat.completions.create(...)` directly,
//    tying us to OpenAI. When we stand up a self-hosted vLLM endpoint (which is
//    OpenAI-API-compatible), we want the switch to be a single env var, not a
//    code change in 11 files.
//
//  How it works:
//    • LLM_PROVIDER selects the primary client ("openai" | "local").
//    • Both clients are just the OpenAI SDK pointed at different base URLs —
//      vLLM/TGI/LiteLLM all expose an OpenAI-compatible /v1 endpoint.
//    • The facade RETURNS THE OPENAI SDK RESPONSE SHAPE unchanged, so existing
//      call sites that read `completion.choices[0].message.content` and
//      `completion.usage` keep working with zero edits.
//    • Optional automatic fallback: if the primary (local) call fails and a
//      fallback provider is configured, we retry once on the fallback. Your
//      uptime shouldn't depend on a single GPU box.
//
//  What this does NOT cover:
//    Assistants API, Threads, Vector Stores, file_search, image generation.
//    Those are higher lock-in and handled separately (see MAINTAINER_NOTES).
//    This facade is for plain chat completions + embeddings only.
// ─────────────────────────────────────────────────────────────────────────────

import OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources/chat/completions";
import type {
  CreateEmbeddingResponse,
  EmbeddingCreateParams,
} from "openai/resources/embeddings";
import { logger } from "./logger.js";

export type LlmProvider = "openai" | "local";

// ── Provider config (read from process.env, like utils/openai.ts) ────────────
// Kept out of the Zod schema deliberately: utils/openai.ts already reads
// OPENAI_API_KEY straight from process.env, and we don't want to force a hard
// requirement that breaks dev boots without keys.

const PRIMARY_PROVIDER = (process.env.LLM_PROVIDER as LlmProvider) || "openai";

// When LLM_PROVIDER=local and the local call fails, fall back to this provider.
// Set to "none" to disable fallback. Defaults to openai so a GPU outage degrades
// gracefully rather than taking the feature down.
const FALLBACK_PROVIDER =
  (process.env.LLM_FALLBACK_PROVIDER as LlmProvider | "none") ||
  (PRIMARY_PROVIDER === "local" ? "openai" : "none");

// Default model per provider. Individual call sites can still pass their own
// `model`; these are only used when a call omits it (rare) or for clarity.
const OPENAI_DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const LOCAL_DEFAULT_MODEL = process.env.LOCAL_LLM_MODEL || "llama-3.3-70b";

// ── Clients ──────────────────────────────────────────────────────────────────

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 60_000,
});

// Local client points at a self-hosted, OpenAI-compatible server (vLLM, TGI,
// LiteLLM proxy). LOCAL_LLM_API_KEY is often a dummy value vLLM ignores, but
// some gateways require it.
let localClient: OpenAI | null = null;
function getLocalClient(): OpenAI {
  if (!localClient) {
    const baseURL = process.env.LOCAL_LLM_BASE_URL;
    if (!baseURL) {
      throw new Error(
        "LLM_PROVIDER=local but LOCAL_LLM_BASE_URL is not set. " +
          "Point it at your vLLM/TGI endpoint, e.g. http://localhost:8000/v1",
      );
    }
    localClient = new OpenAI({
      apiKey: process.env.LOCAL_LLM_API_KEY || "not-needed",
      baseURL,
      maxRetries: 2,
      timeout: 120_000, // local models can be slower under load
    });
  }
  return localClient;
}

function clientFor(provider: LlmProvider): OpenAI {
  return provider === "local" ? getLocalClient() : openaiClient;
}

function defaultModelFor(provider: LlmProvider): string {
  return provider === "local" ? LOCAL_DEFAULT_MODEL : OPENAI_DEFAULT_MODEL;
}

// ── Public surface ───────────────────────────────────────────────────────────

/**
 * Chat completion through the configured provider, with optional fallback.
 *
 * Drop-in replacement for `openai.chat.completions.create(params)` — same
 * params in, same OpenAI SDK response out. Existing call sites can switch from
 *   `openai.chat.completions.create({ ... })`
 * to
 *   `llm.chatCompletion({ ... })`
 * with no other changes to how they read `.choices[0].message.content`,
 * `.usage`, etc.
 *
 * If the params omit `model`, the provider's default model is used.
 */
export async function chatCompletion(
  params: ChatCompletionCreateParamsNonStreaming,
): Promise<ChatCompletion> {
  const provider = PRIMARY_PROVIDER;
  const body: ChatCompletionCreateParamsNonStreaming = {
    ...params,
    model: params.model || defaultModelFor(provider),
  };

  try {
    return await clientFor(provider).chat.completions.create(body);
  } catch (error: any) {
    if (FALLBACK_PROVIDER !== "none" && FALLBACK_PROVIDER !== provider) {
      logger.warn(
        { provider, fallback: FALLBACK_PROVIDER, error: error.message },
        "LLM primary provider failed, retrying on fallback",
      );
      const fallbackBody: ChatCompletionCreateParamsNonStreaming = {
        ...params,
        model:
          // If the original model was a provider-specific name, swap to the
          // fallback's default rather than sending e.g. a vLLM model id to OpenAI.
          provider === "local" && params.model
            ? defaultModelFor(FALLBACK_PROVIDER)
            : params.model || defaultModelFor(FALLBACK_PROVIDER),
      };
      return await clientFor(FALLBACK_PROVIDER).chat.completions.create(
        fallbackBody,
      );
    }
    throw error;
  }
}

/**
 * Embeddings through the configured provider (no fallback by default —
 * embeddings must be consistent within a vector store, so silently switching
 * providers mid-stream would corrupt similarity. Pick one and stick to it).
 *
 * For the helpdesk vector store we'll likely keep embeddings on OpenAI even
 * after migrating chat to local, since OpenAI embeddings are dirt cheap and
 * mixing embedding models in one store breaks retrieval.
 */
export async function createEmbedding(
  params: EmbeddingCreateParams,
): Promise<CreateEmbeddingResponse> {
  // Embeddings default to OpenAI regardless of LLM_PROVIDER unless explicitly
  // overridden, for the consistency reason above.
  const provider =
    (process.env.EMBEDDING_PROVIDER as LlmProvider) || "openai";
  const body: EmbeddingCreateParams = {
    ...params,
    model:
      params.model ||
      (provider === "local"
        ? process.env.LOCAL_EMBEDDING_MODEL || "bge-m3"
        : process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small"),
  };
  return clientFor(provider).embeddings.create(body);
}

/** Which provider is active — handy for logging / debug endpoints. */
export function activeProvider(): LlmProvider {
  return PRIMARY_PROVIDER;
}

/**
 * The raw OpenAI client, for the few places that still need OpenAI-specific
 * features the facade deliberately doesn't wrap (Assistants, Threads, Vector
 * Stores, file uploads, image generation). Using this directly is a signal
 * that the code is NOT portable to a local LLM — keep these call sites
 * inventoried (see MAINTAINER_NOTES "Severity 1" list).
 */
export const rawOpenAI = openaiClient;

export const llm = {
  chatCompletion,
  createEmbedding,
  activeProvider,
  rawOpenAI,
};
