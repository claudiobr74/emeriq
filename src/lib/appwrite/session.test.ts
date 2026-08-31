import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "@/lib/errors";

const getCookie = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => getCookie(name),
  }),
}));

const accountGet = vi.fn();

vi.mock("node-appwrite", () => ({
  Client: class {
    setEndpoint() {
      return this;
    }
    setProject() {
      return this;
    }
    setSession() {
      return this;
    }
  },
  Account: class {
    get = (...args: unknown[]) => accountGet(...args);
  },
}));

vi.mock("@/lib/env", () => ({
  getAppwriteEndpoint: () => "https://nyc.cloud.appwrite.io/v1",
  getAppwriteProjectId: () => "proj",
}));

import { getSessionUser, requireUser } from "@/lib/appwrite/session";

describe("session helpers", () => {
  beforeEach(() => {
    getCookie.mockReset();
    accountGet.mockReset();
  });

  it("returns null when the cookie is missing", async () => {
    getCookie.mockReturnValue(undefined);
    await expect(getSessionUser()).resolves.toBeNull();
    expect(accountGet).not.toHaveBeenCalled();
  });

  it("returns null when the cookie is expired or rejected by Appwrite", async () => {
    getCookie.mockReturnValue({ value: "expired-secret" });
    accountGet.mockRejectedValue(new Error("user_session_not_found"));
    await expect(getSessionUser()).resolves.toBeNull();
  });

  it("maps Account.get to id/name/email", async () => {
    getCookie.mockReturnValue({ value: "valid-secret" });
    accountGet.mockResolvedValue({
      $id: "user-a",
      name: "Ana",
      email: "ana@hospital.org",
    });
    await expect(getSessionUser()).resolves.toEqual({
      id: "user-a",
      name: "Ana",
      email: "ana@hospital.org",
    });
  });

  it("requireUser throws UnauthorizedError without a session", async () => {
    getCookie.mockReturnValue(undefined);
    await expect(requireUser()).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
