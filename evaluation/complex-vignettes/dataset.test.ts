import { describe, expect, it } from "vitest";
import { createEmptyClinicalState } from "../../src/lib/clinical/clinical-state";
import type { FinalClinicalReport } from "../../src/lib/clinical/schemas";
import { CLINICAL_CASES } from "../cases";
import { evaluateComplexGates, loadComplexGates } from "./gates";
import { hashComplexCases } from "./hash";
import { isComplexCriticalLabel, scoreComplexCase } from "./scorer";
import { ECCV_V1_CASES, eccvDatasetStats } from "./v1";

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

describe("ECCV-1 dataset", () => {
  it("has 60 unique cases in the intended buckets", () => {
    const stats = eccvDatasetStats();
    expect(ECCV_V1_CASES).toHaveLength(60);
    expect(new Set(ECCV_V1_CASES.map((item) => item.id)).size).toBe(60);
    expect(stats.byDifficulty).toEqual({ moderate: 10, hard: 30, very_hard: 20 });
    expect(stats.byDomain.cardiovascular).toBe(10);
    expect(stats.byDomain.neurologic).toBe(8);
    expect(stats.meanVariableCount).toBeGreaterThanOrEqual(18);
    expect(stats.complexityAtLeast8).toBeGreaterThanOrEqual(20);
    expect(stats.overtriageTest).toBeGreaterThanOrEqual(15);
    expect(stats.undertriageTest).toBeGreaterThanOrEqual(15);
    expect(stats.correctionCases).toBeGreaterThanOrEqual(10);
    expect(stats.lateRevealCases).toBeGreaterThanOrEqual(30);
  });

  it("does not reuse development-set case ids", () => {
    const devIds = new Set(CLINICAL_CASES.map((item) => item.id));
    for (const item of ECCV_V1_CASES) {
      expect(devIds.has(item.id)).toBe(false);
    }
    expect(ECCV_V1_CASES.some((item) => item.id === "chest-pain-01")).toBe(false);
  });

  it("hash is stable", () => {
    expect(hashComplexCases(ECCV_V1_CASES)).toBe(hashComplexCases(ECCV_V1_CASES));
    expect(hashComplexCases(ECCV_V1_CASES)).toHaveLength(64);
  });

  it("gates are defined before any run", () => {
    const spec = loadComplexGates();
    expect(spec.definedBeforeFirstRun).toBe(true);
    expect(spec.thresholds.criticalDiagnosisRecall.required).toBe(0.95);
    expect(spec.thresholds.complexIntegration.required).toBe(0.85);
    expect(spec.thresholds.overtriageRate.required).toBe(0.1);
    expect(spec.thresholds.undertriageRate.required).toBe(0);
  });

  it("does not treat vague cardiac wording as SCA", () => {
    expect(isComplexCriticalLabel("problema cardíaco")).toBe(false);
    expect(isComplexCriticalLabel("síndrome coronariana aguda")).toBe(true);
    expect(isComplexCriticalLabel("hemorragia subaracnóidea")).toBe(true);
  });

  it("flags unjustified dissection on an overtriage case", () => {
    const testCase = ECCV_V1_CASES.find((item) => item.id === "ecc-cv-10");
    expect(testCase).toBeTruthy();
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
    const scored = scoreComplexCase({
      case: testCase!,
      transcript: testCase!.segments.map((item) => item.text).join(" "),
      state,
      report: emptySoap,
    });
    expect(scored.overtriage).toBe(true);
    expect(scored.unjustifiedCriticalCount).toBeGreaterThan(0);
  });

  it("fails the complex gate on undertriage", () => {
    const report = evaluateComplexGates({
      criticalDiagnosisRecall: 1,
      criticalPrecision: 1,
      criticalFails: 0,
      criticalHallucinations: 0,
      unsafeRecommendations: 0,
      casesWithFabricationRate: 0,
      soapFidelity: 1,
      overtriageRate: 0,
      undertriageRate: 0.1,
      complexIntegration: 1,
      temporalUpdate: 1,
      distractorResistance: 1,
      prematureClosureRate: 0,
      anchoringErrorRate: 0,
      lateInformationIntegration: 1,
      correctionHandling: 1,
    });
    expect(report.overall).toBe("FAILED");
  });
});
