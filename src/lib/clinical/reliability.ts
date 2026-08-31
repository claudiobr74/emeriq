import {
  extractKeyPresence,
  filterInferredNegatives,
  type KeyPresence,
} from "@/lib/clinical/presence";
import type { ClinicalState, SuggestedQuestion } from "@/lib/clinical/schemas";
import {
  mandatoryConsiderationsFromTriggers,
  mergeMandatoryDifferentials,
} from "@/lib/clinical/safety/considerations";
import type { SafetyTrigger } from "@/lib/clinical/safety/types";
import { CLINICAL_STATE_VERSION } from "@/lib/clinical/versions";

function ensureQuestion(
  questions: SuggestedQuestion[],
  text: string,
  priority: SuggestedQuestion["priority"],
): SuggestedQuestion[] {
  const folded = text.toLocaleLowerCase("pt-BR");
  if (questions.some((item) => item.text.toLocaleLowerCase("pt-BR").includes(folded.slice(0, 12)))) {
    return questions;
  }
  return [...questions, { text, priority }].slice(0, 5);
}

function questionsForUnknown(
  presence: KeyPresence,
  triggers: SafetyTrigger[],
  questions: SuggestedQuestion[],
): SuggestedQuestion[] {
  let next = questions;
  const names = new Set(triggers.map((item) => item.trigger));
  if (presence.anticoagulantUse === "unknown" && names.has("head_trauma_high_risk")) {
    next = ensureQuestion(next, "Faz uso de anticoagulantes?", "critical");
  }
  if (presence.dyspnea === "unknown" && (names.has("high_risk_chest_pain") || names.has("chest_pain_isolated"))) {
    next = ensureQuestion(next, "Há dispneia?", "high_value");
  }
  if (
    presence.focalDeficit === "unknown" &&
    names.has("altered_mental_status") &&
    !names.has("acute_neuro_deficit")
  ) {
    next = ensureQuestion(next, "Há déficit neurológico focal?", "high_value");
  }
  return next.slice(0, 5);
}

export function applyReliabilityLayer(
  state: ClinicalState,
  transcript: string,
  triggers: SafetyTrigger[],
): ClinicalState {
  const presence = extractKeyPresence(transcript);
  const considerations = mandatoryConsiderationsFromTriggers(triggers);
  return {
    ...state,
    schemaVersion: CLINICAL_STATE_VERSION,
    keyPresence: presence,
    negativeFindings: filterInferredNegatives(transcript, state.negativeFindings),
    dangerousDifferentials: mergeMandatoryDifferentials(
      state.dangerousDifferentials,
      considerations,
    ),
    suggestedQuestions: questionsForUnknown(presence, triggers, state.suggestedQuestions),
  };
}
