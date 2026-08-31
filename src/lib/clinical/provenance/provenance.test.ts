import { describe, expect, it } from "vitest";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";
import { diagnosesMatch } from "@/lib/clinical/provenance/aliases";
import { stabilizeClinicalState } from "@/lib/clinical/provenance/stabilize";
import { validateAndSanitizeSoap } from "@/lib/clinical/provenance/validator";

describe("SOAP provenance", () => {
  it("strips SpO2 invented in the objective", () => {
    const state = createEmptyClinicalState();
    const { flags, report } = validateAndSanitizeSoap(
      {
        soap: {
          subjective: "Dor no peito.",
          objective: "SpO2 95%. Exame não informado.",
          assessment: "Hipótese de SCA.",
          plan: "Considerar ECG.",
        },
        hypotheses: [],
        dangerousDifferentials: [],
        suggestedTests: [],
        possibleTreatments: [],
        unresolvedQuestions: [],
        alerts: [],
      },
      { transcript: "Dor no peito. Nenhuma saturação foi medida.", state },
    );
    expect(flags.some((item) => item.code === "vital_not_in_source")).toBe(true);
    expect(report.soap.objective).not.toMatch(/95/);
  });

  it("flags intervention recorded as performed", () => {
    const { flags, report } = validateAndSanitizeSoap(
      {
        soap: {
          subjective: "Dor.",
          objective: "ECG realizado.",
          assessment: "Aguardando.",
          plan: "ECG realizado.",
        },
        hypotheses: [],
        dangerousDifferentials: [],
        suggestedTests: [{ item: "ECG", rationale: "dor torácica", priority: "urgent" }],
        possibleTreatments: [],
        unresolvedQuestions: [],
        alerts: [],
      },
      { transcript: "Dor no peito. Médico pediu para considerar ECG.", state: createEmptyClinicalState() },
    );
    expect(flags.some((item) => item.code === "intervention_as_performed")).toBe(true);
    expect(report.soap.objective.toLowerCase()).not.toContain("ecg realizado");
  });
});

describe("hypothesis stability and aliases", () => {
  it("treats SCA and IAM as the same grouping", () => {
    expect(diagnosesMatch("SCA", "IAM")).toBe(true);
    expect(diagnosesMatch("síndrome coronariana aguda", "infarto")).toBe(true);
  });

  it("does not treat SCA as aortic dissection", () => {
    expect(diagnosesMatch("SCA", "dissecção aórtica")).toBe(false);
  });

  it("keeps a dangerous differential that the next update omitted", () => {
    const previous = createEmptyClinicalState();
    previous.dangerousDifferentials = [
      {
        diagnosis: "Dissecção aórtica",
        priority: "high",
        supportingFindings: ["dor em rasgo"],
        opposingFindings: [],
        rationale: null,
      },
    ];
    const incoming = createEmptyClinicalState();
    incoming.hypotheses = [
      {
        diagnosis: "SCA",
        priority: "high",
        supportingFindings: [],
        opposingFindings: [],
        rationale: null,
      },
    ];
    const stable = stabilizeClinicalState(previous, incoming);
    expect(stable.dangerousDifferentials.some((item) => /dissec/i.test(item.diagnosis))).toBe(
      true,
    );
  });
});
