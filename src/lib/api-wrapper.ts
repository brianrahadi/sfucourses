import redis from "./redis";

const CACHE_TTL = 60 * 60 * 24 * 7; // 1 week in seconds (absolute expiration)
const STALE_THRESHOLD = 60 * 60; // 1 hour in seconds (when to revalidate in background)
const REDIS_TIMEOUT_MS = 500; // reads: never let the cache be slower than the API itself
const REDIS_WRITE_TIMEOUT_MS = 1500; // writes can be multi-MB (e.g. /outlines)
const REDIS_COOLDOWN_MS = 60 * 1000; // after a Redis failure, skip Redis for a minute

// Per-instance circuit breaker: when Redis is down, don't pay the timeout on every request.
let redisDownUntil = 0;
function redisAvailable() {
  return redis !== null && Date.now() >= redisDownUntil;
}
function markRedisDown(error: unknown) {
  redisDownUntil = Date.now() + REDIS_COOLDOWN_MS;
  console.error("Redis unavailable, bypassing cache for 60s:", error);
}

/** Resolve with the promise, or reject once `ms` passes. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Redis timed out after ${ms}ms`)),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

interface CacheEntry {
  data: any;
  lastUpdated: number;
}

/**
 * Performs a background fetch to update the Redis cache.
 */
async function revalidate(url: string, cacheKey: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "Accept-Encoding": "gzip, deflate, br",
      },
    });

    if (response.ok) {
      const data = await response.json();
      const entry: CacheEntry = {
        data,
        lastUpdated: Date.now(),
      };
      if (redis && redisAvailable()) {
        await withTimeout(
          redis.set(cacheKey, JSON.stringify(entry), { ex: CACHE_TTL }),
          REDIS_WRITE_TIMEOUT_MS
        ).catch(markRedisDown);
        // console.log(`[SWR] Revalidated cache for: ${url}`);
      }
    }
  } catch (error) {
    console.error(`[SWR] Background revalidation failed for ${url}:`, error);
  }
}

export async function fetchWithCache(url: string) {
  if (!redis || !redisAvailable()) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }
    return response.json();
  }

  const cacheKey = `api-cache-v2:${url}`; // Versioned key to avoid conflicts with old format

  try {
    const cached = (await withTimeout(
      redis.get(cacheKey),
      REDIS_TIMEOUT_MS
    )) as string | CacheEntry | null;
    if (cached) {
      const entry: CacheEntry =
        typeof cached === "string" ? JSON.parse(cached) : cached;

      const ageInSeconds = (Date.now() - entry.lastUpdated) / 1000;

      if (ageInSeconds > STALE_THRESHOLD) {
        // Trigger background revalidation but don't await it
        revalidate(url, cacheKey).catch((err) =>
          console.error("Background revalidate caught error:", err)
        );
      }

      return entry.data;
    }
  } catch (error) {
    markRedisDown(error);
  }

  // If no cache or erroring, fall back to fresh fetch
  const response = await fetch(url, {
    headers: {
      "Accept-Encoding": "gzip, deflate, br",
    },
  });

  if (!response.ok) {
    throw new Error(`External API error: ${response.status}`);
  }

  const data = await response.json();

  if (!redisAvailable()) return data;

  try {
    const entry: CacheEntry = {
      data,
      lastUpdated: Date.now(),
    };
    await withTimeout(
      redis.set(cacheKey, JSON.stringify(entry), { ex: CACHE_TTL }),
      REDIS_WRITE_TIMEOUT_MS
    );
  } catch (error) {
    markRedisDown(error);
  }

  return data;
}
