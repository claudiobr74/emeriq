import { collectSafetyTriggers, hasCriticalSafetySignal } from "@/lib/clinical/safety/rules";
import type { SafetyEvaluationInput, SafetyTrigger } from "@/lib/clinical/safety/types";

export function evaluateSafety(input: SafetyEvaluationInput): SafetyTrigger[] {
  try {
    return collectSafetyTriggers(input);
  } catch {
    return [];
  }
}

export { applySafetyToClinicalState, alertsFromSafetyTriggers } from "@/lib/clinical/safety/apply";

export function shouldForceClinicalReevaluation(
  input: SafetyEvaluationInput,
): boolean {
  return hasCriticalSafetySignal(evaluateSafety(input));
}

export type { SafetyEvaluationInput, SafetyPriority, SafetyTrigger } from "@/lib/clinical/safety/types";
export { SAFETY_THRESHOLDS } from "@/lib/clinical/safety/thresholds";
export { hasCriticalSafetySignal, parseSystolic } from "@/lib/clinical/safety/rules";
export { reevaluationHintForTrigger } from "@/lib/clinical/safety/hints";
