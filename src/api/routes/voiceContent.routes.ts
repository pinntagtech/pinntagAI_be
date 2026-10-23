import { Router } from "express";
import { internalApiKeyGuard } from "../../middleware/auth.js";
import { createVoiceContentDraft } from "../controllers/voiceContent.controller.js";

const router = Router();

// Called only by pinntagBackend. Guarded router-wide so a route added later
// cannot ship without the key check.
router.use(internalApiKeyGuard);

/**
 * @route POST /voice-content/draft
 * @desc Turn a short text description (phone transcript or typed) plus
 *       business context into a structured offer or event draft.
 * @access Protected (internal API key)
 * @header x-internal-api-key: string (required)
 * @header x-request-id: string (the backend's draft id; on every log line)
 *
 * @body {
 *   requestId: string,
 *   businessId?: string (enables usage tracking),
 *   contentType: "offer" | "business_event",
 *   text: string (3-1500 chars),
 *   locale?: "en-US" | "es-US" | "es-MX" (hint only),
 *   nowIso?: string,
 *   business: { name, industry?, isFoodAndDrink, verified? },
 *   outlets: [{ id, name, address?, city?, timezone, localDate, localWeekday }],
 *   allowedDiscountTypes: string[],
 *   maxDaysAhead: number,
 *   recurringAllowed: boolean,
 *   maxTags: number
 * }
 *
 * @response 200 { draft, language, missing, models, usage, latencyMs }
 * @response 422 { code: "NO_CONTENT" | "NOT_RELEVANT", message }
 * @response 400 { code: "INVALID_REQUEST", message }
 * @response 502/504/500 { code: "PROVIDER_ERROR" | "SCHEMA_FAILURE" | "TIMEOUT" | "INTERNAL", message }
 */
router.post("/draft", createVoiceContentDraft);

export { router as voiceContentRoutes };
