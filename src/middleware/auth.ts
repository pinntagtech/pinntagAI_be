import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { ApiKeyModel } from "../models/ApiKey.js";

type AuthCheck = {
  apiKeyValid: boolean;
  bearerValid: boolean;
  apiKeyValue?: string;
  bearerTokenValue?: string;
};

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

/**
 * Validate incoming auth via API key and/or Bearer token.
 * Behavior is controlled by env flags:
 * - AUTH_REQUIRE_API_KEY: when true, an active API key must be provided
 * - AUTH_REQUIRE_BEARER: when true, a valid bearer token must be provided
 * - AUTH_REQUIRE_BOTH: when true and both above are true, require both; otherwise either suffices
 * API key header name defaults to 'x-api-key' and is configurable via AUTH_API_KEY_HEADER_NAME.
 * Bearer tokens are matched against AUTH_BEARER_TOKENS (comma-separated) or AUTH_BEARER_TOKEN.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Fast-path: auth not enforced
  const needApiKey = env.AUTH_REQUIRE_API_KEY;
  const needBearer = env.AUTH_REQUIRE_BEARER;
  const requireBoth = env.AUTH_REQUIRE_BOTH && needApiKey && needBearer;
  if (!needApiKey && !needBearer) return next();

  try {
    const check: AuthCheck = {
      apiKeyValid: false,
      bearerValid: false,
    };

    // Extract API key
    const apiKeyHeaderName = env.AUTH_API_KEY_HEADER_NAME.toLowerCase();
    const apiKeyHeaderValue = (req.headers[apiKeyHeaderName] ||
      req.headers["x-api-key"]) as string | string[] | undefined;
    const apiKeyValue = Array.isArray(apiKeyHeaderValue)
      ? apiKeyHeaderValue[0]
      : apiKeyHeaderValue;
    check.apiKeyValue = apiKeyValue;

    // Validate API key (static env or DB)
    if (apiKeyValue) {
      const staticKeyOk =
        !!env.AUTH_STATIC_API_KEY && apiKeyValue === env.AUTH_STATIC_API_KEY;
      let dbKeyOk = false;
      if (!staticKeyOk) {
        const found = await ApiKeyModel.findOne({
          key: apiKeyValue,
          active: true,
        }).lean();
        dbKeyOk = !!found;
      }
      check.apiKeyValid = staticKeyOk || dbKeyOk;
    }

    // Extract Bearer token
    const authHeader =
      req.headers.authorization || req.headers["Authorization" as any];
    let bearerToken: string | undefined;
    if (
      typeof authHeader === "string" &&
      authHeader.toLowerCase().startsWith("bearer ")
    ) {
      bearerToken = authHeader.slice(7).trim();
    }
    check.bearerTokenValue = bearerToken;

    // Validate Bearer token (static list)
    if (bearerToken) {
      const allowedTokens = env.AUTH_BEARER_TOKENS.length
        ? env.AUTH_BEARER_TOKENS
        : env.AUTH_BEARER_TOKEN
        ? [env.AUTH_BEARER_TOKEN]
        : [];
      check.bearerValid = allowedTokens.includes(bearerToken);
    }

    // Decide pass/fail
    let authorized = false;
    if (requireBoth) {
      authorized = check.apiKeyValid && check.bearerValid;
    } else if (needApiKey && needBearer) {
      // Either works if both configured but both-not-required
      authorized = check.apiKeyValid || check.bearerValid;
    } else if (needApiKey) {
      authorized = check.apiKeyValid;
    } else if (needBearer) {
      authorized = check.bearerValid;
    }

    if (!authorized) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Stash auth info for downstream handlers if needed
    (res.locals as any).auth = {
      apiKey: check.apiKeyValid ? check.apiKeyValue : undefined,
      bearer: check.bearerValid ? check.bearerTokenValue : undefined,
    };

    return next();
  } catch (err) {
    return res.status(500).json({ success: false, error: "Auth error" });
  }
}
