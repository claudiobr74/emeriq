import {
  loadProtocol,
  type ProtocolDocument,
  type ProtocolId,
} from "@/clinical-knowledge/registry";
import type { SafetyTrigger } from "@/lib/clinical/safety";
import type { ClinicalState } from "@/lib/clinical/schemas";
import { foldPt, includesFoldedToken } from "@/lib/clinical/text";

interface RouteRule {
  id: ProtocolId;
  terms: string[];
  triggers: string[];
}

const ROUTES: RouteRule[] = [
  {
    id: "chest-pain",
    terms: ["dor toracica", "dor no peito", "precordial", "sca", "infarto"],
    triggers: ["high_risk_chest_pain", "chest_pain_isolated"],
  },
  {
    id: "stroke",
    terms: [
      "avc",
      "deficit",
      "afasia",
      "hemiparesia",
      "desvio de rima",
      "cefaleia em trovoada",
      "pior dor de cabeca",
      "hemorragia subaracnoidea",
    ],
    triggers: ["acute_neuro_deficit", "thunderclap_headache"],
  },
  {
    id: "sepsis",
    terms: ["sepse", "febre", "infeccao", "choque septico"],
    triggers: ["sepsis_shock"],
  },
  {
    id: "anaphylaxis",
    terms: ["anafilaxia", "urticaria", "angioedema", "ferroada"],
    triggers: ["anaphylaxis"],
  },
  {
    id: "asthma-copd",
    terms: ["asma", "dpoc", "sibilo", "chiado"],
    triggers: ["hypoxemia"],
  },
  {
    id: "abdominal-pain",
    terms: [
      "dor abdominal",
      "dor na barriga",
      "abdome",
      "hematemese",
      "borra de cafe",
      "vomito com sangue",
      "hemorragia digestiva",
    ],
    triggers: ["gi_bleeding"],
  },
  {
    id: "trauma",
    terms: [
      "trauma",
      "atropelamento",
      "queda de altura",
      "queda de escada",
      "bateu a cabeca",
      "moto",
      "murmurio diminuido",
      "trauma toracico",
      "tce",
    ],
    triggers: ["trauma_hemorrhage", "head_trauma_high_risk", "chest_trauma_respiratory"],
  },
  {
    id: "intoxication",
    terms: [
      "intoxicacao",
      "overdose",
      "comprimidos",
      "substancia desconhecida",
      "pupilas mioticas",
      "frascos",
    ],
    triggers: ["intoxication"],
  },
  {
    id: "hypertensive-emergency",
    terms: ["pressao muito alta", "crise hipertensiva"],
    triggers: ["hypertensive_emergency"],
  },
  {
    id: "obstetric-emergencies",
    terms: ["gestante", "gravida", "gestacao", "ectopica"],
    triggers: ["obstetric_pain_bleeding"],
  },
  {
    id: "altered-mental-status",
    terms: ["rebaixamento", "inconsciente", "confuso"],
    triggers: ["altered_mental_status", "hypoglycemia"],
  },
  {
    id: "seizure",
    terms: ["convulsao", "crise convulsiva"],
    triggers: ["seizure"],
  },
];

export function selectRelevantProtocols(
  state: ClinicalState,
  transcript: string,
  triggers: SafetyTrigger[],
  limit = 3,
): ProtocolDocument[] {
  try {
    const blob = foldPt(
      [
        transcript,
        state.chiefComplaint ?? "",
        ...state.hypotheses.map((item) => item.diagnosis),
        ...state.dangerousDifferentials.map((item) => item.diagnosis),
        ...triggers.map((item) => item.trigger),
      ].join(" "),
    );
    const triggerSet = new Set(triggers.map((item) => item.trigger));
    const scored = ROUTES.map((route) => {
      let score = 0;
      for (const term of route.terms) {
        const foldedTerm = foldPt(term);
        const hits =
          foldedTerm.length <= 4
            ? includesFoldedToken(blob, term)
            : blob.includes(foldedTerm);
        if (hits) score += 2;
      }
      for (const trigger of route.triggers) {
        if (triggerSet.has(trigger)) score += 3;
      }
      return { id: route.id, score };
    })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored
      .map((item) => loadProtocol(item.id))
      .filter((item): item is ProtocolDocument => Boolean(item));
  } catch {
    return [];
  }
}

export function formatProtocolContext(docs: ProtocolDocument[]): string {
  if (docs.length === 0) return "";
  return docs
    .map((doc) => `### ${doc.title}\n${doc.content}`)
    .join("\n\n")
    .slice(0, 6000);
}
