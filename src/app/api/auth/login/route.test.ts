import { describe, expect, it, vi, beforeEach } from "vitest";

const createEmailPasswordSession = vi.fn();
const toAuthUser = vi.fn();

vi.mock("@/lib/appwrite/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/appwrite/auth")>();
  return {
    ...actual,
    createEmailPasswordSession: (...args: unknown[]) =>
      createEmailPasswordSession(...args),
  };
});

vi.mock("@/lib/appwrite/session", () => ({
  createSessionClient: () => ({}),
  toAuthUser: (account: { $id: string; name?: string; email?: string }) =>
    toAuthUser(account),
  getSessionSecret: async () => null,
}));

vi.mock("node-appwrite", () => ({
  Account: class {
    get = async () => ({ $id: "user-a", name: "Ana", email: "ana@hospital.org" });
  },
  AppwriteException: class extends Error {
    code = 401;
    type = "user_invalid_credentials";
  },
}));

import { POST } from "@/app/api/auth/login/route";
import {
  LOGIN_RATE_LIMIT,
  resetLoginRateLimitStore,
} from "@/lib/auth/rate-limit";

function req(body: unknown, ip = "203.0.113.10") {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

function invalidCredentials() {
  return Object.assign(new Error("AppwriteException 401"), {
    code: 401,
    type: "user_invalid_credentials",
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    resetLoginRateLimitStore();
    createEmailPasswordSession.mockReset();
    toAuthUser.mockReset();
    toAuthUser.mockImplementation((account: { $id: string; name?: string; email?: string }) => ({
      id: account.$id,
      name: account.name ?? "",
      email: account.email ?? "",
    }));
  });

  it("sets an HttpOnly session cookie on valid credentials", async () => {
    createEmailPasswordSession.mockResolvedValue({
      secret: "sess-secret",
      expire: "2027-01-01T00:00:00.000Z",
      userId: "user-a",
    });
    const res = await POST(
      req({ email: "ana@hospital.org", password: "correct-password" }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { user: { id: string } };
    expect(json.user.id).toBe("user-a");
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("emeriq_session=sess-secret");
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie).not.toContain("localStorage");
  });

  it("rejects invalid credentials without leaking Appwrite details", async () => {
    createEmailPasswordSession.mockRejectedValue(invalidCredentials());
    const res = await POST(req({ email: "ana@hospital.org", password: "wrong" }));
    expect(res.status).toBe(401);
    const json = (await res.json()) as { error: string; code: string };
    expect(json.code).toBe("invalid_credentials");
    expect(json.error).toBe("E-mail ou senha inválidos.");
    expect(json.error).not.toContain("Appwrite");
  });

  it("rejects empty payload as invalid credentials", async () => {
    const res = await POST(req({ email: "", password: "" }));
    expect(res.status).toBe(401);
    expect(createEmailPasswordSession).not.toHaveBeenCalled();
  });

  it("normalizes email case before creating the session", async () => {
    createEmailPasswordSession.mockResolvedValue({
      secret: "sess-secret",
      expire: "2027-01-01T00:00:00.000Z",
      userId: "user-a",
    });
    const res = await POST(
      req({ email: "Ana@Hospital.ORG", password: "correct-password" }),
    );
    expect(res.status).toBe(200);
    expect(createEmailPasswordSession).toHaveBeenCalledWith({
      email: "ana@hospital.org",
      password: "correct-password",
    });
  });

  it("rate-limits only after repeated invalid credentials", async () => {
    createEmailPasswordSession.mockRejectedValue(invalidCredentials());
    const ip = "198.51.100.20";
    const body = { email: "ana@hospital.org", password: "wrong" };
    for (let i = 0; i < LOGIN_RATE_LIMIT.maxFailures; i += 1) {
      const res = await POST(req(body, ip));
      expect(res.status).toBe(401);
    }
    const locked = await POST(req(body, ip));
    expect(locked.status).toBe(429);
    const json = (await locked.json()) as {
      code: string;
      retryAfterSeconds: number;
    };
    expect(json.code).toBe("rate_limited");
    expect(json.retryAfterSeconds).toBeGreaterThan(0);
    expect(locked.headers.get("retry-after")).toBeTruthy();
    expect(createEmailPasswordSession).toHaveBeenCalledTimes(
      LOGIN_RATE_LIMIT.maxFailures,
    );
  });

  it("does not count successful logins toward the lockout", async () => {
    createEmailPasswordSession.mockResolvedValue({
      secret: "sess-secret",
      expire: "2027-01-01T00:00:00.000Z",
      userId: "user-a",
    });
    const ip = "198.51.100.21";
    const body = { email: "ana@hospital.org", password: "correct-password" };
    for (let i = 0; i < LOGIN_RATE_LIMIT.maxFailures + 2; i += 1) {
      const res = await POST(req(body, ip));
      expect(res.status).toBe(200);
    }
  });

  it("does not lock the IP when Appwrite is rate-limiting", async () => {
    createEmailPasswordSession.mockRejectedValue(
      Object.assign(new Error("slow down"), {
        code: 429,
        type: "general_rate_limit_exceeded",
      }),
    );
    const ip = "198.51.100.22";
    const body = { email: "ana@hospital.org", password: "correct-password" };
    for (let i = 0; i < LOGIN_RATE_LIMIT.maxFailures + 2; i += 1) {
      const res = await POST(req(body, ip));
      expect(res.status).toBe(429);
      expect(createEmailPasswordSession).toHaveBeenCalledTimes(i + 1);
    }
  });

  it("keeps lockouts isolated per email", async () => {
    createEmailPasswordSession.mockRejectedValue(invalidCredentials());
    const ip = "198.51.100.23";
    for (let i = 0; i < LOGIN_RATE_LIMIT.maxFailures; i += 1) {
      await POST(req({ email: "ana@hospital.org", password: "wrong" }, ip));
    }
    const locked = await POST(
      req({ email: "ana@hospital.org", password: "wrong" }, ip),
    );
    expect(locked.status).toBe(429);

    createEmailPasswordSession.mockResolvedValue({
      secret: "sess-secret",
      expire: "2027-01-01T00:00:00.000Z",
      userId: "user-b",
    });
    const other = await POST(
      req({ email: "bruno@hospital.org", password: "correct-password" }, ip),
    );
    expect(other.status).toBe(200);
  });
});
