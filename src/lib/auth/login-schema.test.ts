import { describe, expect, it } from "vitest";
import { loginBodySchema } from "@/lib/auth/login-schema";

describe("login schema", () => {
  it("accepts a valid email and non-empty password", () => {
    const parsed = loginBodySchema.safeParse({
      email: "medico@hospital.org",
      password: "x",
    });
    expect(parsed.success).toBe(true);
  });

  it("does not apply password-creation rules on login", () => {
    const parsed = loginBodySchema.safeParse({
      email: "medico@hospital.org",
      password: "1",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const parsed = loginBodySchema.safeParse({
      email: "not-an-email",
      password: "secret",
    });
    expect(parsed.success).toBe(false);
  });
});
