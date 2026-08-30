import { describe, expect, it } from "vitest";
import { openAiRetryAfterMs, isRetryableClinicalError, AppError } from "@/lib/errors";

describe("OpenAI retry-after", () => {
  it("parses try again in 3m15s", () => {
    const error = new Error(
      "Rate limit reached ... Please try again in 3m15.263999999s. Need more tokens?",
    );
    expect(openAiRetryAfterMs(error)).toBeGreaterThan(3 * 60 * 1000);
    expect(openAiRetryAfterMs(error)).toBeLessThan(3 * 60 * 1000 + 16_000);
  });

  it("reads retry-after header in seconds", () => {
    const error = { message: "rate_limit_exceeded", headers: { "retry-after": "196" } };
    expect(openAiRetryAfterMs(error)).toBe(196_000);
  });

  it("does not retry request-too-large", () => {
    expect(isRetryableClinicalError(new Error("Request too large for the model"))).toBe(false);
  });

  it("retries AppError with retryAfterMs", () => {
    expect(isRetryableClinicalError(new AppError("Limite de uso da OpenAI atingido.", "clinical_model_failed", 502, 65_000))).toBe(
      true,
    );
  });
});
