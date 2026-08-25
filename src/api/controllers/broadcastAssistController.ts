import { Request, Response } from "express";
import { logger } from "../../utils/logger.js";
import {
  BroadcastAssistService,
  GenerateBroadcastDescriptionRequest,
  VALID_BROADCAST_LENGTHS,
  VALID_BROADCAST_PURPOSES,
  VALID_BROADCAST_TONES,
} from "../services/broadcastAssist.service.js";
import {
  validateRequiredFields,
  withControllerError,
} from "./controller.utils.js";

const MIN_TITLE_LENGTH = 3;

/**
 * Generate a broadcast message body from the title ("AI Assist")
 * POST /broadcast-assist/description
 */
export async function generateBroadcastDescription(
  req: Request,
  res: Response,
): Promise<void> {
  await withControllerError(
    res,
    "Error generating broadcast description",
    async () => {
      const params: GenerateBroadcastDescriptionRequest = req.body;

      if (!validateRequiredFields(res, params, [{ key: "title" }])) {
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

      if (
        params.purpose &&
        !VALID_BROADCAST_PURPOSES.includes(params.purpose)
      ) {
        res.status(400).json({
          success: false,
          error: `Invalid purpose. Must be one of: ${VALID_BROADCAST_PURPOSES.join(", ")}`,
        });
        return;
      }

      if (params.tone && !VALID_BROADCAST_TONES.includes(params.tone)) {
        res.status(400).json({
          success: false,
          error: `Invalid tone. Must be one of: ${VALID_BROADCAST_TONES.join(", ")}`,
        });
        return;
      }

      if (params.length && !VALID_BROADCAST_LENGTHS.includes(params.length)) {
        res.status(400).json({
          success: false,
          error: `Invalid length. Must be one of: ${VALID_BROADCAST_LENGTHS.join(", ")}`,
        });
        return;
      }

      if (params.keyPoints && !Array.isArray(params.keyPoints)) {
        res.status(400).json({
          success: false,
          error: "keyPoints must be an array of strings",
        });
        return;
      }

      logger.info(
        {
          businessId: params.businessId,
          purpose: params.purpose || "announcement",
          tone: params.tone || "friendly",
        },
        "Generating broadcast description",
      );

      const result = await BroadcastAssistService.generateDescription(params);

      res.status(200).json(result);
    },
  );
}

/**
 * Regenerate the message with a different angle
 * POST /broadcast-assist/description/refresh
 */
export async function refreshBroadcastDescription(
  req: Request,
  res: Response,
): Promise<void> {
  req.body.refreshSeed = `refresh_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 11)}`;

  return generateBroadcastDescription(req, res);
}
