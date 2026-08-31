import { describe, expect, it } from "vitest";
import { evaluateClinicalGates, formatClinicalGateReport } from "./clinical-gates";

describe("clinical quality gates", () => {
  it("fails when critical recall is below 95%", () => {
    const report = evaluateClinicalGates({
      criticalDiagnosisRecall: 0.8,
      soapFidelity: 1,
      hallucinationRate: 0,
      unsupportedGroundingRate: 0,
      criticalUnsafeRecommendations: 0,
      criticalFails: 0,
      criticalHallucinations: 0,
    });
    expect(report.overall).toBe("FAILED");
    expect(formatClinicalGateReport(report)).toMatch(/FAILED/);
  });

  it("passes internal engineering thresholds", () => {
    const report = evaluateClinicalGates({
      criticalDiagnosisRecall: 0.96,
      soapFidelity: 1,
      hallucinationRate: 0.03,
      unsupportedGroundingRate: 0,
      criticalUnsafeRecommendations: 0,
      criticalFails: 0,
      criticalHallucinations: 0,
    });
    expect(report.overall).toBe("PASS");
  });

  it("fails on any critical hallucination", () => {
    const report = evaluateClinicalGates({
      criticalDiagnosisRecall: 1,
      soapFidelity: 1,
      hallucinationRate: 0,
      unsupportedGroundingRate: 0,
      criticalUnsafeRecommendations: 0,
      criticalFails: 0,
      criticalHallucinations: 1,
    });
    expect(report.overall).toBe("FAILED");
  });
});
