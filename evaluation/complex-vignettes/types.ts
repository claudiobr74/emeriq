export const COMPLEX_SCORER_VERSION = "1.0" as const;
export const ECCV_DATASET_ID = "ecc-v1" as const;

export type ComplexDomain =
  | "cardiovascular"
  | "neurologic"
  | "respiratory"
  | "infectious"
  | "gi"
  | "trauma"
  | "tox_metabolic"
  | "obgyn"
  | "undifferentiated";

export type ComplexDifficulty = "moderate" | "hard" | "very_hard";
export type ComplexCriticality = "critical" | "noncritical";
export type DispositionConcept =
  | "emergency"
  | "urgent"
  | "routine"
  | "discharge_possible"
  | "observation";

export type SegmentKind =
  | "presentation"
  | "hpi"
  | "pmh"
  | "meds"
  | "exam"
  | "vitals"
  | "ecg"
  | "labs"
  | "imaging"
  | "late"
  | "correction"
  | "deterioration"
  | "improvement"
  | "other";

export interface ComplexSegment {
  id: string;
  t?: string;
  kind?: SegmentKind;
  text: string;
}

export interface ComplexVignetteCase {
  id: string;
  title: string;
  domain: ComplexDomain;
  subcategory: string;
  difficulty: ComplexDifficulty;
  criticality: ComplexCriticality;
  complexityScore: number;
  variableCount: number;
  distractorCount: number;
  lateRevealCount: number;
  correctionCount: number;
  segments: ComplexSegment[];
  vitalsTimeline?: Array<{ t: string; values: string }>;
  labs?: string[];
  imaging?: string[];
  medications: string[];
  comorbidities: string[];
  distractors: string[];
  lateReveals: string[];
  corrections: Array<{ from: string; to: string }>;
  mustConsider: string[];
  mustNotMiss: string[];
  shouldAsk: string[];
  shouldTest: string[];
  shouldTreatConceptually: string[];
  mustNotDo: string[];
  expectedDispositionConcept: DispositionConcept;
  clinicallyPlausibleAlternatives: string[];
  forbiddenFabrications: string[];
  decisionPoints: Array<{ question: string; expectedPriority: string }>;
  flags: {
    multimorbidity?: boolean;
    polypharmacy?: boolean;
    vitalsChange?: boolean;
    deterioration?: boolean;
    improvement?: boolean;
    concurrentDiagnoses?: boolean;
    prematureClosureTrap?: string;
    anchoringLabel?: string;
    overtriageTest?: boolean;
    undertriageTest?: boolean;
    negativeExplicit?: string[];
  };
}

export interface CaseDraft
  extends Omit<
    ComplexVignetteCase,
    | "variableCount"
    | "distractorCount"
    | "lateRevealCount"
    | "correctionCount"
    | "segments"
  > {
  variableCount?: number;
  segments: Array<string | ComplexSegment>;
}

function asSegment(item: string | ComplexSegment, index: number): ComplexSegment {
  if (typeof item === "string") {
    return { id: `s${index + 1}`, text: item };
  }
  return item;
}

function countWords(segments: ComplexSegment[]): number {
  return segments
    .map((item) => item.text.trim().split(/\s+/).filter(Boolean).length)
    .reduce((sum, n) => sum + n, 0);
}

export function defineCase(draft: CaseDraft): ComplexVignetteCase {
  const segments = draft.segments.map(asSegment);
  const distractorCount = draft.distractors.length;
  const lateRevealCount = draft.lateReveals.length;
  const correctionCount = draft.corrections.length;
  const meds = draft.medications.length;
  const comorb = draft.comorbidities.length;
  const estimated =
    draft.variableCount ??
    Math.max(
      12,
      comorb +
        meds +
        distractorCount +
        (draft.labs?.length ?? 0) +
        (draft.vitalsTimeline?.length ?? 0) +
        lateRevealCount +
        6,
    );
  if (segments.length < 8) {
    throw new Error(`${draft.id}: mínimo 8 segmentos, tem ${segments.length}`);
  }
  if (draft.complexityScore < 6 || draft.complexityScore > 10) {
    throw new Error(`${draft.id}: complexityScore ${draft.complexityScore}`);
  }
  if (distractorCount < 2 || distractorCount > 6) {
    throw new Error(`${draft.id}: distractorCount ${distractorCount}`);
  }
  const words = countWords(segments);
  if (words < 400) {
    throw new Error(`${draft.id}: vinheta curta demais (${words} palavras)`);
  }
  return {
    ...draft,
    segments,
    variableCount: estimated,
    distractorCount,
    lateRevealCount,
    correctionCount,
    flags: {
      ...draft.flags,
      multimorbidity: draft.flags.multimorbidity ?? comorb >= 2,
      polypharmacy: draft.flags.polypharmacy ?? meds >= 5,
    },
  };
}

export function caseWordCount(testCase: ComplexVignetteCase): number {
  return countWords(testCase.segments);
}

export function transcriptSegmentsOf(testCase: ComplexVignetteCase): string[] {
  return testCase.segments.map((item) => item.text);
}
