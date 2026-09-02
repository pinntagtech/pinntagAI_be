// ─────────────────────────────────────────────────────────────────────────────
//  reviewChatRateLimit.ts — the bouncer for the consumer review chat
//
//  Two independent limits, both counted in Redis:
//    1. Per user per day: MAX_PER_USER_PER_DAY messages. Keyed off the JWT's
//       userId (the consumer app calls this service directly with a Bearer
//       token; the route is JWT-gated, so req.user is always populated by the
//       time this middleware runs). Resets at local midnight via an absolute
//       Redis expiry, regardless of when the day's first message arrived.
//    2. Per IP per day: MAX_PER_IP_PER_DAY messages. Separate abuse guard for
//       cases where many fresh accounts share an IP (NAT, lab, attacker pool).
//
//  When either limit is exceeded → HTTP 429 with a friendly message.
//
//  Fail-open: if Redis is unreachable (counter returns null), we let the
//  request through. A Redis outage must not take the bot down. Consistent with
//  the answer cache, which also fails open.
//
//  History note: an earlier design used a per-sessionId counter intended to
//  "reset on tab close" — meaningless on mobile, and easily bypassed by app
//  relaunch. With JWT-identified requests we now key off userId, which is
//  what we actually want.
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from "express";
import { incrementWithExpireAt } from "../utils/redis.js";
import { logger } from "../utils/logger.js";

const MAX_PER_USER_PER_DAY = 20;
const MAX_PER_IP_PER_DAY = 100;

const USER_PREFIX = "reviewchat:rl:user";
const IP_PREFIX = "reviewchat:rl:ip";

/** First IP in x-forwarded-for, else req.ip. Matches the rest of the app. */
function resolveIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown"
  );
}

/**
 * userId from the JWT. Codebase uses `userId` everywhere but the typed field
 * is `id`; the catch-all on PinntagJwtPayload makes both valid at runtime.
 * Try `userId` first (the common convention here), fall back to `id`.
 */
function resolveUserId(req: Request): string | undefined {
  const u = req.user;
  if (!u) return undefined;
  return (u.userId as string | undefined) ?? (u.id as string | undefined);
}

/** Epoch seconds at the next local midnight — when daily counters reset. */
function nextLocalMidnightUnix(): number {
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // start of tomorrow, local time
    0,
    0,
    0,
    0,
  );
  return Math.floor(midnight.getTime() / 1000);
}

const USER_LIMIT_MESSAGE =
  "You've reached today's limit. Please try again tomorrow.";
const IP_LIMIT_MESSAGE =
  "You've reached today's limit. Please try again tomorrow.";

/**
 * Express middleware enforcing the two limits. Order: check IP first (the
 * abuse guard), then per-user (the per-account cap).
 *
 * Assumes verifyPinntagJwt has already run upstream — req.user should be set.
 * If somehow it isn't, we still apply the IP cap as a baseline guard.
 */
export async function reviewChatRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const ip = resolveIp(req);
  const userId = resolveUserId(req);
  const midnight = nextLocalMidnightUnix();

  // ── Per-IP daily limit (abuse guard) ────────────────────────────────────
  const ipKey = `${IP_PREFIX}:${ip}`;
  const ipCount = await incrementWithExpireAt(ipKey, midnight);

  // ipCount === null → Redis unavailable → fail open (skip both limits; we
  // can't count, so we don't block).
  if (ipCount !== null && ipCount > MAX_PER_IP_PER_DAY) {
    logger.info(
      { ip, ipCount, limit: MAX_PER_IP_PER_DAY },
      "Review chat IP daily rate limit hit",
    );
    res.status(429).json({ success: false, error: IP_LIMIT_MESSAGE });
    return;
  }

  // ── Per-user daily limit ─────────────────────────────────────────────────
  // The route is JWT-gated so userId is normally set. If it's missing, the IP
  // cap above is the only guard for this request — acceptable for the rare
  // edge case (e.g. a token that decoded without userId).
  if (userId && ipCount !== null) {
    const userKey = `${USER_PREFIX}:${userId}`;
    const userCount = await incrementWithExpireAt(userKey, midnight);

    if (userCount !== null && userCount > MAX_PER_USER_PER_DAY) {
      logger.info(
        { userId, userCount, limit: MAX_PER_USER_PER_DAY },
        "Review chat user daily rate limit hit",
      );
      res.status(429).json({ success: false, error: USER_LIMIT_MESSAGE });
      return;
    }
  }

  next();
}
