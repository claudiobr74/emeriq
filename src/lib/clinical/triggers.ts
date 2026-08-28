const CLINICAL_TRIGGERS = [
  "dor toracica",
  "dor no peito",
  "dor precordial",
  "aperto no peito",
  "dispneia",
  "falta de ar",
  "dificuldade para respirar",
  "sincope",
  "desmaio",
  "desmaiou",
  "deficit neurologico",
  "fraqueza de um lado",
  "afasia",
  "avc",
  "derrame",
  "convulsao",
  "convulsionou",
  "sangramento",
  "hemorragia",
  "hematemese",
  "melena",
  "hipotensao",
  "pressao baixa",
  "hipertensao grave",
  "pressao muito alta",
  "saturacao baixa",
  "sat baixa",
  "dessaturacao",
  "febre elevada",
  "febre alta",
  "choque",
  "anafilaxia",
  "alergia grave",
  "gestacao",
  "gravida",
  "gestante",
  "trauma importante",
  "acidente grave",
  "intoxicacao",
  "overdose",
  "rebaixamento de consciencia",
  "inconsciente",
  "coma",
  "infarto",
  "iam",
  "palpitacao",
  "anafilatico",
];

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR");
}

export function hasClinicalTrigger(text: string): boolean {
  if (!text.trim()) return false;
  const haystack = fold(text);
  return CLINICAL_TRIGGERS.some((trigger) => haystack.includes(fold(trigger)));
}
