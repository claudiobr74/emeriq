import { foldPt, includesFolded, includesFoldedToken } from "@/lib/clinical/text";

export interface DiagnosisAlias {
  canonical: string;
  labels: readonly string[];
}

export const DIAGNOSIS_ALIASES: readonly DiagnosisAlias[] = [
  {
    canonical: "sindrome_coronariana_aguda",
    labels: [
      "sca",
      "sindrome coronariana aguda",
      "sindrome coronariana",
      "iam",
      "infarto",
      "infarto agudo",
      "infarto do miocardio",
      "nstemi",
      "stemi",
      "angina instavel",
      "acs",
      "acute coronary syndrome",
    ],
  },
  {
    canonical: "disseccao_aortica",
    labels: [
      "disseccao aortica",
      "disseccao de aorta",
      "sindrome aortica aguda",
      "sindrome aortica",
      "aortic dissection",
      "aorta aguda",
    ],
  },
  {
    canonical: "tep",
    labels: ["tep", "tromboembolismo pulmonar", "embolia pulmonar", "pulmonary embolism"],
  },
  {
    canonical: "hsa",
    labels: [
      "hsa",
      "hemorragia subaracnoidea",
      "subarachnoid",
      "cefaleia em trovoada",
      "thunderclap",
    ],
  },
  {
    canonical: "avc",
    labels: ["avc", "ave", "acidente vascular", "stroke", "icto", "avc isquemico", "avc hemorragico"],
  },
  {
    canonical: "sepse",
    labels: ["sepse", "sepsis", "choque septico", "septic shock", "choque infeccioso"],
  },
  {
    canonical: "anafilaxia",
    labels: ["anafilaxia", "choque anafilatico", "anaphylaxis"],
  },
  {
    canonical: "meningite",
    labels: ["meningite", "meningitis"],
  },
  {
    canonical: "sangramento_digestivo",
    labels: ["sangramento digestivo", "hemorragia digestiva", "hda", "hdb", "gi bleed"],
  },
  {
    canonical: "gravidez_ectopica",
    labels: ["gravidez ectopica", "ectopica", "ectopic"],
  },
  {
    canonical: "hipoglicemia",
    labels: ["hipoglicemia", "hypoglycemia"],
  },
  {
    canonical: "asma_exacerbacao",
    labels: ["asma", "crise asmatica", "asthma"],
  },
  {
    canonical: "dpoc_exacerbacao",
    labels: ["dpoc", "copd", "exacerbacao de dpoc"],
  },
  {
    canonical: "tce",
    labels: ["tce", "trauma craniano", "trauma cranioencefalico", "head injury"],
  },
  {
    canonical: "hemorragia_intracraniana",
    labels: [
      "hemorragia intracraniana",
      "hematoma subdural",
      "hematoma epidural",
      "hematoma extradural",
    ],
  },
  {
    canonical: "pneumotorax",
    labels: ["pneumotorax", "pneumothorax"],
  },
];

function needleInGroup(needle: string, alias: DiagnosisAlias): boolean {
  const term = foldPt(needle);
  if (!term) return false;
  return alias.labels.some((label) => {
    const foldedLabel = foldPt(label);
    if (term === foldedLabel) return true;
    if (foldedLabel.length <= 4) return includesFoldedToken(needle, label);
    if (term.length <= 4) return includesFoldedToken(label, needle);
    return term.includes(foldedLabel) || foldedLabel.includes(term);
  });
}

export function aliasGroupFor(name: string): DiagnosisAlias | undefined {
  return DIAGNOSIS_ALIASES.find((alias) => needleInGroup(name, alias));
}

export function canonicalDiagnosis(name: string): string {
  return aliasGroupFor(name)?.canonical ?? foldPt(name);
}

export function conceptPresent(haystack: string, needle: string): boolean {
  const group = aliasGroupFor(needle);
  if (group) {
    return group.labels.some((label) => includesFoldedToken(haystack, label));
  }
  return includesFolded(haystack, needle);
}

export function diagnosesMatch(a: string, b: string): boolean {
  const left = canonicalDiagnosis(a);
  const right = canonicalDiagnosis(b);
  if (left === right) return true;
  return includesFoldedToken(a, b) || includesFoldedToken(b, a);
}
