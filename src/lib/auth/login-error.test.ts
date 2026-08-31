import { describe, expect, it } from "vitest";
import { formatLoginError } from "@/lib/auth/login-error";

describe("formatLoginError", () => {
  it("keeps credential errors unchanged", () => {
    expect(
      formatLoginError("invalid_credentials", "E-mail ou senha inválidos."),
    ).toBe("E-mail ou senha inválidos.");
  });

  it("adds a wait time for rate limits", () => {
    expect(formatLoginError("rate_limited", "Muitas tentativas. Aguarde alguns instantes.", 12)).toBe(
      "Muitas tentativas. Aguarde 12 segundos.",
    );
    expect(formatLoginError("rate_limited", "Muitas tentativas. Aguarde alguns instantes.", 60)).toBe(
      "Muitas tentativas. Aguarde 1 minuto.",
    );
    expect(formatLoginError("rate_limited", "Muitas tentativas. Aguarde alguns instantes.", 900)).toBe(
      "Muitas tentativas. Aguarde 15 minutos.",
    );
  });
});
