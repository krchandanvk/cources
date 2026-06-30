import { describe, it, expect, beforeEach } from "vitest";
import { MemoryRateLimiter } from "../lib/ratelimit/memory";

describe("MemoryRateLimiter", () => {
  let limiter: MemoryRateLimiter;

  beforeEach(() => {
    limiter = new MemoryRateLimiter();
  });

  it("allows requests within the limit", async () => {
    const result = await limiter.check("test:user", 5, 60_000);
    expect(result.allowed).toBe(true);
  });

  it("blocks requests exceeding the limit", async () => {
    for (let i = 0; i < 3; i++) {
      await limiter.check("test:user2", 3, 60_000);
    }
    const result = await limiter.check("test:user2", 3, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("uses separate windows per key", async () => {
    for (let i = 0; i < 3; i++) {
      await limiter.check("key:a", 3, 60_000);
    }
    // key:a is exhausted, but key:b should still be allowed
    const resultA = await limiter.check("key:a", 3, 60_000);
    const resultB = await limiter.check("key:b", 3, 60_000);

    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
  });

  it("counts consecutive requests correctly", async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 5; i++) {
      const r = await limiter.check("key:c", 3, 60_000);
      results.push(r.allowed);
    }
    expect(results).toEqual([true, true, true, false, false]);
  });
});
