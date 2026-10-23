import { Request, Response } from "express";
import OpenAI from "openai";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { UsageType } from "../../models/aiUsage.model.js";
import { UsageTrackingService } from "../services/usageTracking.service.js";
import { VoiceContentRequestSchema } from "../services/voiceContent/request.js";
import { VoiceContentError } from "../services/voiceContent/errors.js";
import { PROMPT_VERSION } from "../services/voiceContent/prompt.js";
import {
  CallModel,
  DEFAULT_CALL_TIMEOUT_MS,
  generateDraft,
} from "../services/voiceContent/voiceContent.service.js";

// Dedicated client: the shared ones retry 3x with a 60 s timeout, which would
// blow the 20 s budget. Retries happen in generateDraft instead.
const voiceContentClient = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  maxRetries: 0,
  timeout: DEFAULT_CALL_TIMEOUT_MS,
});

const callModel: CallModel = (params, { signal, timeout }) =>
  voiceContentClient.chat.completions.create(params, { signal, timeout });

/**
 * POST /voice-content/draft
 * Text (phone transcript or typed) + business context → structured draft.
 * Never logs the text or the draft: the backend keeps the only copy.
 */
export async function createVoiceContentDraft(req: Request, res: Response) {
  const headerRequestId = req.header("x-request-id");

  const parsed = VoiceContentRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((i) => i.path.join(".") || "(body)"))];
    const error = new VoiceContentError("INVALID_REQUEST", `Invalid request: ${fields.join(", ")}`);
    logger.warn(
      { requestId: headerRequestId, outcome: error.code, fields },
      "voice-content draft"
    );
    return res.status(error.status).json(error.toBody());
  }

  const body = parsed.data;
  const requestId = headerRequestId || body.requestId;

  try {
    const result = await generateDraft(body, {
      callModel,
      model: env.VOICE_CONTENT_LLM_MODEL,
    });
    const { meta } = result;
    const outcome = result.ok ? "OK" : result.error.code;

    (result.ok ? logger.info : logger.warn).call(
      logger,
      {
        requestId,
        contentType: body.contentType,
        language: meta.language,
        model: meta.model,
        promptVersion: PROMPT_VERSION,
        attempts: meta.attempts,
        inputTokens: meta.usage.inputTokens,
        outputTokens: meta.usage.outputTokens,
        llmMs: meta.latencyMs.llm,
        totalMs: meta.latencyMs.total,
        outcome,
        failure: meta.failure,
      },
      "voice-content draft"
    );

    if (body.businessId && meta.attempts > 0) {
      void UsageTrackingService.trackUsage({
        businessId: body.businessId,
        type: UsageType.VOICE_CONTENT,
        subType: body.contentType,
        promptTokens: meta.usage.inputTokens,
        completionTokens: meta.usage.outputTokens,
        model: meta.model,
        success: result.ok,
        errorMessage: result.ok ? undefined : outcome,
        metadata: { requestId, promptVersion: PROMPT_VERSION, language: meta.language, outcome },
      });
    }

    if (result.ok) return res.status(200).json(result.body);
    return res.status(result.error.status).json(result.error.toBody());
  } catch (err: any) {
    // Unexpected bug. Log the error type only; messages may echo input.
    logger.error(
      { requestId, contentType: body.contentType, outcome: "INTERNAL", errorName: err?.name },
      "voice-content draft"
    );
    const error = new VoiceContentError("INTERNAL");
    return res.status(error.status).json(error.toBody());
  }
}
