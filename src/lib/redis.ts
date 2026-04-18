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
      })
    : null;

export default redis;
