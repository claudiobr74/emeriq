import { describe, expect, it } from "vitest";
import { sessionTokenFromFallbackCookies } from "@/lib/appwrite/fallback-session";

const projectId = "6a94b9240022214b03fe";

describe("sessionTokenFromFallbackCookies", () => {
  it("reads a_session_<projectId> from the JSON header", () => {
    const token = Buffer.from(
      JSON.stringify({ id: "user-a", secret: "inner-secret" }),
    ).toString("base64");
    const header = JSON.stringify({ [`a_session_${projectId}`]: token });
    expect(sessionTokenFromFallbackCookies(header, projectId)).toBe(token);
  });

  it("falls back to the legacy cookie name", () => {
    const header = JSON.stringify({
      [`a_session_${projectId}_legacy`]: "legacy-token",
    });
    expect(sessionTokenFromFallbackCookies(header, projectId)).toBe("legacy-token");
  });

  it("returns undefined for missing or invalid headers", () => {
    expect(sessionTokenFromFallbackCookies(undefined, projectId)).toBeUndefined();
    expect(sessionTokenFromFallbackCookies("{", projectId)).toBeUndefined();
    expect(sessionTokenFromFallbackCookies("{}", projectId)).toBeUndefined();
  });
});
