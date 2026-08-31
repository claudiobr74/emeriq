export const BLIND_SCORER_VERSION = "1.4" as const;
export const BLIND_HOLDOUT_ID = "v1.4" as const;

export type BlindBucket =
  | "critical"
  | "atypical"
  | "benign"
  | "adversarial"
  | "incomplete";

export type DispositionConcept =
  | "emergency"
  | "urgent"
  | "routine"
  | "discharge_possible"
  | "observation";

export interface BlindClinicalCase {
  id: string;
  title: string;
  category: string;
  severity: BlindBucket;
  transcriptSegments: string[];
  expected: {
    mustConsider?: string[];
    mustNotMiss?: string[];
    shouldAsk?: string[];
    shouldTest?: string[];
    shouldAlert?: string[];
    expectedDispositionConcept?: DispositionConcept;
    clinicallyPlausibleAlternatives?: string[];
  };
  forbidden: {
    mustNotFabricate?: string[];
    forbiddenRecommendations?: string[];
  };
  notes?: string;
}
