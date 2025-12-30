import { Request, Response } from "express";
import { logger } from "../../utils/logger.js";
import {
  CheckInService,
  CheckInContext,
} from "../services/checkIn.service.js";
import {
  validateRequiredFields,
  withControllerError,
} from "./controller.utils.js";

/**
 * Generate AI-suggested check-in titles based on business metadata
 */
export async function generateCheckInTitles(
  req: Request,
  res: Response
): Promise<void> {
  await withControllerError(
    res,
    "Error generating check-in titles",
    async () => {
      const { businessId } = req.body;

      // Validate required fields
      if (
        !validateRequiredFields(res, req.body, [{ key: "businessId" }])
      ) {
        return;
      }

      // Build context
      const context: CheckInContext = {
        businessId,
      };

      logger.info(
        { businessId },
        "Generating check-in titles from business metadata"
      );

      // Generate 10 titles by default
      const result = await CheckInService.generateCheckInTitles(context, 10);

      res.status(200).json(result);
    }
  );
}
