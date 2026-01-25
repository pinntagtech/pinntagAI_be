import { Response } from "express";
import { logger } from "../../utils/logger.js";
import { checkImageGenerationAccess } from "../../utils/subscription.utils.js";

type RequiredField<T> = {
  key: keyof T | string;
  label?: string;
};

/**
 * Custom error class for API errors with HTTP status codes
 */
export class ApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 400, code?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }

  static badRequest(message: string, code?: string): ApiError {
    return new ApiError(message, 400, code);
  }

  static notFound(message: string, code?: string): ApiError {
    return new ApiError(message, 404, code);
  }

  static forbidden(message: string, code?: string): ApiError {
    return new ApiError(message, 403, code);
  }
}

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
 * Known error codes that should return 400 Bad Request
 */
const BAD_REQUEST_ERROR_CODES = [
  "BUSINESS_NOT_FOUND",
  "ASSISTANT_NOT_FOUND",
  "INVALID_BUSINESS_ID",
  "VALIDATION_ERROR",
];

/**
 * Error message patterns that indicate client errors (400)
 */
const BAD_REQUEST_PATTERNS = [
  /invalid.*format/i,
  /not found/i,
  /is required/i,
  /must be/i,
  /please create/i,
  /does not have/i,
];

/**
 * Determines if an error should be treated as a client error (400) or server error (500)
 */
function isClientError(error: any): boolean {
  // Check if it's an ApiError with explicit status code
  if (error instanceof ApiError) {
    return error.statusCode >= 400 && error.statusCode < 500;
  }

  // Check for known error codes
  if (error?.code && BAD_REQUEST_ERROR_CODES.includes(error.code)) {
    return true;
  }

  // Check error message patterns
  const message = error?.message || "";
  return BAD_REQUEST_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Shared controller wrapper for consistent error logging/response formatting.
 * Returns 400 for client errors and 200 for successful requests.
 * Never returns 500 - all unexpected errors are logged and returned as 400 with a generic message.
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

    // Determine the appropriate status code
    let statusCode: number;
    let responseMessage: string;

    if (error instanceof ApiError) {
      statusCode = error.statusCode;
      responseMessage = message;
    } else if (isClientError(error)) {
      statusCode = 400;
      responseMessage = message;
    } else {
      // For unexpected server errors, log the full error but return a generic message
      // Still return 400 to avoid exposing internal server issues
      statusCode = 400;
      responseMessage = "Unable to process request. Please try again.";
    }

    logger.error(
      {
        error: message,
        stack: error?.stack,
        context,
        statusCode,
        errorCode: error?.code,
      },
      context
    );

    res.status(statusCode).json({
      success: false,
      error: responseMessage,
      ...(error?.code && { code: error.code }),
    });
  }
}
