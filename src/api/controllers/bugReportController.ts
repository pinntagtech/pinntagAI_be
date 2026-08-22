import { Request, Response } from "express";
import { logger } from "../../utils/logger.js";
import {
  BugReportService,
  GenerateBugDescriptionRequest,
  VALID_BUG_APP_TYPES,
  VALID_BUG_CATEGORIES,
} from "../services/bugReport.service.js";
import {
  validateRequiredFields,
  withControllerError,
} from "./controller.utils.js";

const MIN_TITLE_LENGTH = 3;

/**
 * Generate a bug report description from the user's title ("AI Assist")
 * POST /bug-report/description
 */
export async function generateBugDescription(
  req: Request,
  res: Response,
): Promise<void> {
  await withControllerError(res, "Error generating bug description", async () => {
    const params: GenerateBugDescriptionRequest = req.body;

    if (!validateRequiredFields(res, params, [{ key: "title" }])) {
      return;
    }

    if (typeof params.title !== "string" || params.title.trim().length < MIN_TITLE_LENGTH) {
      res.status(400).json({
        success: false,
        error: `title must be at least ${MIN_TITLE_LENGTH} characters`,
      });
      return;
    }

    if (params.appType && !VALID_BUG_APP_TYPES.includes(params.appType)) {
      res.status(400).json({
        success: false,
        error: `Invalid appType. Must be one of: ${VALID_BUG_APP_TYPES.join(", ")}`,
      });
      return;
    }

    if (params.category && !VALID_BUG_CATEGORIES.includes(params.category)) {
      res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${VALID_BUG_CATEGORIES.join(", ")}`,
      });
      return;
    }

    logger.info(
      {
        appType: params.appType || "CONSUMER",
        screen: params.screen,
        userId: params.userId,
      },
      "Generating bug report description",
    );

    const result = await BugReportService.generateDescription(params);

    res.status(200).json(result);
  });
}

/**
 * Regenerate a description for the same title (new phrasing)
 * POST /bug-report/description/refresh
 */
export async function refreshBugDescription(
  req: Request,
  res: Response,
): Promise<void> {
  req.body.refreshSeed = `refresh_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 11)}`;

  return generateBugDescription(req, res);
}
