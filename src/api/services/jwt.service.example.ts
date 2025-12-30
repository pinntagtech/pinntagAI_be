/**
 * EXAMPLES: How to use the Pinntag JWT Service
 *
 * This file demonstrates various ways to use the JWT service for
 * decoding and verifying JWT tokens from Pinntag Backend.
 */

import { Router, Request, Response } from "express";
import {
  jwtService,
  verifyPinntagToken,
  decodePinntagToken,
  verifyPinntagAuthHeader,
  PinntagJwtPayload,
} from "./jwt.service.js";
import {
  verifyPinntagJwt,
  optionalPinntagJwt,
  requireRole,
  requireBusinessAccess,
} from "../../middleware/jwtAuth.js";

const router = Router();

// ============================================================================
// EXAMPLE 1: Using the JWT service directly in a route
// ============================================================================

router.post("/api/verify-token", (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: "Token is required",
    });
  }

  // Verify the token
  const result = verifyPinntagToken(token);

  if (!result.valid) {
    return res.status(401).json({
      success: false,
      error: result.error,
      expired: result.expired,
    });
  }

  // Token is valid - use the payload
  return res.json({
    success: true,
    payload: result.payload,
  });
});

// ============================================================================
// EXAMPLE 2: Decoding a token without verification (use with caution!)
// ============================================================================

router.post("/api/decode-token", (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: "Token is required",
    });
  }

  // Decode without verification - useful for debugging
  const payload = decodePinntagToken(token);

  if (!payload) {
    return res.status(400).json({
      success: false,
      error: "Invalid token format",
    });
  }

  return res.json({
    success: true,
    payload,
    warning: "Token was decoded but NOT verified",
  });
});

// ============================================================================
// EXAMPLE 3: Using middleware to protect routes
// ============================================================================

router.get("/api/protected", verifyPinntagJwt, (req: Request, res: Response) => {
  // req.user is now populated with the JWT payload
  return res.json({
    success: true,
    message: "This is a protected route",
    user: req.user,
  });
});

// ============================================================================
// EXAMPLE 4: Optional authentication (different behavior based on auth)
// ============================================================================

router.get("/api/content", optionalPinntagJwt, (req: Request, res: Response) => {
  if (req.user) {
    // User is authenticated - show personalized content
    return res.json({
      success: true,
      message: `Welcome back, user ${req.user.userId}`,
      personalizedContent: true,
    });
  } else {
    // User is not authenticated - show public content
    return res.json({
      success: true,
      message: "Welcome, guest",
      personalizedContent: false,
    });
  }
});

// ============================================================================
// EXAMPLE 5: Role-based access control
// ============================================================================

router.delete(
  "/api/admin/users/:userId",
  verifyPinntagJwt,
  requireRole("admin", "super-admin"),
  (req: Request, res: Response) => {
    // Only users with 'admin' or 'super-admin' role can access this
    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  }
);

// ============================================================================
// EXAMPLE 6: Business-scoped access control
// ============================================================================

router.get(
  "/api/business/:businessId/data",
  verifyPinntagJwt,
  requireBusinessAccess,
  (req: Request, res: Response) => {
    // User must be authenticated and have access to this specific business
    const { businessId } = req.params;

    return res.json({
      success: true,
      message: `Data for business ${businessId}`,
      data: {
        // Your business data here
      },
    });
  }
);

// ============================================================================
// EXAMPLE 7: Manually verifying Authorization header
// ============================================================================

router.post("/api/custom-auth", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  // Verify the Authorization header
  const result = verifyPinntagAuthHeader(authHeader);

  if (!result.valid) {
    return res.status(401).json({
      success: false,
      error: result.error,
      expired: result.expired,
    });
  }

  // Custom logic here
  return res.json({
    success: true,
    userId: result.payload?.userId,
  });
});

// ============================================================================
// EXAMPLE 8: Checking token expiration
// ============================================================================

router.post("/api/check-expiration", (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: "Token is required",
    });
  }

  const expirationDate = jwtService.getExpirationDate(token);
  const isExpired = jwtService.isExpired(token);
  const timeToExpiration = jwtService.getTimeToExpiration(token);

  return res.json({
    success: true,
    expirationDate,
    isExpired,
    timeToExpiration,
    timeToExpirationMinutes: timeToExpiration ? timeToExpiration / 1000 / 60 : null,
  });
});

// ============================================================================
// EXAMPLE 9: Using JWT service in a class/service
// ============================================================================

class UserService {
  async getUserFromToken(authHeader: string): Promise<PinntagJwtPayload | null> {
    const result = verifyPinntagAuthHeader(authHeader);

    if (!result.valid || !result.payload) {
      return null;
    }

    return result.payload;
  }

  async isTokenValid(token: string): Promise<boolean> {
    const result = verifyPinntagToken(token);
    return result.valid;
  }
}

// ============================================================================
// EXAMPLE 10: Custom verification options
// ============================================================================

router.post("/api/verify-with-options", (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: "Token is required",
    });
  }

  // Verify with custom options
  const result = jwtService.verify(token, {
    // Don't fail if token is expired (for testing)
    ignoreExpiration: false,

    // Verify audience
    audience: "pinntag-api",

    // Verify issuer
    issuer: "pinntag-backend",

    // Clock tolerance in seconds
    clockTolerance: 60,
  });

  return res.json({
    success: result.valid,
    payload: result.payload,
    error: result.error,
  });
});

// ============================================================================
// USAGE IN YOUR APPLICATION
// ============================================================================

/*
1. Import the middleware or service:
   import { verifyPinntagJwt } from './middleware/jwtAuth.js';
   import { jwtService, verifyPinntagToken } from './api/services/jwt.service.js';

2. Use in routes:
   app.get('/api/protected', verifyPinntagJwt, (req, res) => {
     // req.user contains the JWT payload
   });

3. Or manually verify:
   const result = verifyPinntagToken(token);
   if (result.valid) {
     // Use result.payload
   }

4. Environment setup required:
   - Set PINNTAG_BACKEND_JWT_SECRET in your .env file
   - This should match the secret used by Pinntag Backend to sign JWTs
*/

export default router;
