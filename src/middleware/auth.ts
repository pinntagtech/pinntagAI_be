import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

/**
 * Optional incoming API-key protection for routes exposed to Pinntag backend.
 * Requires header: x-internal-api-key: <PINNTAG_BACKEND_TO_AI_KEY>
 */
export function internalApiKeyGuard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!env.ENFORCE_INTERNAL_API_KEY) return next();
  const key = req.header("x-internal-api-key");
  if (!key || key !== env.PINNTAG_BACKEND_TO_AI_KEY) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  return next();
}
