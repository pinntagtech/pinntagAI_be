// ─────────────────────────────────────────────────────────────────────────────
//  reviewChatRateLimit.ts — the bouncer for the consumer review chat
//
//  Two independent limits, both counted in Redis:
//    1. Per session: ${MAX_PER_SESSION} messages total. The frontend sends a
//       sessionId per chat session (per tab). A new tab = new sessionId = fresh
//       budget — that's how "resets on tab close" works (the server can't see a
//       tab close; it just counts per sessionId). No sessionId → this limit is
//       skipped and only the IP limit applies.
//    2. Per IP per day: ${MAX_PER_IP_PER_DAY} messages. Resets at local midnight
//       via an absolute Redis expiry, regardless of when the day's first
//       request arrived.
//
//  When either limit is exceeded → HTTP 429 with a friendly message.
//
//  Fail-open: if Redis is unreachable (counter returns null), we let the
//  request through. A Redis outage must not take the bot down. Consistent with
//  the answer cache, which also fails open.
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from "express";
import {
  incrementWithTtl,
  incrementWithExpireAt,
} from "../utils/redis.js";
import { logger } from "../utils/logger.js";

const MAX_PER_SESSION = 20;
const MAX_PER_IP_PER_DAY = 100;

// Safety TTL for session counters so abandoned sessions don't live forever.
// The session "resets" by getting a new id (new tab), not by time — this is
// just garbage collection for keys no one will touch again.
const SESSION_COUNTER_TTL_SECONDS = 24 * 60 * 60;

const SESSION_PREFIX = "reviewchat:rl:session";
const IP_PREFIX = "reviewchat:rl:ip";

/** First IP in x-forwarded-for, else req.ip. Matches the rest of the app. */
function resolveIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown"
  );
}

/** Epoch seconds at the next local midnight — when the daily IP counter resets. */
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

const SESSION_LIMIT_MESSAGE =
  "You've reached the limit for this chat session. Please start a new chat to continue.";
const IP_LIMIT_MESSAGE =
  "You've reached today's limit. Please try again tomorrow.";

/**
 * Express middleware enforcing the two limits. Order: check IP first (the
 * harder daily cap that protects the bill), then session.
 */
export async function reviewChatRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const ip = resolveIp(req);
  const sessionId =
    typeof req.body?.sessionId === "string" ? req.body.sessionId : undefined;

  // ── Per-IP daily limit ──────────────────────────────────────────────────
  const ipKey = `${IP_PREFIX}:${ip}`;
  const ipCount = await incrementWithExpireAt(ipKey, nextLocalMidnightUnix());

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

  // ── Per-session limit ─────────────────────────────────────────────────────
  // Only when the client supplied a sessionId. No session → IP limit is the
  // only guard, which is acceptable (the IP cap still protects the bill).
  if (sessionId && ipCount !== null) {
    const sessionKey = `${SESSION_PREFIX}:${sessionId}`;
    const sessionCount = await incrementWithTtl(
      sessionKey,
      SESSION_COUNTER_TTL_SECONDS,
    );

    if (sessionCount !== null && sessionCount > MAX_PER_SESSION) {
      logger.info(
        { sessionId, sessionCount, limit: MAX_PER_SESSION },
        "Review chat session rate limit hit",
      );
      res.status(429).json({ success: false, error: SESSION_LIMIT_MESSAGE });
      return;
    }
  }

  next();
}
