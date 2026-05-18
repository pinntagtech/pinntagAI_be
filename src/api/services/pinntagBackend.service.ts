import type { Connection } from "mongoose";
import { getBackendBusinessModel } from "../../models/pinntagBackend/business.model.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

/**
 * Ad-hoc reads against the Backend DB from PinntagAI context.
 * Always pass in the backend connection from getBackendConnection().
 */
export const fetchBusinessById = async (
  backendConn: Connection,
  id: string
) => {
  const Business = getBackendBusinessModel(backendConn);
  return Business.findById(id).lean();
};

export const fetchBusinessesByIds = async (
  backendConn: Connection,
  ids: string[]
) => {
  const Business = getBackendBusinessModel(backendConn);
  return Business.find({ _id: { $in: ids } }).lean();
};

export const searchBusinesses = async (
  backendConn: Connection,
  q: string,
  limit = 10
) => {
  const Business = getBackendBusinessModel(backendConn);
  return Business.find({ name: { $regex: q, $options: "i" } })
    .limit(limit)
    .lean();
};

export interface TriggerNotificationInput {
  businessId: string;
  title: string;
  message: string;
}

export interface TriggerNotificationResult {
  delivered: boolean;
  status?: number;
  error?: string;
}

/**
 * Trigger a push notification via the Pinntag backend's
 * POST /v1/business/ai/notify endpoint. Never throws — returns
 * { delivered: false, error } when delivery fails so callers can
 * continue their primary flow (template persistence, etc.).
 */
export const triggerNotification = async (
  input: TriggerNotificationInput
): Promise<TriggerNotificationResult> => {
  if (!env.BACKEND_URL) {
    logger.warn(
      { businessId: input.businessId },
      "Skipping notification — BACKEND_URL is not configured"
    );
    return { delivered: false, error: "BACKEND_URL not configured" };
  }
  if (!env.PINNTAG_AI_TO_BACKEND_KEY) {
    logger.warn(
      { businessId: input.businessId },
      "Skipping notification — PINNTAG_AI_TO_BACKEND_KEY is not configured"
    );
    return { delivered: false, error: "PINNTAG_AI_TO_BACKEND_KEY not configured" };
  }

  const url = `${env.BACKEND_URL.replace(/\/$/, "")}/business/ai/notify`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.HTTP_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": env.PINNTAG_AI_TO_BACKEND_KEY,
      },
      body: JSON.stringify({
        businessId: input.businessId,
        title: input.title,
        message: input.message,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      logger.warn(
        {
          businessId: input.businessId,
          status: res.status,
          body: text.slice(0, 500),
        },
        "Backend notify call returned non-2xx"
      );
      return { delivered: false, status: res.status, error: text || res.statusText };
    }

    return { delivered: true, status: res.status };
  } catch (err: any) {
    logger.error(
      { businessId: input.businessId, err: err?.message },
      "Backend notify call failed"
    );
    return { delivered: false, error: err?.message ?? "Unknown error" };
  } finally {
    clearTimeout(timeout);
  }
};

export interface AiTemplateGenStartInput {
  businessId: string;
  jobId: string;
  requested: number;
}

export interface AiTemplateGenFinishInput {
  businessId: string;
  jobId: string;
  status: "completed" | "failed";
  generated: number;
  failed: number;
  isTrained?: boolean;
  error?: string | null;
}

export interface BackendCallResult {
  delivered: boolean;
  status?: number;
  error?: string;
}

const postToBackend = async (
  path: string,
  body: Record<string, unknown>,
  businessId: string,
  op: string
): Promise<BackendCallResult> => {
  if (!env.BACKEND_URL) {
    logger.warn({ businessId, op }, "Skipping backend call — BACKEND_URL is not configured");
    return { delivered: false, error: "BACKEND_URL not configured" };
  }
  if (!env.PINNTAG_AI_TO_BACKEND_KEY) {
    logger.warn(
      { businessId, op },
      "Skipping backend call — PINNTAG_AI_TO_BACKEND_KEY is not configured"
    );
    return { delivered: false, error: "PINNTAG_AI_TO_BACKEND_KEY not configured" };
  }

  const url = `${env.BACKEND_URL.replace(/\/$/, "")}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.HTTP_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": env.PINNTAG_AI_TO_BACKEND_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      logger.warn(
        { businessId, op, status: res.status, body: text.slice(0, 500) },
        "Backend call returned non-2xx"
      );
      return { delivered: false, status: res.status, error: text || res.statusText };
    }
    return { delivered: true, status: res.status };
  } catch (err: any) {
    logger.error({ businessId, op, err: err?.message }, "Backend call failed");
    return { delivered: false, error: err?.message ?? "Unknown error" };
  } finally {
    clearTimeout(timeout);
  }
};

export const markAiTemplateGenerationStarted = (
  input: AiTemplateGenStartInput
): Promise<BackendCallResult> =>
  postToBackend(
    `/business/ai/template-generation/${input.businessId}/start`,
    { jobId: input.jobId, requested: input.requested },
    input.businessId,
    "template-generation:start"
  );

export const markAiTemplateGenerationFinished = (
  input: AiTemplateGenFinishInput
): Promise<BackendCallResult> =>
  postToBackend(
    `/business/ai/template-generation/${input.businessId}/finish`,
    {
      jobId: input.jobId,
      status: input.status,
      generated: input.generated,
      failed: input.failed,
      isTrained: input.isTrained,
      error: input.error ?? null,
    },
    input.businessId,
    "template-generation:finish"
  );
