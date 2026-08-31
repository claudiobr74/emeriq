import { describe, expect, it } from "vitest";
import { AppwriteException } from "node-appwrite";
import { mapAuthError } from "@/lib/appwrite/auth";

describe("mapAuthError", () => {
  it("maps invalid credentials without leaking internals", () => {
    const mapped = mapAuthError(new AppwriteException("nope", 401, "user_invalid_credentials"));
    expect(mapped.code).toBe("invalid_credentials");
    expect(mapped.message).toBe("E-mail ou senha inválidos.");
    expect(mapped.message).not.toMatch(/Appwrite|401/i);
  });

  it("maps rate limits", () => {
    const mapped = mapAuthError(new AppwriteException("slow down", 429, "general_rate_limit_exceeded"));
    expect(mapped.code).toBe("rate_limited");
  });

  it("maps network failures", () => {
    const mapped = mapAuthError(new TypeError("fetch failed"));
    expect(mapped.code).toBe("network_error");
  });
});
