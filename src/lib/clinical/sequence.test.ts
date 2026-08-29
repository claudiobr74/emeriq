import { describe, expect, it } from "vitest";
import { shouldApplySequence } from "@/lib/clinical/sequence";

describe("bloqueio de respostas antigas", () => {
  it("ignores a lower sequence", () => {
    expect(shouldApplySequence(3, 5)).toBe(false);
  });

  it("applies equal or newer sequence", () => {
    expect(shouldApplySequence(5, 5)).toBe(true);
    expect(shouldApplySequence(6, 5)).toBe(true);
  });
});
