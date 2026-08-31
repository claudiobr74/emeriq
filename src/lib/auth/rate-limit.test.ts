import { afterEach, describe, expect, it } from "vitest";
import {
  clearLoginFailures,
  clientKeyFromRequest,
  loginRateLimitKey,
  LOGIN_RATE_LIMIT,
  normalizeLoginEmail,
  peekLoginRateLimit,
  recordFailedLogin,
  resetLoginRateLimitStore,
} from "@/lib/auth/rate-limit";

afterEach(() => {
  resetLoginRateLimitStore();
});

describe("login rate limit", () => {
  it("normalizes email for the bucket key", () => {
    expect(normalizeLoginEmail("  Ana@Hospital.ORG ")).toBe("ana@hospital.org");
    expect(loginRateLimitKey("1.1.1.1", "Ana@Hospital.ORG")).toBe(
      "1.1.1.1|ana@hospital.org",
    );
  });

  it("reads the first x-forwarded-for hop", () => {
    const request = new Request("http://localhost/api/auth/login", {
      headers: { "x-forwarded-for": "  203.0.113.9, 10.0.0.1" },
    });
    expect(clientKeyFromRequest(request)).toBe("203.0.113.9");
  });

  it("does not lock on the first failures", () => {
    const key = "10.0.0.1|medico@hospital.org";
    for (let i = 0; i < LOGIN_RATE_LIMIT.maxFailures - 1; i += 1) {
      expect(recordFailedLogin(key).ok).toBe(true);
      expect(peekLoginRateLimit(key).ok).toBe(true);
    }
  });

  it("locks after max credential failures in the window", () => {
    const key = "10.0.0.2|medico@hospital.org";
    for (let i = 0; i < LOGIN_RATE_LIMIT.maxFailures; i += 1) {
      recordFailedLogin(key);
    }
    const peeked = peekLoginRateLimit(key);
    expect(peeked.ok).toBe(false);
    expect(peeked.retryAfterMs).toBeGreaterThan(0);
  });

  it("isolates emails on the same IP", () => {
    const a = loginRateLimitKey("10.0.0.3", "a@hospital.org");
    const b = loginRateLimitKey("10.0.0.3", "b@hospital.org");
    for (let i = 0; i < LOGIN_RATE_LIMIT.maxFailures; i += 1) {
      recordFailedLogin(a);
    }
    expect(peekLoginRateLimit(a).ok).toBe(false);
    expect(peekLoginRateLimit(b).ok).toBe(true);
  });

  it("clears the bucket after a successful login", () => {
    const key = loginRateLimitKey("10.0.0.4", "medico@hospital.org");
    for (let i = 0; i < LOGIN_RATE_LIMIT.maxFailures; i += 1) {
      recordFailedLogin(key);
    }
    expect(peekLoginRateLimit(key).ok).toBe(false);
    clearLoginFailures(key);
    expect(peekLoginRateLimit(key).ok).toBe(true);
  });
});
