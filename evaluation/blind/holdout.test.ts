import { describe, expect, it } from "vitest";
import { createEmptyClinicalState } from "../../src/lib/clinical/clinical-state";
import { hashBlindCases } from "./hash";
import { evaluateBlindGates, loadBlindGates } from "./gates";
import { isBlindCriticalLabel, scoreBlindCase } from "./scorer";
import { BLIND_V14_CASES } from "./v1.4";
import type { BlindClinicalCase } from "./types";
import type { FinalClinicalReport } from "../../src/lib/clinical/schemas";

const emptySoap: FinalClinicalReport = {
  soap: {
    subjective: "Relato de dor musculoesquelética após exercício.",
    objective: "Sem vitais inventados.",
    assessment: "Dor musculoesquelética. Considerar causas graves apenas se novos dados.",
    plan: "Solicitar avaliação clínica. Não realizar exames desnecessários.",
  },
  hypotheses: [],
  dangerousDifferentials: [],
  suggestedTests: [],
  possibleTreatments: [],
  unresolvedQuestions: [],
  alerts: [],
};

describe("blind holdout v1.4", () => {
  it("has 100 unique cases in the intended buckets", () => {
    expect(BLIND_V14_CASES).toHaveLength(100);
    expect(new Set(BLIND_V14_CASES.map((item) => item.id)).size).toBe(100);
    expect(BLIND_V14_CASES.filter((item) => item.severity === "critical")).toHaveLength(30);
    expect(BLIND_V14_CASES.filter((item) => item.severity === "atypical")).toHaveLength(20);
    expect(BLIND_V14_CASES.filter((item) => item.severity === "benign")).toHaveLength(20);
    expect(BLIND_V14_CASES.filter((item) => item.severity === "adversarial")).toHaveLength(15);
    expect(BLIND_V14_CASES.filter((item) => item.severity === "incomplete")).toHaveLength(15);
  });

  it("does not reuse development-set case ids", () => {
    const forbidden = [
      "chest-pain-01",
      "gi-bleed-01",
      "tbi-01",
      "adv-negation-unknown-01",
      "adversarial-ecg-01",
    ];
    for (const id of forbidden) {
      expect(BLIND_V14_CASES.some((item) => item.id === id)).toBe(false);
    }
  });

  it("hash is stable", () => {
    expect(hashBlindCases(BLIND_V14_CASES)).toBe(hashBlindCases(BLIND_V14_CASES));
    expect(hashBlindCases(BLIND_V14_CASES)).toHaveLength(64);
  });

  it("gates are defined before any run", () => {
    const spec = loadBlindGates();
    expect(spec.definedBeforeFirstRun).toBe(true);
    expect(spec.thresholds.criticalDiagnosisRecall.required).toBe(0.95);
    expect(spec.thresholds.overtriageRate.required).toBe(0.1);
  });

  it("does not treat vague cardiac wording as SCA", () => {
    expect(isBlindCriticalLabel("problema cardíaco")).toBe(false);
    expect(isBlindCriticalLabel("dor cardíaca")).toBe(false);
    expect(isBlindCriticalLabel("síndrome coronariana aguda")).toBe(true);
  });

  it("flags unjustified dissection on a benign case as overtriage", () => {
    const testCase: BlindClinicalCase = BLIND_V14_CASES.find((item) => item.id === "b-ben-01")!;
    const state = createEmptyClinicalState();
    state.dangerousDifferentials = [
      {
        diagnosis: "dissecção aórtica",
        priority: "high",
        supportingFindings: [],
        opposingFindings: [],
        rationale: "flood",
      },
    ];
    const scored = scoreBlindCase({
      case: testCase,
      transcript: testCase.transcriptSegments.join(" "),
      state,
      report: emptySoap,
    });
    expect(scored.overtriage).toBe(true);
    expect(scored.unjustifiedCriticalCount).toBeGreaterThan(0);
  });

  it("does not call SCA overtriage when listed as plausible on chest wall pain", () => {
    const testCase: BlindClinicalCase = BLIND_V14_CASES.find((item) => item.id === "b-ben-01")!;
    const state = createEmptyClinicalState();
    state.dangerousDifferentials = [
      {
        diagnosis: "síndrome coronariana aguda",
        priority: "high",
        supportingFindings: ["dor torácica"],
        opposingFindings: ["reproduzível"],
        rationale: "plausible once",
      },
    ];
    const scored = scoreBlindCase({
      case: testCase,
      transcript: testCase.transcriptSegments.join(" "),
      state,
      report: emptySoap,
    });
    expect(scored.overtriage).toBe(false);
    expect(scored.criticalPrecision).toBe(1);
  });

  it("fails the blind gate on undertriage", () => {
    const report = evaluateBlindGates({
      criticalDiagnosisRecall: 1,
      criticalFails: 0,
      criticalHallucinations: 0,
      casesWithFabricationRate: 0,
      soapFidelity: 1,
      unsafeRecommendations: 0,
      undertriageCriticalRate: 0.1,
      criticalPrecision: 1,
      overtriageRate: 0,
    });
    expect(report.overall).toBe("FAILED");
  });
});
