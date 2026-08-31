export const GOLDEN_CRITICAL_CASE_IDS = [
  "chest-pain-01",
  "chest-pain-02",
  "dissection-01",
  "gi-bleed-01",
  "tbi-01",
  "chest-trauma-01",
  "tox-unknown-01",
  "adversarial-spo2-01",
  "adversarial-ecg-01",
  "stroke-01",
  "sepsis-01",
  "anaphylaxis-01",
  "hypoglycemia-01",
  "thunderclap-01",
  "pe-01",
] as const;

export type GoldenCriticalCaseId = (typeof GOLDEN_CRITICAL_CASE_IDS)[number];
