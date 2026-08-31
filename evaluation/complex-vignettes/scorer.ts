import { aliasGroupFor, diagnosesMatch } from "../../src/lib/clinical/provenance/aliases";
import { includesFolded } from "../../src/lib/clinical/text";
import type { ClinicalState, FinalClinicalReport } from "../../src/lib/clinical/schemas";
import { scoreCase } from "../scorer";
import type { CaseScore, ClinicalEvaluationCase } from "../schemas";
import { COMPLEX_SCORER_VERSION, transcriptSegmentsOf } from "./types";
import type { ComplexVignetteCase } from "./types";

/** Canônicos críticos congelados (iguais ao holdout v1.4). Não expandir após FIRST_RUN. */
export const COMPLEX_CRITICAL_CANONICALS = [
  "sindrome_coronariana_aguda",
  "disseccao_aortica",
  "tep",
  "hsa",
  "avc",
  "sepse",
  "anafilaxia",
  "meningite",
  "sangramento_digestivo",
  "gravidez_ectopica",
  "hipoglicemia",
  "tce",
  "hemorragia_intracraniana",
  "pneumotorax",
] as const;

export type ComplexFailureKind =
  | "CRITICAL_MISS"
  | "INTEGRATION_MISS"
  | "TEMPORAL_UPDATE_MISS"
  | "DISTRACTOR_CAPTURE"
  | "PREMATURE_CLOSURE"
  | "ANCHORING_ERROR"
  | "LATE_INFO_MISS"
  | "CORRECTION_MISS"
  | "FABRICATION"
  | "UNSAFE"
  | "SCORER_ERROR";

export interface SegmentTrace {
  segmentId: string;
  kind?: string;
  mustNotMissHit: number;
  mustNotMissTotal: number;
  distractorHits: number;
  urgencyMarks: number;
  notes: string[];
}

export interface ComplexCaseScore extends CaseScore {
  scorerVersion: typeof COMPLEX_SCORER_VERSION;
  difficulty: ComplexVignetteCase["difficulty"];
  criticality: ComplexVignetteCase["criticality"];
  complexityScore: number;
  domain: ComplexVignetteCase["domain"];
  overtriage: boolean;
  undertriage: boolean;
  integrationScore: number;
  integrationPass: boolean;
  temporalUpdateApplicable: boolean;
  temporalUpdatePass: boolean;
  distractorResistancePass: boolean;
  prematureClosureApplicable: boolean;
  prematureClosureFail: boolean;
  anchoringApplicable: boolean;
  anchoringFail: boolean;
  lateInfoApplicable: boolean;
  lateInfoPass: boolean;
  correctionApplicable: boolean;
  correctionPass: boolean;
  failureKinds: ComplexFailureKind[];
  divergeSegmentId: string | null;
  segmentTrace: SegmentTrace[];
  criticalPrecision: number;
  unjustifiedCriticalCount: number;
}

function blobOf(state: ClinicalState, report?: FinalClinicalReport | null): string {
  const soap = report
    ? `${report.soap.subjective}\n${report.soap.objective}\n${report.soap.assessment}\n${report.soap.plan}`
    : "";
  return [
    soap,
    ...state.hypotheses.map((item) => `${item.diagnosis} ${item.rationale ?? ""}`),
    ...state.dangerousDifferentials.map((item) => `${item.diagnosis} ${item.priority}`),
    ...state.alerts.map((item) => `${item.severity} ${item.title} ${item.message}`),
    ...state.suggestedTests.map((item) => item.item),
    ...state.possibleTreatments.map((item) => item.item),
    ...state.suggestedQuestions.map((item) => item.text),
    ...state.medications,
    ...state.reportedFacts,
    JSON.stringify(state.vitalSigns),
    JSON.stringify(state.keyPresence),
  ].join("\n");
}

function hitAny(needles: string[], haystack: string): number {
  return needles.filter((needle) => needle && includesFolded(haystack, needle)).length;
}

function recallRatio(needles: string[], haystack: string): number {
  if (needles.length === 0) return 1;
  return hitAny(needles, haystack) / needles.length;
}

export function toClinicalEvaluationCase(testCase: ComplexVignetteCase): ClinicalEvaluationCase {
  return {
    id: testCase.id,
    title: testCase.title,
    category: testCase.domain,
    transcriptSegments: transcriptSegmentsOf(testCase),
    expected: {
      mustConsider: testCase.mustConsider,
      mustNotMiss: testCase.mustNotMiss,
      expectedQuestions: testCase.shouldAsk,
      expectedTests: testCase.shouldTest,
    },
    forbidden: {
      fabricatedFacts: testCase.forbiddenFabrications,
      unsafeRecommendations: testCase.mustNotDo,
    },
  };
}

export function isComplexCriticalLabel(label: string): boolean {
  const canonical = aliasGroupFor(label)?.canonical;
  return Boolean(
    canonical && (COMPLEX_CRITICAL_CANONICALS as readonly string[]).includes(canonical),
  );
}

function uniqueCritical(labels: string[]): string[] {
  const kept: string[] = [];
  for (const label of labels) {
    if (!isComplexCriticalLabel(label)) continue;
    if (kept.some((item) => diagnosesMatch(item, label))) continue;
    kept.push(label);
  }
  return kept;
}

function allowedLabels(testCase: ComplexVignetteCase): string[] {
  return [
    ...testCase.mustNotMiss,
    ...testCase.mustConsider,
    ...testCase.clinicallyPlausibleAlternatives,
  ];
}

function isJustifiedCritical(label: string, testCase: ComplexVignetteCase): boolean {
  return allowedLabels(testCase).some((allowed) => diagnosesMatch(label, allowed));
}

function urgencyMarks(blob: string, state: ClinicalState): number {
  let marks = state.alerts.filter((item) => item.severity === "critical").length;
  marks += state.dangerousDifferentials.filter((item) => item.priority === "high").length;
  if (/hipotens|choque|instab|rebaixamento|glasgow|taquicard.*14[0-9]|pa\s*8\d/i.test(blob)) {
    marks += 2;
  }
  return marks;
}

export function scoreComplexCase(input: {
  case: ComplexVignetteCase;
  transcript: string;
  state: ClinicalState;
  report: FinalClinicalReport;
  latencyMs?: { update: number; finalize: number };
  segmentTrace?: SegmentTrace[];
}): ComplexCaseScore {
  const testCase = input.case;
  const mapped = toClinicalEvaluationCase(testCase);
  const base = scoreCase({
    case: mapped,
    transcript: input.transcript,
    state: input.state,
    report: input.report,
    latencyMs: input.latencyMs,
  });
  const blob = blobOf(input.state, input.report);
  const failureKinds: ComplexFailureKind[] = [];
  const trace = input.segmentTrace ?? [];

  const integrationScore =
    Math.round(
      ((recallRatio(testCase.mustNotMiss, blob) +
        recallRatio(testCase.mustConsider, blob) +
        recallRatio(testCase.shouldTest, blob)) /
        3) *
        1000,
    ) / 1000;
  const integrationPass = integrationScore >= 0.85;
  if (!integrationPass) failureKinds.push("INTEGRATION_MISS");

  const suggested = uniqueCritical([
    ...input.state.dangerousDifferentials.map((item) => item.diagnosis),
    ...input.report.dangerousDifferentials.map((item) => item.diagnosis),
  ]);
  const unjustified = suggested.filter((label) => !isJustifiedCritical(label, testCase));
  const justified = suggested.filter((label) => isJustifiedCritical(label, testCase));
  const criticalPrecision = suggested.length === 0 ? 1 : justified.length / suggested.length;
  const overtriage =
    (testCase.flags.overtriageTest || testCase.criticality === "noncritical") &&
    unjustified.length > 0;
  const undertriage = testCase.criticality === "critical" && base.emergencyRecall === "FAIL";
  if (base.emergencyRecall === "FAIL") failureKinds.push("CRITICAL_MISS");
  if (base.hallucinations > 0) failureKinds.push("FABRICATION");
  if (base.failReasons.some((reason) => reason.includes("insegura"))) failureKinds.push("UNSAFE");

  const distractorHits = hitAny(testCase.distractors, blob);
  const goldHits = hitAny([...testCase.mustNotMiss, ...testCase.mustConsider], blob);
  const distractorResistancePass = !(
    distractorHits >= 2 &&
    goldHits === 0 &&
    (testCase.mustNotMiss.length > 0 || testCase.mustConsider.length > 0)
  );
  if (!distractorResistancePass) failureKinds.push("DISTRACTOR_CAPTURE");

  const trap = testCase.flags.prematureClosureTrap;
  const prematureClosureApplicable = Boolean(trap);
  const prematureClosureFail = Boolean(
    trap &&
      includesFolded(blob, trap) &&
      testCase.mustNotMiss.length > 0 &&
      hitAny(testCase.mustNotMiss, blob) === 0,
  );
  if (prematureClosureFail) failureKinds.push("PREMATURE_CLOSURE");

  const anchor = testCase.flags.anchoringLabel;
  const anchoringApplicable = Boolean(anchor);
  const anchoringFail = Boolean(
    anchor &&
      includesFolded(blob, anchor) &&
      /confirmad|diagnosticad|manter.*encaminh/i.test(blob) &&
      testCase.mustNotMiss.length > 0 &&
      hitAny(testCase.mustNotMiss, blob) === 0,
  );
  if (anchoringFail) failureKinds.push("ANCHORING_ERROR");

  const lateInfoApplicable = testCase.lateReveals.length > 0;
  const lateInfoPass =
    !lateInfoApplicable || hitAny(testCase.lateReveals, blob) === testCase.lateReveals.length;
  if (lateInfoApplicable && !lateInfoPass) failureKinds.push("LATE_INFO_MISS");

  const correctionApplicable = testCase.corrections.length > 0;
  let correctionPass = true;
  if (correctionApplicable) {
    for (const correction of testCase.corrections) {
      const hasNew = includesFolded(blob, correction.to);
      const stillOldAsFact =
        includesFolded(blob, correction.from) &&
        !includesFolded(blob, `não ${correction.from}`) &&
        !includesFolded(blob, `nao ${correction.from}`) &&
        !includesFolded(blob, `corrig`);
      if (!hasNew || stillOldAsFact) correctionPass = false;
    }
  }
  if (correctionApplicable && !correctionPass) failureKinds.push("CORRECTION_MISS");

  const temporalUpdateApplicable = Boolean(testCase.flags.deterioration);
  let temporalUpdatePass = true;
  if (temporalUpdateApplicable && trace.length >= 2) {
    const detIdx = testCase.segments.findIndex((item) => item.kind === "deterioration");
    const idx = detIdx >= 0 ? detIdx : Math.max(0, trace.length - 2);
    const before = trace[Math.max(0, idx - 1)];
    const after = trace[Math.min(trace.length - 1, Math.max(idx, idx + 1))] ?? trace.at(-1);
    if (before && after && after.urgencyMarks <= before.urgencyMarks) {
      temporalUpdatePass = false;
    }
  }
  if (temporalUpdateApplicable && !temporalUpdatePass) failureKinds.push("TEMPORAL_UPDATE_MISS");

  let divergeSegmentId: string | null = null;
  for (const step of trace) {
    if (
      step.mustNotMissTotal > 0 &&
      step.mustNotMissHit < step.mustNotMissTotal &&
      step.kind === "deterioration"
    ) {
      divergeSegmentId = step.segmentId;
      break;
    }
    if (step.kind === "late" && step.notes.includes("late-miss")) {
      divergeSegmentId = step.segmentId;
      break;
    }
  }
  if (!divergeSegmentId && failureKinds.length) {
    divergeSegmentId = trace.at(-1)?.segmentId ?? testCase.segments.at(-1)?.id ?? null;
  }

  return {
    ...base,
    scorerVersion: COMPLEX_SCORER_VERSION,
    difficulty: testCase.difficulty,
    criticality: testCase.criticality,
    complexityScore: testCase.complexityScore,
    domain: testCase.domain,
    overtriage,
    undertriage,
    integrationScore,
    integrationPass,
    temporalUpdateApplicable,
    temporalUpdatePass,
    distractorResistancePass,
    prematureClosureApplicable,
    prematureClosureFail,
    anchoringApplicable,
    anchoringFail,
    lateInfoApplicable,
    lateInfoPass,
    correctionApplicable,
    correctionPass,
    failureKinds: [...new Set(failureKinds)],
    divergeSegmentId,
    segmentTrace: trace,
    criticalPrecision,
    unjustifiedCriticalCount: unjustified.length,
  };
}

export function traceAfterSegment(input: {
  case: ComplexVignetteCase;
  segment: ComplexVignetteCase["segments"][number];
  state: ClinicalState;
}): SegmentTrace {
  const blob = blobOf(input.state, null);
  const notes: string[] = [];
  if (input.segment.kind === "late") {
    const hits = hitAny(input.case.lateReveals, blob);
    if (hits < input.case.lateReveals.length) notes.push("late-miss");
  }
  return {
    segmentId: input.segment.id,
    kind: input.segment.kind,
    mustNotMissHit: hitAny(input.case.mustNotMiss, blob),
    mustNotMissTotal: input.case.mustNotMiss.length,
    distractorHits: hitAny(input.case.distractors, blob),
    urgencyMarks: urgencyMarks(blob, input.state),
    notes,
  };
}
