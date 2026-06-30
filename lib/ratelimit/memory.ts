import type { RateLimiter } from "./index";

interface WindowEntry {
  count: number;
  resetAt: number;
}

/**
 * In-process rate limiter using a Map.
 * Suitable for single-instance deployments (development, single-server prod).
 * Resets on server restart. For multi-instance deploys, use RedisRateLimiter.
 */
export class MemoryRateLimiter implements RateLimiter {
  private store = new Map<string, WindowEntry>();

  // Periodically clean up expired entries to prevent unbounded memory growth
  private pruneInterval: ReturnType<typeof setInterval> | null = null;

  constructor(pruneEveryMs = 60_000) {
    if (typeof setInterval !== "undefined") {
      this.pruneInterval = setInterval(() => this.prune(), pruneEveryMs);
    }
  }

  async check(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{ allowed: boolean; retryAfterMs?: number }> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      // New window
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true };
    }

    if (entry.count < maxRequests) {
      entry.count += 1;
      return { allowed: true };
    }

    return {
      allowed: false,
      retryAfterMs: entry.resetAt - now,
    };
  }

  private prune() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  destroy() {
    if (this.pruneInterval) clearInterval(this.pruneInterval);
    this.store.clear();
  }
}

// Singleton instance for use across Server Actions
export const memoryLimiter = new MemoryRateLimiter();
