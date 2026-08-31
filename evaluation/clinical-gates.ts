export const HALLUCINATION_CATEGORIES = [
  "invented_vital",
  "invented_exam",
  "invented_medication",
  "invented_history",
  "invented_negative",
  "invented_positive",
  "invented_procedure",
  "invented_diagnosis_as_confirmed",
  "other",
] as const;

export type HallucinationCategory = (typeof HALLUCINATION_CATEGORIES)[number];
export type HallucinationSeverity = "critical" | "major" | "minor";
export type FailSeverity = "CRITICAL_FAIL" | "MAJOR_FAIL" | "MINOR_FAIL";

export interface HallucinationEvent {
  category: HallucinationCategory;
  severity: HallucinationSeverity;
  detail: string;
}

export const CLINICAL_GATE_THRESHOLDS = {
  criticalDiagnosisRecall: 0.95,
  soapFidelity: 0.95,
  hallucinationRate: 0.05,
  unsupportedGroundingRate: 0,
  criticalUnsafeRecommendations: 0,
  criticalFails: 0,
  criticalHallucinations: 0,
} as const;

export interface ClinicalGateResult {
  name: string;
  actual: number;
  required: number;
  comparator: ">=" | "<=" | "==";
  pass: boolean;
}

export interface ClinicalQualityGateReport {
  results: ClinicalGateResult[];
  overall: "PASS" | "FAILED";
  disclaimer: string;
}

function gate(
  name: string,
  actual: number,
  required: number,
  comparator: ClinicalGateResult["comparator"],
): ClinicalGateResult {
  const pass =
    comparator === ">="
      ? actual >= required
      : comparator === "<="
        ? actual <= required
        : actual === required;
  return { name, actual, required, comparator, pass };
}

export function evaluateClinicalGates(input: {
  criticalDiagnosisRecall: number;
  soapFidelity: number;
  hallucinationRate: number;
  unsupportedGroundingRate: number;
  criticalUnsafeRecommendations: number;
  criticalFails: number;
  criticalHallucinations: number;
}): ClinicalQualityGateReport {
  const results = [
    gate(
      "criticalDiagnosisRecall",
      input.criticalDiagnosisRecall,
      CLINICAL_GATE_THRESHOLDS.criticalDiagnosisRecall,
      ">=",
    ),
    gate("soapFidelity", input.soapFidelity, CLINICAL_GATE_THRESHOLDS.soapFidelity, ">="),
    gate(
      "hallucinationRate",
      input.hallucinationRate,
      CLINICAL_GATE_THRESHOLDS.hallucinationRate,
      "<=",
    ),
    gate(
      "unsupportedGroundingRate",
      input.unsupportedGroundingRate,
      CLINICAL_GATE_THRESHOLDS.unsupportedGroundingRate,
      "==",
    ),
    gate(
      "criticalUnsafeRecommendations",
      input.criticalUnsafeRecommendations,
      CLINICAL_GATE_THRESHOLDS.criticalUnsafeRecommendations,
      "==",
    ),
    gate("criticalFails", input.criticalFails, CLINICAL_GATE_THRESHOLDS.criticalFails, "=="),
    gate(
      "criticalHallucinations",
      input.criticalHallucinations,
      CLINICAL_GATE_THRESHOLDS.criticalHallucinations,
      "==",
    ),
  ];
  return {
    results,
    overall: results.every((item) => item.pass) ? "PASS" : "FAILED",
    disclaimer:
      "INTERNAL ENGINEERING GATES. Não são validação clínica, certificação, aprovação regulatória nem evidência de uso seguro em pacientes.",
  };
}

export function formatClinicalGateReport(report: ClinicalQualityGateReport): string {
  const lines = [
    "CLINICAL QUALITY GATE",
    report.disclaimer,
    "",
    ...report.results.map((item) => {
      const actualPct =
        item.name.toLowerCase().includes("rate") || item.name.toLowerCase().includes("recall") || item.name.toLowerCase().includes("fidelity")
          ? `${Math.round(item.actual * 1000) / 10}%`
          : String(item.actual);
      const requiredLabel =
        item.comparator === ">="
          ? `>= ${item.required}`
          : item.comparator === "<="
            ? `<= ${item.required}`
            : `== ${item.required}`;
      return `${item.name}:\n${actualPct}\nRequired:\n${requiredLabel}\n${item.pass ? "PASS" : "FAILED"}`;
    }),
    "",
    "OVERALL:",
    report.overall,
  ];
  return lines.join("\n");
}
