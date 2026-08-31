import { readFileSync } from "node:fs";
import path from "node:path";
import type { ClinicalGateResult, ClinicalQualityGateReport } from "../clinical-gates";

export interface BlindGateThresholds {
  version: string;
  definedBeforeFirstRun: boolean;
  disclaimer: string;
  thresholds: Record<
    string,
    { comparator: ">=" | "<=" | "=="; required: number }
  >;
}

export const BLIND_GATES_PATH = path.join(process.cwd(), "evaluation/blind/BLIND_GATES.json");

export function loadBlindGates(): BlindGateThresholds {
  return JSON.parse(readFileSync(BLIND_GATES_PATH, "utf8")) as BlindGateThresholds;
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

export function evaluateBlindGates(metrics: Record<string, number>): ClinicalQualityGateReport {
  const spec = loadBlindGates();
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
