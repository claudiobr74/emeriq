import { afterEach, describe, expect, it, vi } from "vitest";
import { AppwriteException } from "node-appwrite";
import { AppError } from "@/lib/errors";

const getAppwriteAdminApiKey = vi.fn(() => undefined);

vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>();
  return {
    ...actual,
    getAppwriteAdminApiKey: () => getAppwriteAdminApiKey(),
  };
});

import { mapAuthError, createEmailPasswordSession } from "@/lib/appwrite/auth";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  getAppwriteAdminApiKey.mockReturnValue(undefined);
});

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

  it("does not leak Appwrite configuration details", () => {
    const mapped = mapAuthError(
      new AppError("Appwrite não configurado.", "appwrite_not_configured", 503),
    );
    expect(mapped.message).toBe("Não foi possível entrar agora. Tente novamente.");
    expect(mapped.message).not.toMatch(/Appwrite/i);
  });
});

describe("createEmailPasswordSession without admin key", () => {
  it("uses X-Fallback-Cookies when the JSON has no secret", async () => {
    getAppwriteAdminApiKey.mockReturnValue(undefined);
    const projectId = "6a94b9240022214b03fe";
    const token = Buffer.from(
      JSON.stringify({ id: "user-a", secret: "inner" }),
    ).toString("base64");
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          userId: "user-a",
          expire: "2027-01-01T00:00:00.000Z",
        }),
        {
          status: 201,
          headers: {
            "content-type": "application/json",
            "x-fallback-cookies": JSON.stringify({
              [`a_session_${projectId}`]: token,
            }),
          },
        },
      ),
    ) as typeof fetch;

    const session = await createEmailPasswordSession({
      email: "ana@hospital.org",
      password: "secret-password",
    });
    expect(session.userId).toBe("user-a");
    expect(session.secret).toBe(token);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("maps 401 from the public session endpoint", async () => {
    getAppwriteAdminApiKey.mockReturnValue(undefined);
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          message: "Invalid credentials",
          type: "user_invalid_credentials",
          code: 401,
        }),
        { status: 401, headers: { "content-type": "application/json" } },
      ),
    ) as typeof fetch;

    await expect(
      createEmailPasswordSession({
        email: "ana@hospital.org",
        password: "wrong",
      }),
    ).rejects.toMatchObject({ code: 401, type: "user_invalid_credentials" });
  });
});
