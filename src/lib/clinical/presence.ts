import { foldPt } from "@/lib/clinical/text";

export type ClinicalPresence = "positive" | "negative_explicit" | "unknown";

export interface KeyPresence {
  dyspnea: ClinicalPresence;
  syncope: ClinicalPresence;
  focalDeficit: ClinicalPresence;
  fever: ClinicalPresence;
  bleeding: ClinicalPresence;
  seizure: ClinicalPresence;
  trauma: ClinicalPresence;
  pregnancy: ClinicalPresence;
  anticoagulantUse: ClinicalPresence;
  alteredConsciousness: ClinicalPresence;
}

export const UNKNOWN_PRESENCE: KeyPresence = {
  dyspnea: "unknown",
  syncope: "unknown",
  focalDeficit: "unknown",
  fever: "unknown",
  bleeding: "unknown",
  seizure: "unknown",
  trauma: "unknown",
  pregnancy: "unknown",
  anticoagulantUse: "unknown",
  alteredConsciousness: "unknown",
};

interface PresenceSpec {
  key: keyof KeyPresence;
  positive: string[];
  negative: string[];
}

const SPECS: PresenceSpec[] = [
  {
    key: "dyspnea",
    positive: ["dispneia", "falta de ar", "dificuldade para respirar"],
    negative: ["nega dispneia", "nega falta de ar", "sem dispneia", "sem falta de ar"],
  },
  {
    key: "syncope",
    positive: ["sincope", "desmaiou", "desmaio", "perdeu os sentidos"],
    negative: ["nega sincope", "nega desmaio", "sem sincope"],
  },
  {
    key: "focalDeficit",
    positive: [
      "deficit focal",
      "fraqueza unilateral",
      "boca torta",
      "desvio de rima",
      "hemiparesia",
      "nao consegue falar",
    ],
    negative: ["nega deficit", "sem deficit focal", "sem deficit neurologico"],
  },
  {
    key: "fever",
    positive: ["febre", "febril", "hipertermia"],
    negative: ["nega febre", "sem febre", "afebril"],
  },
  {
    key: "bleeding",
    positive: [
      "sangramento",
      "hemorragia",
      "hematemese",
      "borra de cafe",
      "vomito com sangue",
      "melena",
      "sangue vivo",
    ],
    negative: ["nega sangramento", "sem sangramento", "nega hematemese"],
  },
  {
    key: "seizure",
    positive: ["convulsao", "convulsionou", "crise convulsiva"],
    negative: ["nega convulsao", "sem convulsao"],
  },
  {
    key: "trauma",
    positive: [
      "trauma",
      "acidente",
      "bateu a cabeca",
      "queda de escada",
      "atropelamento",
    ],
    negative: ["nega trauma", "sem trauma"],
  },
  {
    key: "pregnancy",
    positive: ["gestante", "gestacao", "gravida", "gravidez"],
    negative: ["nega gestacao", "nao esta gravida"],
  },
  {
    key: "anticoagulantUse",
    positive: ["varfarina", "anticoagulante", "rivaroxabana", "apixabana", "marevan"],
    negative: ["nega anticoagulante", "nao usa anticoagulante", "nao uso nenhum medicamento"],
  },
  {
    key: "alteredConsciousness",
    positive: ["confuso", "rebaixamento", "sonolento", "nao responde", "glasgow"],
    negative: ["nega rebaixamento", "consciente e orientado"],
  },
];

function contains(folded: string, term: string): boolean {
  return folded.includes(foldPt(term));
}

/**
 * Tri-state a partir do texto. Ausência de menção = unknown.
 * Nunca promove unknown a negative_explicit.
 */
export function extractKeyPresence(transcript: string): KeyPresence {
  let folded = foldPt(transcript);
  const presence: KeyPresence = { ...UNKNOWN_PRESENCE };
  for (const spec of SPECS) {
    const matchedNeg = spec.negative.filter((term) => contains(folded, term));
    if (matchedNeg.length > 0) {
      presence[spec.key] = "negative_explicit";
      for (const term of matchedNeg) {
        folded = folded.replaceAll(foldPt(term), " ");
      }
      continue;
    }
    if (spec.positive.some((term) => contains(folded, term))) {
      presence[spec.key] = "positive";
    }
  }
  return presence;
}

const INVENTED_NEGATIVE_PATTERNS: { key: keyof KeyPresence; re: RegExp }[] = [
  { key: "dyspnea", re: /\b(?:nega|sem)\s+(?:dispneia|falta de ar)\b/gi },
  { key: "syncope", re: /\b(?:nega|sem)\s+(?:s[ií]ncope|desmaio)\b/gi },
  { key: "focalDeficit", re: /\b(?:nega|sem)\s+d[eé]ficit(?:\s+focal|\s+neurol[oó]gico)?\b/gi },
  { key: "fever", re: /\b(?:nega febre|sem febre)\b/gi },
  { key: "bleeding", re: /\b(?:nega|sem)\s+sangramento\b/gi },
  { key: "seizure", re: /\b(?:nega|sem)\s+convuls[aã]o\b/gi },
];

/** Remove negativas inventadas do SOAP quando o dado é unknown. */
export function stripInventedNegatives(text: string, presence: KeyPresence): string {
  let next = text;
  for (const item of INVENTED_NEGATIVE_PATTERNS) {
    if (presence[item.key] === "unknown") {
      next = next.replace(item.re, "").replace(/\s{2,}/g, " ").trim();
    }
  }
  return next;
}

export function isExplicitlyNegativeInSource(transcript: string, finding: string): boolean {
  const folded = foldPt(`${transcript}`);
  const term = foldPt(finding);
  if (!term) return false;
  if (folded.includes(`nega ${term}`) || folded.includes(`sem ${term}`)) return true;
  return SPECS.some(
    (spec) =>
      spec.negative.some((neg) => contains(folded, neg)) &&
      spec.positive.some((pos) => term.includes(foldPt(pos)) || foldPt(pos).includes(term)),
  );
}

export function filterInferredNegatives(
  transcript: string,
  negativeFindings: string[],
): string[] {
  return negativeFindings.filter((item) => isExplicitlyNegativeInSource(transcript, item));
}
