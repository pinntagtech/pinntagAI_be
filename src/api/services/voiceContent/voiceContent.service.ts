// ─────────────────────────────────────────────────────────────────────────────
//  voiceContent.service.ts — one LLM call, inside a hard time budget
//
//  The app gives up at ~25 s and the backend at 22 s, so we hold 20 s:
//    • each call gets min(9 s, what's left) and the SDK never retries itself;
//    • we retry once, on 429 / 5xx / connection error / per-call timeout /
//      unparseable output, and only if at least 5 s remain;
//    • when the budget runs out the in-flight call is aborted.
//
//  The model caller is injected so tests run without the network. The service
//  is stateless: nothing here stores or logs the merchant text or the draft.
// ─────────────────────────────────────────────────────────────────────────────

import {
  APIConnectionTimeoutError,
  APIError,
  APIUserAbortError,
} from "openai";
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources/chat/completions";
import { VoiceContentError, VoiceContentErrorCode } from "./errors.js";
import { buildMessages, PROMPT_VERSION } from "./prompt.js";
import { VoiceContentRequest } from "./request.js";
import { buildJsonSchema, buildZodSchema, ModelOutput } from "./schema.js";
import { toDraft } from "./draft.js";

export type CallModel = (
  params: ChatCompletionCreateParamsNonStreaming,
  options: { signal: AbortSignal; timeout: number },
) => Promise<ChatCompletion>;

export interface DraftRunnerOptions {
  callModel: CallModel;
  model: string;
  budgetMs?: number;
  callTimeoutMs?: number;
  minRetryBudgetMs?: number;
  maxOutputTokens?: number;
  now?: () => number;
}

export interface DraftRunMeta {
  attempts: number;
  model: string;
  language: string | null;
  usage: { inputTokens: number; outputTokens: number };
  latencyMs: { llm: number; total: number };
  /** Why the last attempt failed: HTTP status, zod paths, timeout. Never text. */
  failure?: string;
}

export type DraftRunResult =
  | { ok: true; body: Record<string, unknown>; meta: DraftRunMeta }
  | { ok: false; error: VoiceContentError; meta: DraftRunMeta };

export const DEFAULT_BUDGET_MS = 20_000;
export const DEFAULT_CALL_TIMEOUT_MS = 9_000;
export const DEFAULT_MIN_RETRY_BUDGET_MS = 5_000;
const MAX_ATTEMPTS = 2;

/** Model output we could not use. Carries zod paths only, never values. */
export class ParseFailure extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "ParseFailure";
  }
}

export function buildParams(
  req: VoiceContentRequest,
  model: string,
  maxOutputTokens = 800,
): ChatCompletionCreateParamsNonStreaming {
  return {
    model,
    temperature: 0,
    max_completion_tokens: maxOutputTokens,
    messages: buildMessages(req),
    response_format: {
      type: "json_schema",
      json_schema: {
        name: `voice_content_${req.contentType}`,
        strict: true,
        schema: buildJsonSchema(req),
      },
    },
  };
}

export function parseCompletion(completion: ChatCompletion, req: VoiceContentRequest): ModelOutput {
  const choice = completion.choices[0];
  if (!choice) throw new ParseFailure("no choices");
  // A refusal means the model would not describe the text as content.
  if (choice.message.refusal) throw new VoiceContentError("NOT_RELEVANT");
  if (choice.finish_reason === "length") throw new ParseFailure("output truncated");

  let json: unknown;
  try {
    json = JSON.parse(choice.message.content ?? "");
  } catch {
    throw new ParseFailure("invalid JSON");
  }
  const parsed = buildZodSchema(req).safeParse(json);
  if (!parsed.success) {
    const paths = parsed.error.issues.map((i) => i.path.join(".") || "(root)");
    throw new ParseFailure(`schema mismatch at ${[...new Set(paths)].join(", ")}`);
  }
  return parsed.data as ModelOutput;
}

function describe(err: unknown): string {
  if (err instanceof VoiceContentError) return err.code;
  if (err instanceof ParseFailure) return err.message;
  if (err instanceof APIError) return err.status ? `HTTP ${err.status}` : err.name;
  return err instanceof Error ? err.name : "unknown";
}

function classify(err: unknown, budgetSpent: boolean): { code: VoiceContentErrorCode; retryable: boolean } {
  if (err instanceof VoiceContentError) return { code: err.code, retryable: false };
  if (err instanceof ParseFailure) return { code: "SCHEMA_FAILURE", retryable: true };
  if (budgetSpent || err instanceof APIUserAbortError) return { code: "TIMEOUT", retryable: false };
  if (err instanceof APIConnectionTimeoutError) return { code: "TIMEOUT", retryable: true };
  if (err instanceof APIError) {
    const status = err.status;
    // No status: connection error. 429 and 5xx: provider trouble. Other 4xx: our bug.
    const retryable = status === undefined || status === 429 || status >= 500;
    return { code: "PROVIDER_ERROR", retryable };
  }
  return { code: "INTERNAL", retryable: false };
}

export async function generateDraft(
  req: VoiceContentRequest,
  opts: DraftRunnerOptions,
): Promise<DraftRunResult> {
  const now = opts.now ?? Date.now;
  const budgetMs = opts.budgetMs ?? DEFAULT_BUDGET_MS;
  const callTimeoutMs = opts.callTimeoutMs ?? DEFAULT_CALL_TIMEOUT_MS;
  const minRetryBudgetMs = opts.minRetryBudgetMs ?? DEFAULT_MIN_RETRY_BUDGET_MS;

  const start = now();
  const deadline = start + budgetMs;
  const budget = new AbortController();
  const timer = setTimeout(() => budget.abort(), budgetMs);

  const params = buildParams(req, opts.model, opts.maxOutputTokens);
  const meta: DraftRunMeta = {
    attempts: 0,
    model: opts.model,
    language: null,
    usage: { inputTokens: 0, outputTokens: 0 },
    latencyMs: { llm: 0, total: 0 },
  };
  const finish = () => {
    clearTimeout(timer);
    meta.latencyMs.total = now() - start;
    return meta;
  };

  let lastError: VoiceContentError = new VoiceContentError("INTERNAL");

  while (meta.attempts < MAX_ATTEMPTS) {
    const remaining = deadline - now();
    if (remaining <= 0) {
      lastError = new VoiceContentError("TIMEOUT");
      break;
    }
    meta.attempts += 1;
    const callStart = now();
    let callDone = false;
    try {
      const completion = await opts.callModel(params, {
        signal: budget.signal,
        timeout: Math.min(callTimeoutMs, remaining),
      });
      callDone = true;
      meta.latencyMs.llm += now() - callStart;
      meta.model = completion.model || opts.model;
      meta.usage.inputTokens += completion.usage?.prompt_tokens ?? 0;
      meta.usage.outputTokens += completion.usage?.completion_tokens ?? 0;

      const out = parseCompletion(completion, req);
      meta.language = out.language;
      if (out.status === "no_content") throw new VoiceContentError("NO_CONTENT");
      if (out.status === "not_relevant") throw new VoiceContentError("NOT_RELEVANT");

      const { draft, missing } = toDraft(out, req);
      const m = finish();
      return {
        ok: true,
        meta: m,
        body: {
          draft,
          language: out.language,
          missing,
          models: { llm: m.model, prompt: PROMPT_VERSION },
          usage: m.usage,
          latencyMs: m.latencyMs,
        },
      };
    } catch (err) {
      if (!callDone) meta.latencyMs.llm += now() - callStart;
      meta.failure = describe(err);
      const { code, retryable } = classify(err, budget.signal.aborted);
      lastError = err instanceof VoiceContentError ? err : new VoiceContentError(code);
      const canRetry = retryable && meta.attempts < MAX_ATTEMPTS && deadline - now() >= minRetryBudgetMs;
      if (!canRetry) break;
    }
  }

  return { ok: false, error: lastError, meta: finish() };
}
