import { diagnosesMatch } from "@/lib/clinical/provenance/aliases";
import type { ClinicalHypothesis, ClinicalState } from "@/lib/clinical/schemas";

function rank(priority: ClinicalHypothesis["priority"]): number {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

export function dedupeHypotheses(
  items: ClinicalHypothesis[],
  max: number,
): ClinicalHypothesis[] {
  const kept: ClinicalHypothesis[] = [];
  for (const item of items) {
    const existing = kept.find((candidate) =>
      diagnosesMatch(candidate.diagnosis, item.diagnosis),
    );
    if (!existing) {
      kept.push(item);
      continue;
    }
    if (rank(item.priority) > rank(existing.priority)) {
      const index = kept.indexOf(existing);
      kept[index] = item;
    }
  }
  return kept.slice(0, max);
}

function mergeDangerous(
  previous: ClinicalHypothesis[],
  incoming: ClinicalHypothesis[],
): ClinicalHypothesis[] {
  const merged = dedupeHypotheses([...incoming, ...previous], 8);
  return merged.filter((item) => {
    const update = incoming.find((candidate) =>
      diagnosesMatch(candidate.diagnosis, item.diagnosis),
    );
    if (!update) return true;
    return update.opposingFindings.length < 3;
  }).slice(0, 3);
}

export function stabilizeClinicalState(
  previous: ClinicalState,
  incoming: ClinicalState,
): ClinicalState {
  return {
    ...incoming,
    hypotheses: dedupeHypotheses(incoming.hypotheses, 5),
    dangerousDifferentials: mergeDangerous(
      previous.dangerousDifferentials,
      incoming.dangerousDifferentials,
    ),
    suggestedQuestions: incoming.suggestedQuestions.slice(0, 5),
    suggestedTests: incoming.suggestedTests.slice(0, 6),
    possibleTreatments: incoming.possibleTreatments.slice(0, 6),
    alerts: incoming.alerts.slice(0, 5),
  };
}
