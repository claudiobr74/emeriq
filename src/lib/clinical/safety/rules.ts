import { SAFETY_THRESHOLDS } from "@/lib/clinical/safety/thresholds";
import type { SafetyEvaluationInput, SafetyTrigger } from "@/lib/clinical/safety/types";
import { anyTerm, foldPt } from "@/lib/clinical/text";

interface ParsedVitals {
  systolic: number | null;
  spo2: number | null;
  glucose: number | null;
}

export function parseSystolic(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/(\d{2,3})\s*(?:x|\/|por)\s*(\d{2,3})/i);
  if (!match) {
    const single = value.match(/\b(\d{2,3})\b/);
    return single ? Number(single[1]) : null;
  }
  return Number(match[1]);
}

export function parseExplicitVitals(text: string, input: SafetyEvaluationInput): ParsedVitals {
  const corpus = `${text} ${input.vitalSigns?.bloodPressure ?? ""}`;
  const bpMatch = corpus.match(/(\d{2,3})\s*(?:x|\/|por)\s*(\d{2,3})/i);
  const spo2Match = corpus.match(
    /(?:sat(?:ura[cç][aã]o)?|spo2|o2)\s*(?:de\s*)?(\d{2,3})\s*%?/i,
  );
  const glucoseMatch = corpus.match(
    /(?:glicemia|dextro|hgt)\s*(?:de\s*)?(\d{2,3})/i,
  );

  return {
    systolic:
      parseSystolic(input.vitalSigns?.bloodPressure) ??
      (bpMatch ? Number(bpMatch[1]) : null),
    spo2: input.vitalSigns?.oxygenSaturation ?? (spo2Match ? Number(spo2Match[1]) : null),
    glucose: input.vitalSigns?.glucose ?? (glucoseMatch ? Number(glucoseMatch[1]) : null),
  };
}

const CHEST_PAIN = [
  "dor toracica",
  "dor no peito",
  "dor precordial",
  "aperto no peito",
  "opressao no peito",
];
const SYNCOPE = ["sincope", "desmaio", "desmaiou", "perdeu os sentidos"];
const DYSPNEA = ["dispneia", "falta de ar", "dificuldade para respirar"];
const DIAPHORESIS = ["sudorese", "suando", "suor frio"];
const BACK_RADIATION = [
  "irradia para o dorso",
  "irradiando para o dorso",
  "para o dorso",
  "para as costas",
  "irradiando para as costas",
  "entre as escapulas",
  "em rasgo",
];
const SUDDEN_SEVERE = ["dor subita", "dor intensa subita", "pior dor", "dor lancinante"];
const THUNDERCLAP = [
  "pior dor de cabeca",
  "cefaleia em trovoada",
  "dor de cabeca da vida",
  "cefaleia subita",
  "comecou em um segundo",
];
const NEURO = [
  "fraqueza de um lado",
  "fraqueza unilateral",
  "hemiparesia",
  "afasia",
  "desvio de rima",
  "fala enrolada",
  "alteracao subita da fala",
  "perda visual subita",
  "deficit neurologico",
  "deficit focal",
];
const SHOCK = ["choque", "perfusao ruim", "pele fria", "enchimento capilar lento"];
const LOW_CONSCIOUSNESS = [
  "rebaixamento",
  "inconsciente",
  "coma",
  "nao responde",
  "sonolento demais",
];
const INFECTION = [
  "infeccao",
  "febre",
  "pneumonia",
  "infeccioso",
  "foco infeccioso",
  "urina forte",
  "celulite",
];
const EXPOSURE = [
  "picada",
  "ferroada",
  "alimento",
  "medicamento",
  "antibiotico",
  "penicilina",
  "contraste",
  "latex",
  "vacina",
];
const RESP_ANAPH = ["chiado", "estridor", "edema de glote", "falta de ar", "dispneia"];
const CUTANEOUS = ["urticaria", "rash", "prurido", "angioedema", "inchaco nos labios"];
const SEIZURE = ["convulsao", "convulsionou", "crise convulsiva", "tceu"];
const BLEEDING = [
  "sangramento",
  "hemorragia",
  "hematemese",
  "melena",
  "enterorragia",
  "sangue vivo",
];
const ANTICOAG = ["varfarina", "warfarin", "anticoagulante", "rivaroxabana", "apixabana", "marevan"];
const PREGNANCY = ["gestacao", "gestante", "gravida", "gravidez"];
const INTOX = ["intoxicacao", "overdose", "ingeriu", "tomou comprimidos", "envenen"];
const TRAUMA = ["trauma", "atropelamento", "queda de altura", "acidente"];

function corpusOf(input: SafetyEvaluationInput): string {
  return [
    input.transcript,
    input.newSegment ?? "",
    input.chiefComplaint ?? "",
    ...(input.medications ?? []),
  ].join(" ");
}

function hit(
  trigger: string,
  priority: SafetyTrigger["priority"],
  terms: string[],
): SafetyTrigger {
  return { trigger, priority, matchedTerms: terms };
}

export function collectSafetyTriggers(input: SafetyEvaluationInput): SafetyTrigger[] {
  const text = corpusOf(input);
  const folded = foldPt(text);
  const vitals = parseExplicitVitals(text, input);
  const hypotension =
    vitals.systolic != null && vitals.systolic < SAFETY_THRESHOLDS.hypotensionSystolicMmHg;
  const triggers: SafetyTrigger[] = [];

  const chest = anyTerm(folded, CHEST_PAIN);
  if (chest) {
    const modifiers: string[] = [];
    if (hypotension) modifiers.push("hipotensao");
    if (anyTerm(folded, SYNCOPE)) modifiers.push("sincope");
    if (anyTerm(folded, DYSPNEA)) modifiers.push("dispneia");
    if (anyTerm(folded, DIAPHORESIS)) modifiers.push("sudorese");
    if (anyTerm(folded, NEURO)) modifiers.push("deficit_neurologico");
    if (anyTerm(folded, SUDDEN_SEVERE)) modifiers.push("dor_subita");
    if (anyTerm(folded, BACK_RADIATION)) modifiers.push("irradiacao_dorso");
    if (modifiers.length > 0) {
      triggers.push(hit("high_risk_chest_pain", "critical", ["dor_toracica", ...modifiers]));
    } else {
      triggers.push(hit("chest_pain_isolated", "watch", ["dor_toracica"]));
    }
  }

  if (anyTerm(folded, NEURO)) {
    triggers.push(hit("acute_neuro_deficit", "critical", ["deficit_neurologico"]));
  }

  if (anyTerm(folded, THUNDERCLAP)) {
    triggers.push(hit("thunderclap_headache", "high", ["cefaleia_hiperaguda"]));
  }

  if (hypotension || anyTerm(folded, SHOCK) || (anyTerm(folded, LOW_CONSCIOUSNESS) && hypotension)) {
    triggers.push(
      hit("hemodynamic_instability", "critical", [
        hypotension ? "hipotensao" : "choque",
      ]),
    );
  }

  if (
    vitals.spo2 != null &&
    vitals.spo2 < SAFETY_THRESHOLDS.hypoxemiaSpO2Percent
  ) {
    triggers.push(hit("hypoxemia", "critical", [`spo2_${vitals.spo2}`]));
  }

  if (anyTerm(folded, INFECTION) && (hypotension || anyTerm(folded, LOW_CONSCIOUSNESS) || anyTerm(folded, SHOCK))) {
    triggers.push(hit("sepsis_shock", "critical", ["infeccao", "instabilidade"]));
  }

  if (anyTerm(folded, EXPOSURE) && (anyTerm(folded, RESP_ANAPH) || hypotension || anyTerm(folded, CUTANEOUS))) {
    const parts = [
      anyTerm(folded, RESP_ANAPH) ? "respiratorio" : "",
      hypotension ? "hipotensao" : "",
      anyTerm(folded, CUTANEOUS) ? "cutaneo" : "",
    ].filter(Boolean);
    if (parts.length >= 1 && (anyTerm(folded, RESP_ANAPH) || hypotension)) {
      triggers.push(hit("anaphylaxis", "critical", ["exposicao", ...parts]));
    }
  }

  if (anyTerm(folded, SEIZURE) && (anyTerm(folded, LOW_CONSCIOUSNESS) || folded.includes("nao cessa") || folded.includes("repetid"))) {
    triggers.push(hit("seizure", "high", ["convulsao"]));
  } else if (anyTerm(folded, SEIZURE)) {
    triggers.push(hit("seizure", "watch", ["convulsao"]));
  }

  if (anyTerm(folded, BLEEDING)) {
    const extra = [
      hypotension ? "hipotensao" : "",
      anyTerm(folded, SYNCOPE) ? "sincope" : "",
      anyTerm(folded, ANTICOAG) ? "anticoagulante" : "",
      anyTerm(folded, PREGNANCY) ? "gestacao" : "",
      anyTerm(folded, SHOCK) ? "choque" : "",
    ].filter(Boolean);
    if (extra.length > 0) {
      triggers.push(hit("major_bleeding", "critical", ["sangramento", ...extra]));
    }
  }

  if (anyTerm(folded, PREGNANCY) && (anyTerm(folded, BLEEDING) || folded.includes("dor abdominal") || folded.includes("dor na barriga"))) {
    triggers.push(hit("obstetric_pain_bleeding", "high", ["gestacao"]));
  }

  if (anyTerm(folded, INTOX)) {
    triggers.push(hit("intoxication", "high", ["intoxicacao"]));
  }

  if (
    vitals.systolic != null &&
    vitals.systolic >= SAFETY_THRESHOLDS.hypertensiveEmergencySystolicMmHg &&
    (chest || anyTerm(folded, NEURO) || anyTerm(folded, DYSPNEA))
  ) {
    triggers.push(hit("hypertensive_emergency", "high", ["pas_elevada"]));
  }

  if (vitals.glucose != null && vitals.glucose < SAFETY_THRESHOLDS.hypoglycemiaMgDl) {
    triggers.push(hit("hypoglycemia", "critical", [`glicemia_${vitals.glucose}`]));
  }

  const glasgow = input.vitalSigns?.glasgow ?? null;
  if (glasgow != null && glasgow <= SAFETY_THRESHOLDS.glasgowCriticalMax) {
    triggers.push(
      hit("altered_level_of_consciousness", "critical", [`gcs_${glasgow}`]),
    );
  } else if (
    glasgow != null &&
    glasgow >= SAFETY_THRESHOLDS.glasgowSignificantMin &&
    glasgow <= SAFETY_THRESHOLDS.glasgowSignificantMax
  ) {
    triggers.push(
      hit("altered_level_of_consciousness", "high", [`gcs_${glasgow}`]),
    );
  }

  if (anyTerm(folded, LOW_CONSCIOUSNESS) && !anyTerm(folded, SEIZURE)) {
    triggers.push(hit("altered_mental_status", "high", ["rebaixamento"]));
  }

  if (anyTerm(folded, TRAUMA) && (anyTerm(folded, BLEEDING) || hypotension || anyTerm(folded, SHOCK))) {
    triggers.push(hit("trauma_hemorrhage", "critical", ["trauma"]));
  }

  const seen = new Set<string>();
  return triggers.filter((item) => {
    if (seen.has(item.trigger)) return false;
    seen.add(item.trigger);
    return true;
  });
}

export function hasCriticalSafetySignal(triggers: SafetyTrigger[]): boolean {
  return triggers.some((item) => item.priority === "critical" || item.priority === "high");
}
