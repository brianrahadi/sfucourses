import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if ((!redisUrl || !redisToken) && process.env.NODE_ENV === "production") {
  console.warn("Upstash Redis environment variables are missing.");
}

const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
        // The default (5 retries, exponential backoff) adds seconds to every
        // request when Redis is unreachable. The cache is optional: fail fast.
        retry: { retries: 1, backoff: () => 50 },
      })
    : null;

export default redis;
