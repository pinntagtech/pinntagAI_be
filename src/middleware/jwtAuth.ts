import { Request, Response, NextFunction } from "express";
import { jwtService, PinntagJwtPayload } from "../api/services/jwt.service.js";
import { logger } from "../utils/logger.js";

/**
 * Extend Express Request to include JWT payload
 */
declare global {
  namespace Express {
    interface Request {
      user?: PinntagJwtPayload;
      jwtToken?: string;
    }
  }
}

/**
 * Middleware to verify Pinntag Backend JWT token
 * Extracts token from Authorization header, verifies it, and attaches payload to req.user
 *
 * Usage:
 *   router.get('/protected', verifyPinntagJwt, (req, res) => {
 *     console.log(req.user); // JWT payload
 *   });
 */
export function verifyPinntagJwt(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization || req.headers["Authorization" as any];

  if (!authHeader) {
    logger.warn({ path: req.path }, "Missing authorization header");
    return res.status(401).json({
      success: false,
      error: "Authorization header is required",
    });
  }

  const result = jwtService.verifyFromHeader(authHeader as string);

  if (!result.valid) {
    const statusCode = result.expired ? 401 : 401;
    const errorMessage = result.expired
      ? "Token has expired"
      : result.error || "Invalid token";

    logger.warn(
      { path: req.path, error: result.error, expired: result.expired },
      "JWT verification failed"
    );

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      expired: result.expired,
    });
  }

  // Attach user payload to request
  req.user = result.payload;

  // Optionally attach the raw token
  const token = (authHeader as string).split(" ")[1];
  req.jwtToken = token;

  logger.debug(
    { userId: req.user?.userId, path: req.path },
    "JWT verified successfully"
  );

  next();
}

/**
 * Optional middleware - verifies JWT if present, but doesn't fail if missing
 * Useful for routes that have different behavior for authenticated vs unauthenticated users
 *
 * Usage:
 *   router.get('/optional', optionalPinntagJwt, (req, res) => {
 *     if (req.user) {
 *       // Authenticated user
 *     } else {
 *       // Anonymous user
 *     }
 *   });
 */
export function optionalPinntagJwt(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization || req.headers["Authorization" as any];

  if (!authHeader) {
    // No auth header - continue without user
    return next();
  }

  const result = jwtService.verifyFromHeader(authHeader as string);

  if (result.valid && result.payload) {
    req.user = result.payload;
    const token = (authHeader as string).split(" ")[1];
    req.jwtToken = token;

    logger.debug(
      { userId: req.user?.userId, path: req.path },
      "Optional JWT verified successfully"
    );
  } else {
    logger.debug(
      { path: req.path, error: result.error },
      "Optional JWT verification failed, continuing without auth"
    );
  }

  next();
}

/**
 * Middleware to check for specific user roles
 * Must be used after verifyPinntagJwt
 *
 * Usage:
 *   router.delete('/admin', verifyPinntagJwt, requireRole('admin'), (req, res) => {
 *     // Only admin users can access
 *   });
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const userRole = req.user.role;

    if (!userRole || !roles.includes(userRole)) {
      logger.warn(
        { userId: req.user.userId, userRole, requiredRoles: roles, path: req.path },
        "Insufficient permissions"
      );

      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has specific business access
 * Must be used after verifyPinntagJwt
 * Note: Uses businessProfile field from JWT token as businessId
 *
 * Usage:
 *   router.get('/business/:businessId', verifyPinntagJwt, requireBusinessAccess, (req, res) => {
 *     // User must have access to the business in the URL
 *   });
 */
export function requireBusinessAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  const businessId = req.params.businessId || req.query.businessId || req.body.businessId;
  // Get businessId from businessProfile field in JWT token
  const userBusinessId = req.user.businessProfile;

  if (!businessId) {
    return res.status(400).json({
      success: false,
      error: "Business ID is required",
    });
  }

  if (userBusinessId !== businessId) {
    logger.warn(
      {
        userId: req.user.id,
        userBusinessId,
        requestedBusinessId: businessId,
        path: req.path,
      },
      "Unauthorized business access attempt"
    );

    return res.status(403).json({
      success: false,
      error: "You do not have access to this business",
    });
  }

  next();
}
