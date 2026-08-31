import { describe, expect, it } from "vitest";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/appwrite/config";

describe("session cookie", () => {
  it("is named clearly and marked HttpOnly", () => {
    expect(SESSION_COOKIE).toBe("emeriq_session");
    expect(SESSION_COOKIE_OPTIONS.httpOnly).toBe(true);
    expect(SESSION_COOKIE_OPTIONS.sameSite).toBe("lax");
    expect(SESSION_COOKIE_OPTIONS.path).toBe("/");
  });
});
