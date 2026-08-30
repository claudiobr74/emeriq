import { describe, expect, it } from "vitest";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";
import { clinicalStateSchema } from "@/lib/clinical/schemas";
import { salvageClinicalState, salvageFinalReport } from "@/lib/clinical/parse";
import { clinicalStateJsonSchema } from "@/lib/clinical/json-schema";

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

  it("keeps glasgow alongside glucose in the JSON schema contract", () => {
    const vitals = clinicalStateJsonSchema.properties.vitalSigns.properties;
    expect(vitals).toHaveProperty("glasgow");
    expect(vitals).toHaveProperty("glucose");
    expect(clinicalStateJsonSchema.properties.vitalSigns.required).toContain(
      "glasgow",
    );
  });
});

describe("SOAP Objective from informed vitals", () => {
  it("includes Glasgow and glucose in the Objective fallback when informed", () => {
    const report = salvageFinalReport({
      soap: {},
      vitalSigns: { glasgow: 15, glucose: 92, bloodPressure: "120/80" },
    });
    expect(report.soap.objective).toMatch(/Glasgow 15/);
    expect(report.soap.objective).toMatch(/Glicemia 92/);
    expect(report.soap.objective).toMatch(/PA 120\/80/);
  });

  it("does not invent Glasgow or glucose in the Objective", () => {
    const report = salvageFinalReport({ soap: {} });
    expect(report.soap.objective).not.toMatch(/Glasgow/);
    expect(report.soap.objective).not.toMatch(/Glicemia/);
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
