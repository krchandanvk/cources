/**
 * Rate limiter interface — allows swapping MemoryRateLimiter for
 * RedisRateLimiter (Upstash) without changing application logic.
 */
export interface RateLimiter {
  /**
   * Check if a given identifier (e.g. "email:action") is within the limit.
   * @returns { allowed: boolean; retryAfterMs?: number }
   */
  check(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{ allowed: boolean; retryAfterMs?: number }>;
}

export { MemoryRateLimiter } from "./memory";
export { RedisRateLimiter } from "./redis";
