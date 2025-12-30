import jwt, { JwtPayload, VerifyOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

/**
 * Pinntag Backend JWT Token Payload Interface
 * Based on actual Pinntag Backend token structure
 */
export interface PinntagJwtPayload extends JwtPayload {
  id?: string; // User ID
  userType?: string; // e.g., "BusinessUser"
  role?: string; // Role ID
  businessProfile?: string; // Business Profile ID (used as businessId)
  email?: string;
  [key: string]: any;
}

/**
 * JWT Verification Result
 */
export interface JwtVerificationResult {
  valid: boolean;
  payload?: PinntagJwtPayload;
  error?: string;
  expired?: boolean;
}

/**
 * JWT Service for Pinntag Backend
 * Provides plug-and-play JWT token decoding and verification
 */
export class JwtService {
  private secret: string;

  constructor(secret?: string) {
    this.secret = secret || env.PINNTAG_BACKEND_JWT_SECRET;
    if (!this.secret) {
      throw new Error(
        "JWT secret is not configured. Please set PINNTAG_BACKEND_JWT_SECRET in environment variables."
      );
    }
  }

  /**
   * Verify and decode a JWT token
   * @param token - JWT token string
   * @param options - Optional verification options
   * @returns Verification result with payload if valid
   */
  verify(
    token: string,
    options?: VerifyOptions
  ): JwtVerificationResult {
    try {
      const payload = jwt.verify(token, this.secret, options) as PinntagJwtPayload;

      logger.debug({ userId: payload.userId }, "JWT token verified successfully");

      return {
        valid: true,
        payload,
      };
    } catch (error: any) {
      logger.warn({ error: error.message }, "JWT verification failed");

      // Check if token is expired
      const isExpired = error.name === "TokenExpiredError";

      return {
        valid: false,
        error: error.message,
        expired: isExpired,
      };
    }
  }

  /**
   * Decode a JWT token without verification
   * Use this only for inspecting token contents, not for authentication
   * @param token - JWT token string
   * @returns Decoded payload or null if invalid format
   */
  decode(token: string): PinntagJwtPayload | null {
    try {
      const decoded = jwt.decode(token) as PinntagJwtPayload;

      if (!decoded) {
        logger.warn("JWT token could not be decoded");
        return null;
      }

      logger.debug({ userId: decoded.userId }, "JWT token decoded (unverified)");

      return decoded;
    } catch (error: any) {
      logger.error({ error: error.message }, "JWT decode error");
      return null;
    }
  }

  /**
   * Extract and verify JWT token from Authorization header
   * @param authHeader - Authorization header value (e.g., "Bearer <token>")
   * @param options - Optional verification options
   * @returns Verification result with payload if valid
   */
  verifyFromHeader(
    authHeader: string | undefined,
    options?: VerifyOptions
  ): JwtVerificationResult {
    if (!authHeader) {
      return {
        valid: false,
        error: "Authorization header is missing",
      };
    }

    const token = this.extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        valid: false,
        error: "Invalid Authorization header format. Expected 'Bearer <token>'",
      };
    }

    return this.verify(token, options);
  }

  /**
   * Extract token from Authorization header
   * @param authHeader - Authorization header value
   * @returns Token string or null
   */
  private extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || typeof authHeader !== "string") {
      return null;
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      return null;
    }

    return parts[1];
  }

  /**
   * Get token expiration date
   * @param token - JWT token string
   * @returns Expiration Date or null if not present/invalid
   */
  getExpirationDate(token: string): Date | null {
    const decoded = this.decode(token);

    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  }

  /**
   * Check if token is expired (without full verification)
   * @param token - JWT token string
   * @returns True if expired, false otherwise
   */
  isExpired(token: string): boolean {
    const expirationDate = this.getExpirationDate(token);

    if (!expirationDate) {
      return true; // Treat tokens without expiration as expired for safety
    }

    return expirationDate < new Date();
  }

  /**
   * Get time remaining until token expires
   * @param token - JWT token string
   * @returns Milliseconds until expiration, or null if no expiration set
   */
  getTimeToExpiration(token: string): number | null {
    const expirationDate = this.getExpirationDate(token);

    if (!expirationDate) {
      return null;
    }

    const now = new Date();
    const timeRemaining = expirationDate.getTime() - now.getTime();

    return timeRemaining > 0 ? timeRemaining : 0;
  }
}

/**
 * Singleton instance for convenient usage
 */
export const jwtService = new JwtService();

/**
 * Helper function to quickly verify a token
 * @param token - JWT token string
 * @returns Verification result
 */
export function verifyPinntagToken(token: string): JwtVerificationResult {
  return jwtService.verify(token);
}

/**
 * Helper function to decode a token without verification
 * @param token - JWT token string
 * @returns Decoded payload or null
 */
export function decodePinntagToken(token: string): PinntagJwtPayload | null {
  return jwtService.decode(token);
}

/**
 * Helper function to verify token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Verification result
 */
export function verifyPinntagAuthHeader(authHeader: string | undefined): JwtVerificationResult {
  return jwtService.verifyFromHeader(authHeader);
}
