import redis from "./redis";

const CACHE_TTL = 60 * 60 * 24 * 31; // 1 month in seconds (absolute expiration)
const STALE_THRESHOLD = 60 * 60 * 24; // 1 day in seconds (when to revalidate in background)

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
      // No await here or wait? We should await the redis set but not the whole revalidate call from the main thread
      if (redis) {
        await redis.set(cacheKey, JSON.stringify(entry), { ex: CACHE_TTL });
        // console.log(`[SWR] Revalidated cache for: ${url}`);
      }
    }
  } catch (error) {
    console.error(`[SWR] Background revalidation failed for ${url}:`, error);
  }
}

export async function fetchWithCache(url: string) {
  if (!redis) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }
    return response.json();
  }

  const cacheKey = `api-cache-v2:${url}`; // Versioned key to avoid conflicts with old format

  try {
    const cached = (await redis.get(cacheKey)) as string | CacheEntry | null;
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
    console.error("Redis get error:", error);
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

  try {
    const entry: CacheEntry = {
      data,
      lastUpdated: Date.now(),
    };
    await redis.set(cacheKey, JSON.stringify(entry), { ex: CACHE_TTL });
  } catch (error) {
    console.error("Redis set error:", error);
  }

  return data;
}
