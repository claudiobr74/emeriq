import { describe, expect, it } from "vitest";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";
import { clinicalStateSchema } from "@/lib/clinical/schemas";
import { salvageClinicalState } from "@/lib/clinical/parse";

describe("ClinicalState schema", () => {
  it("accepts the empty factory", () => {
    const parsed = clinicalStateSchema.parse(createEmptyClinicalState());
    expect(parsed.hypotheses).toEqual([]);
    expect(parsed.systemSafetyTriggers).toEqual([]);
    expect(parsed.testResults).toEqual([]);
  });

  it("accepts suggestedQuestions as strings and objects", () => {
    const empty = createEmptyClinicalState();
    const parsed = clinicalStateSchema.parse({
      ...empty,
      suggestedQuestions: ["Qual o início da dor?", { text: "Há sudorese?", priority: "critical" }],
    });
    expect(parsed.suggestedQuestions[0]?.priority).toBe("high_value");
    expect(parsed.suggestedQuestions[1]?.priority).toBe("critical");
  });
});

describe("correção de fatos no salvage", () => {
  it("uses the later corrected duration when the model sends one value", () => {
    const state = salvageClinicalState({
      historyPresentIllness: { duration: "ontem à noite" },
      reportedFacts: ["Dor começou ontem à noite."],
    });
    expect(state.historyPresentIllness.duration).toBe("ontem à noite");
    expect(state.reportedFacts.join(" ")).not.toMatch(/hoje de manhã/i);
  });
});
