import { Request, Response } from "express";
import { logger } from "../../utils/logger.js";
import {
  DescriptionAssistService,
  GenerateDescriptionRequest,
  VALID_DESCRIPTION_ASSIST_TYPES,
} from "../services/descriptionAssist.service.js";
import {
  VALID_BUG_APP_TYPES,
  VALID_BUG_CATEGORIES,
} from "../services/bugReport.service.js";
import {
  VALID_BROADCAST_LENGTHS,
  VALID_BROADCAST_PURPOSES,
  VALID_BROADCAST_TONES,
} from "../services/broadcastAssist.service.js";
import {
  validateRequiredFields,
  withControllerError,
} from "./controller.utils.js";

const MIN_TITLE_LENGTH = 3;

type EnumCheck = { field: string; value: unknown; allowed: readonly string[] };

/**
 * Validate every provided enum field, or send a 400 naming the first bad one.
 * Absent fields pass — they fall back to the generator's defaults.
 */
function validateEnums(res: Response, checks: EnumCheck[]): boolean {
  for (const { field, value, allowed } of checks) {
    if (value === undefined || value === null) continue;
    if (typeof value !== "string" || !allowed.includes(value)) {
      res.status(400).json({
        success: false,
        error: `Invalid ${field}. Must be one of: ${allowed.join(", ")}`,
      });
      return false;
    }
  }
  return true;
}

/**
 * Generate or regenerate a description for any AI Assist field
 * POST /ai-assist/description
 */
export async function generateDescription(
  req: Request,
  res: Response,
): Promise<void> {
  await withControllerError(res, "Error generating description", async () => {
    const params: GenerateDescriptionRequest = req.body;

    if (
      !validateRequiredFields(res, params, [{ key: "type" }, { key: "title" }])
    ) {
      return;
    }

    if (!VALID_DESCRIPTION_ASSIST_TYPES.includes(params.type)) {
      res.status(400).json({
        success: false,
        error: `Invalid type. Must be one of: ${VALID_DESCRIPTION_ASSIST_TYPES.join(", ")}`,
      });
      return;
    }

    if (
      typeof params.title !== "string" ||
      params.title.trim().length < MIN_TITLE_LENGTH
    ) {
      res.status(400).json({
        success: false,
        error: `title must be at least ${MIN_TITLE_LENGTH} characters`,
      });
      return;
    }

    if (params.context !== undefined && typeof params.context !== "object") {
      res.status(400).json({
        success: false,
        error: "context must be an object",
      });
      return;
    }

    const context = params.context || {};

    // Only the fields that belong to this type are validated — sending a
    // broadcast tone on a bug report is a client mistake worth naming.
    if (params.type === "bug_report") {
      if (
        !validateEnums(res, [
          { field: "context.appType", value: context.appType, allowed: VALID_BUG_APP_TYPES },
          { field: "context.category", value: context.category, allowed: VALID_BUG_CATEGORIES },
        ])
      ) {
        return;
      }
    } else {
      if (
        !validateEnums(res, [
          { field: "context.purpose", value: context.purpose, allowed: VALID_BROADCAST_PURPOSES },
          { field: "context.tone", value: context.tone, allowed: VALID_BROADCAST_TONES },
          { field: "context.length", value: context.length, allowed: VALID_BROADCAST_LENGTHS },
        ])
      ) {
        return;
      }

      if (context.keyPoints !== undefined && !Array.isArray(context.keyPoints)) {
        res.status(400).json({
          success: false,
          error: "context.keyPoints must be an array of strings",
        });
        return;
      }
    }

    logger.info(
      {
        type: params.type,
        regenerate: !!params.regenerate,
        businessId: params.businessId,
      },
      "AI assist description requested",
    );

    const result = await DescriptionAssistService.generate(params);

    res.status(200).json(result);
  });
}
