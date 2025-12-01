import { Response } from "express";
import { logger } from "../../utils/logger.js";
import { checkImageGenerationAccess } from "../../utils/subscription.utils.js";

type RequiredField<T> = {
  key: keyof T | string;
  label?: string;
};

/**
 * Validate that required fields exist and are not empty. Sends a 400 response if any are missing.
 */
export function validateRequiredFields<T extends Record<string, any>>(
  res: Response,
  params: T,
  fields: RequiredField<T>[]
): boolean {
  const missingFields = fields
    .filter(({ key }) => {
      const value = (params as any)[key as string];
      return value === undefined || value === null || value === "";
    })
    .map(({ key, label }) => label || String(key));

  if (missingFields.length > 0) {
    const joined = missingFields.join(", ");
    res.status(400).json({
      error: `${joined} ${missingFields.length > 1 ? "are" : "is"} required`,
    });
    return false;
  }

  return true;
}

/**
 * Check image generation access and respond with subscription details when unavailable.
 */
export async function ensureImageAccess(
  res: Response,
  businessId: string
): Promise<boolean> {
  const access = await checkImageGenerationAccess(businessId);

  if (!access.hasAccess) {
    res.status(403).json({
      success: false,
      error: access.reason,
      subscriptionRequired: true,
      currentPlan: access.currentPlan,
      requiredPlan: access.requiredPlan,
      upgradeUrl: access.upgradeUrl,
    });
    return false;
  }

  return true;
}

/**
 * Shared controller wrapper for consistent error logging/response formatting.
 */
export async function withControllerError(
  res: Response,
  context: string,
  handler: () => Promise<void>
): Promise<void> {
  try {
    await handler();
  } catch (error: any) {
    const message = error?.message || "An unexpected error occurred";
    logger.error(
      {
        error: message,
        stack: error?.stack,
        context,
      },
      context
    );
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}
