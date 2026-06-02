// ─────────────────────────────────────────────────────────────────────────────
//  redis.ts — fail-safe Redis cache helper
//
//  A thin wrapper over ioredis with one hard rule: REDIS MUST NEVER CRASH A
//  REQUEST. If REDIS_URL is unset, or Redis is down, or a command errors, every
//  method degrades to a no-op (get → null, set → silently skipped) and the
//  caller falls through to its normal path (e.g. an LLM call).
//
//  Design:
//    • Lazy single connection, created on first use.
//    • lazyConnect so construction never throws synchronously.
//    • `enableOfflineQueue: false` so commands fail fast instead of buffering
//      forever when Redis is unreachable — we want to fall back, not hang.
//    • Connection errors are logged once-ish and swallowed.
//
//  This is intentionally generic (get/set/del with TTL). The review-chat
//  answer cache is the first consumer; others can reuse it.
// ─────────────────────────────────────────────────────────────────────────────

import { Redis } from "ioredis";
import { logger } from "./logger.js";

let client: Redis | null = null;
let initialized = false;
let disabled = false; // true when REDIS_URL is absent — skip entirely

/**
 * Get the shared Redis client, or null if Redis isn't configured / available.
 * Never throws.
 */
function getClient(): Redis | null {
  if (disabled) return null;
  if (initialized) return client;

  initialized = true;
  const url = process.env.REDIS_URL;

  if (!url) {
    disabled = true;
    logger.info("REDIS_URL not set — review chat cache disabled (no-op).");
    return null;
  }

  try {
    client = new Redis(url, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      // Cap reconnect backoff so a dead Redis doesn't spin hot.
      retryStrategy: (times) => Math.min(times * 200, 5000),
    });

    client.on("error", (err) => {
      // ioredis emits 'error' on connection issues. Log at warn, don't throw.
      logger.warn({ error: err.message }, "Redis connection error (cache will no-op)");
    });

    // Kick off the lazy connection; ignore the result — get/set handle failures.
    client.connect().catch((err) => {
      logger.warn(
        { error: err.message },
        "Redis initial connect failed (cache will no-op until it recovers)",
      );
    });

    return client;
  } catch (err: any) {
    logger.warn({ error: err.message }, "Failed to create Redis client — cache disabled");
    disabled = true;
    return null;
  }
}

/**
 * Get a cached string value, or null on miss / error / no Redis.
 */
export async function cacheGet(key: string): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  try {
    return await c.get(key);
  } catch (err: any) {
    logger.warn({ error: err.message, key }, "Redis GET failed — treating as miss");
    return null;
  }
}

/**
 * Set a cached string value with a TTL (seconds). Silently no-ops on error.
 */
export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    await c.set(key, value, "EX", ttlSeconds);
  } catch (err: any) {
    logger.warn({ error: err.message, key }, "Redis SET failed — skipping cache write");
  }
}

/** Delete a key. Silently no-ops on error. */
export async function cacheDel(key: string): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    await c.del(key);
  } catch (err: any) {
    logger.warn({ error: err.message, key }, "Redis DEL failed");
  }
}

/**
 * Atomically increment a counter and (on first increment) set its TTL.
 * Used for rate limiting.
 *
 * Returns the new count, or `null` when the counter can't be read/written
 * (no Redis configured, or Redis is down). Callers MUST distinguish null
 * (unknown — fail open) from a number (known count). This is different from
 * cacheGet, which collapses miss + failure into null.
 *
 * TTL is only applied when the key is newly created (count === 1) so a
 * rolling counter's window starts at the first hit and isn't extended by
 * later hits within the window.
 */
export async function incrementWithTtl(
  key: string,
  ttlSeconds: number,
): Promise<number | null> {
  const c = getClient();
  if (!c) return null;
  try {
    const count = await c.incr(key);
    if (count === 1) {
      // First hit in this window — start the expiry clock.
      await c.expire(key, ttlSeconds);
    }
    return count;
  } catch (err: any) {
    logger.warn(
      { error: err.message, key },
      "Redis INCR failed — rate limit will fail open",
    );
    return null;
  }
}

/**
 * Increment a counter that expires at a fixed wall-clock time (absolute TTL),
 * rather than a rolling window. Used for the per-IP daily limit, which must
 * reset at midnight regardless of when the first request of the day arrived.
 *
 * `expireAtUnixSeconds` is the absolute epoch-seconds at which the key should
 * expire (e.g. next local midnight). Returns the new count, or null on failure.
 */
export async function incrementWithExpireAt(
  key: string,
  expireAtUnixSeconds: number,
): Promise<number | null> {
  const c = getClient();
  if (!c) return null;
  try {
    const count = await c.incr(key);
    if (count === 1) {
      await c.expireat(key, expireAtUnixSeconds);
    }
    return count;
  } catch (err: any) {
    logger.warn(
      { error: err.message, key },
      "Redis INCR (expireat) failed — rate limit will fail open",
    );
    return null;
  }
}

/** Whether a Redis client is configured (REDIS_URL present). For debug/health. */
export function isCacheEnabled(): boolean {
  getClient();
  return !disabled;
}
