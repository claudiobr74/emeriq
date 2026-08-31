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

function req(body: unknown) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
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
    createEmailPasswordSession.mockRejectedValue(
      Object.assign(new Error("AppwriteException 401"), {
        code: 401,
        type: "user_invalid_credentials",
      }),
    );
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
});
