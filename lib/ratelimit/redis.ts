import type { RateLimiter } from "./index";

/**
 * Upstash Redis rate limiter stub.
 * Enable this by installing @upstash/ratelimit and @upstash/redis:
 *   npm install @upstash/ratelimit @upstash/redis
 *
 * Then set environment variables:
 *   UPSTASH_REDIS_REST_URL=...
 *   UPSTASH_REDIS_REST_TOKEN=...
 *
 * Replace the MemoryRateLimiter singleton in app/actions.ts with:
 *   import { RedisRateLimiter } from "./lib/ratelimit/redis";
 *   const rateLimiter = new RedisRateLimiter();
 */
export class RedisRateLimiter implements RateLimiter {
  async check(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{ allowed: boolean; retryAfterMs?: number }> {
    // TODO: Implement with @upstash/ratelimit when Redis is provisioned.
    // Example implementation:
    //
    // const { Ratelimit } = await import("@upstash/ratelimit");
    // const { Redis } = await import("@upstash/redis");
    // const redis = new Redis({
    //   url: process.env.UPSTASH_REDIS_REST_URL!,
    //   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    // });
    // const limiter = new Ratelimit({
    //   redis,
    //   limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs}ms`),
    //   analytics: true,
    // });
    // const { success, reset } = await limiter.limit(key);
    // return { allowed: success, retryAfterMs: success ? undefined : reset - Date.now() };

    throw new Error(
      "RedisRateLimiter is not configured. Install @upstash/ratelimit and set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN."
    );
  }
}
