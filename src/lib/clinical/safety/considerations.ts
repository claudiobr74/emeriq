import type { ClinicalHypothesis } from "@/lib/clinical/schemas";
import type { SafetyTrigger } from "@/lib/clinical/safety/types";
import { diagnosesMatch } from "@/lib/clinical/provenance/aliases";

export interface SafetyMandatoryConsideration {
  conditionFamily: string;
  label: string;
  reason: string;
  severity: "critical" | "high";
}

const BY_TRIGGER: Record<string, SafetyMandatoryConsideration[]> = {
  high_risk_chest_pain: [
    {
      conditionFamily: "acute_coronary_syndrome",
      label: "síndrome coronariana aguda",
      reason: "Dor torácica de alto risco. Manter SCA visível; não confirmar.",
      severity: "critical",
    },
  ],
  acute_neuro_deficit: [
    {
      conditionFamily: "acute_cerebrovascular_event",
      label: "AVC",
      reason: "Déficit neurológico agudo. Considerar evento cerebrovascular; não diagnosticar.",
      severity: "critical",
    },
  ],
  thunderclap_headache: [
    {
      conditionFamily: "subarachnoid_hemorrhage",
      label: "hemorragia subaracnóidea",
      reason: "Cefaleia hiperaguda. Considerar HSA; não confirmar.",
      severity: "high",
    },
  ],
  major_bleeding: [
    {
      conditionFamily: "major_hemorrhage",
      label: "choque hemorrágico",
      reason: "Sangramento importante. Reavalie hemorragia e instabilidade; não confirmar o sítio.",
      severity: "critical",
    },
  ],
  gi_bleeding: [
    {
      conditionFamily: "gastrointestinal_hemorrhage",
      label: "hemorragia digestiva",
      reason: "Sangramento digestivo sugerido. Deve permanecer entre os diferenciais graves.",
      severity: "critical",
    },
  ],
  head_trauma_high_risk: [
    {
      conditionFamily: "traumatic_brain_injury",
      label: "TCE",
      reason: "Trauma craniano com fator de gravidade. Considerar TCE; não confirmar.",
      severity: "critical",
    },
    {
      conditionFamily: "intracranial_hemorrhage",
      label: "hemorragia intracraniana",
      reason: "TCE de risco (LOC, confusão ou anticoagulante). Considerar HIC; não confirmar.",
      severity: "critical",
    },
  ],
  chest_trauma_respiratory: [
    {
      conditionFamily: "pneumothorax",
      label: "pneumotórax",
      reason: "Trauma torácico com compromisso respiratório. Considerar pneumotórax; não confirmar.",
      severity: "critical",
    },
  ],
  intoxication: [
    {
      conditionFamily: "intoxication",
      label: "intoxicação",
      reason: "Exposição tóxica possível. Manter intoxicação visível.",
      severity: "high",
    },
  ],
  sepsis_shock: [
    {
      conditionFamily: "sepsis",
      label: "sepse",
      reason: "Infecção com instabilidade. Considerar sepse/choque séptico; não confirmar.",
      severity: "critical",
    },
  ],
  anaphylaxis: [
    {
      conditionFamily: "anaphylaxis",
      label: "anafilaxia",
      reason: "Reação grave possível. Considerar anafilaxia; não confirmar.",
      severity: "critical",
    },
  ],
  hypoglycemia: [
    {
      conditionFamily: "hypoglycemia",
      label: "hipoglicemia",
      reason: "Glicemia baixa explícita ou AMS em diabético. Considerar hipoglicemia.",
      severity: "critical",
    },
  ],
};

export function mandatoryConsiderationsFromTriggers(
  triggers: SafetyTrigger[],
): SafetyMandatoryConsideration[] {
  const seen = new Set<string>();
  const items: SafetyMandatoryConsideration[] = [];
  const push = (item: SafetyMandatoryConsideration) => {
    if (seen.has(item.conditionFamily)) return;
    seen.add(item.conditionFamily);
    items.push(item);
  };

  for (const trigger of triggers) {
    for (const item of BY_TRIGGER[trigger.trigger] ?? []) {
      push(item);
    }
    if (
      trigger.trigger === "high_risk_chest_pain" &&
      trigger.matchedTerms.some((term) => term.includes("dorso") || term.includes("rasgo") || term.includes("irradiacao"))
    ) {
      push({
        conditionFamily: "aortic_dissection",
        label: "dissecção aórtica",
        reason: "Dor torácica com irradiação dorsal ou caráter em rasgo. Manter dissecção visível; não confirmar.",
        severity: "critical",
      });
    }
  }
  return items;
}

export function formatMandatoryConsiderations(
  items: SafetyMandatoryConsideration[],
): string {
  if (items.length === 0) return "";
  return items
    .map(
      (item) =>
        `- ${item.label} [${item.severity}] (${item.conditionFamily}): ${item.reason}`,
    )
    .join("\n");
}

export function asSafetyHypothesis(
  item: SafetyMandatoryConsideration,
): ClinicalHypothesis {
  return {
    diagnosis: item.label,
    priority: item.severity === "critical" ? "high" : "medium",
    supportingFindings: [item.reason],
    opposingFindings: [],
    rationale: `[safety] ${item.reason}`,
  };
}

export function mergeMandatoryDifferentials(
  current: ClinicalHypothesis[],
  items: SafetyMandatoryConsideration[],
): ClinicalHypothesis[] {
  const next = [...current];
  for (const item of items) {
    const exists = next.some((candidate) =>
      diagnosesMatch(candidate.diagnosis, item.label),
    );
    if (!exists) next.unshift(asSafetyHypothesis(item));
  }
  return next.slice(0, 3);
}

export function isSafetyPinned(hypothesis: ClinicalHypothesis): boolean {
  return (hypothesis.rationale ?? "").startsWith("[safety]");
}
