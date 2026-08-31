import { ADVERSARIAL_CASES } from "./adversarial";
import { ATYPICAL_CASES } from "./atypical";
import { BENIGN_CASES } from "./benign";
import { CRITICAL_CASES } from "./critical";
import { INCOMPLETE_CASES } from "./incomplete";
import type { BlindClinicalCase } from "../types";

export const BLIND_V14_CASES: BlindClinicalCase[] = [
  ...CRITICAL_CASES,
  ...ATYPICAL_CASES,
  ...BENIGN_CASES,
  ...ADVERSARIAL_CASES,
  ...INCOMPLETE_CASES,
];

export function assertBlindCaseSet(): void {
  const ids = BLIND_V14_CASES.map((item) => item.id);
  const unique = new Set(ids);
  if (ids.length !== 100) {
    throw new Error(`Holdout v1.4 deve ter 100 casos, tem ${ids.length}`);
  }
  if (unique.size !== ids.length) {
    throw new Error("IDs duplicados no holdout v1.4");
  }
  const buckets = {
    critical: CRITICAL_CASES.length,
    atypical: ATYPICAL_CASES.length,
    benign: BENIGN_CASES.length,
    adversarial: ADVERSARIAL_CASES.length,
    incomplete: INCOMPLETE_CASES.length,
  };
  if (buckets.critical !== 30 || buckets.atypical !== 20 || buckets.benign !== 20) {
    throw new Error(`Distribuição inválida: ${JSON.stringify(buckets)}`);
  }
  if (buckets.adversarial !== 15 || buckets.incomplete !== 15) {
    throw new Error(`Distribuição inválida: ${JSON.stringify(buckets)}`);
  }
}

assertBlindCaseSet();
