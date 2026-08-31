import { describe, expect, it, vi, beforeEach } from "vitest";

const deleteCurrentSession = vi.fn();
const getSessionSecret = vi.fn();

vi.mock("@/lib/appwrite/auth", () => ({
  deleteCurrentSession: (...args: unknown[]) => deleteCurrentSession(...args),
}));

vi.mock("@/lib/appwrite/session", () => ({
  getSessionSecret: (...args: unknown[]) => getSessionSecret(...args),
}));

import { POST } from "@/app/api/auth/logout/route";

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    deleteCurrentSession.mockReset();
    getSessionSecret.mockReset();
  });

  it("destroys the Appwrite session and clears the cookie", async () => {
    getSessionSecret.mockResolvedValue("sess-secret");
    deleteCurrentSession.mockResolvedValue(undefined);
    const res = await POST();
    expect(res.status).toBe(200);
    expect(deleteCurrentSession).toHaveBeenCalledWith("sess-secret");
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("emeriq_session=");
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie).toMatch(/max-age=0/i);
  });

  it("clears the cookie even without a current session", async () => {
    getSessionSecret.mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(200);
    expect(deleteCurrentSession).not.toHaveBeenCalled();
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("emeriq_session=");
  });
});
