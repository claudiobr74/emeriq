import { readFileSync } from "node:fs";
import path from "node:path";
import type { ClinicalGateResult, ClinicalQualityGateReport } from "../clinical-gates";

export interface ComplexGateSpec {
  version: string;
  definedBeforeFirstRun: boolean;
  disclaimer: string;
  thresholds: Record<string, { comparator: ">=" | "<=" | "=="; required: number }>;
}

export const COMPLEX_GATES_PATH = path.join(
  process.cwd(),
  "evaluation/complex-vignettes/v1/GATES.json",
);

export function loadComplexGates(): ComplexGateSpec {
  return JSON.parse(readFileSync(COMPLEX_GATES_PATH, "utf8")) as ComplexGateSpec;
}

function passes(
  actual: number,
  comparator: ">=" | "<=" | "==",
  required: number,
): boolean {
  if (comparator === ">=") return actual >= required;
  if (comparator === "<=") return actual <= required;
  return actual === required;
}

export function evaluateComplexGates(
  metrics: Record<string, number>,
): ClinicalQualityGateReport {
  const spec = loadComplexGates();
  const results: ClinicalGateResult[] = Object.entries(spec.thresholds).map(
    ([name, rule]) => ({
      name,
      actual: metrics[name] ?? 0,
      required: rule.required,
      comparator: rule.comparator,
      pass: passes(metrics[name] ?? 0, rule.comparator, rule.required),
    }),
  );
  return {
    results,
    overall: results.every((item) => item.pass) ? "PASS" : "FAILED",
    disclaimer: spec.disclaimer,
  };
}
