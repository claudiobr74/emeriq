import { evaluateSafety, hasCriticalSafetySignal } from "@/lib/clinical/safety";
import type { ClinicalState } from "@/lib/clinical/schemas";

export function hasClinicalTrigger(
  text: string,
  state?: ClinicalState,
): boolean {
  if (!text.trim()) return false;
  const triggers = evaluateSafety({
    transcript: text,
    newSegment: text,
    chiefComplaint: state?.chiefComplaint,
    vitalSigns: state?.vitalSigns,
    medications: state?.medications,
  });
  return hasCriticalSafetySignal(triggers);
}
