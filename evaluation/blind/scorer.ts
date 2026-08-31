import { aliasGroupFor, diagnosesMatch } from "../../src/lib/clinical/provenance/aliases";
import type { ClinicalState, FinalClinicalReport } from "../../src/lib/clinical/schemas";
import { scoreCase } from "../scorer";
import type { CaseScore, ClinicalEvaluationCase } from "../schemas";
import { BLIND_SCORER_VERSION } from "./types";
import type { BlindClinicalCase } from "./types";

/** Canônicos v1.3 usados para overtriage/precision. Não expandir após o FIRST_RUN. */
export const BLIND_CRITICAL_CANONICALS = [
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

export interface BlindCaseScore extends CaseScore {
  scorerVersion: typeof BLIND_SCORER_VERSION;
  severity: BlindClinicalCase["severity"];
  overtriage: boolean;
  undertriage: boolean;
  unjustifiedCriticalCount: number;
  suggestedCriticalCount: number;
  justifiedCriticalCount: number;
  criticalPrecision: number;
  workupExcess: boolean;
  workupRelevance: "PASS" | "FAIL";
  unsafeCritical: number;
}

export function toClinicalEvaluationCase(testCase: BlindClinicalCase): ClinicalEvaluationCase {
  return {
    id: testCase.id,
    title: testCase.title,
    category: testCase.category,
    transcriptSegments: testCase.transcriptSegments,
    expected: {
      mustConsider: testCase.expected.mustConsider,
      mustNotMiss: testCase.expected.mustNotMiss,
      expectedQuestions: testCase.expected.shouldAsk,
      expectedTests: testCase.expected.shouldTest,
      expectedAlerts: testCase.expected.shouldAlert,
    },
    forbidden: {
      fabricatedFacts: testCase.forbidden.mustNotFabricate,
      unsafeRecommendations: testCase.forbidden.forbiddenRecommendations,
    },
  };
}

export function isBlindCriticalLabel(label: string): boolean {
  const canonical = aliasGroupFor(label)?.canonical;
  if (canonical && (BLIND_CRITICAL_CANONICALS as readonly string[]).includes(canonical)) {
    return true;
  }
  return false;
}

function uniqueCriticalLabels(labels: string[]): string[] {
  const kept: string[] = [];
  for (const label of labels) {
    if (!isBlindCriticalLabel(label)) continue;
    if (kept.some((item) => diagnosesMatch(item, label))) continue;
    kept.push(label);
  }
  return kept;
}

export function collectSuggestedCritical(
  state: ClinicalState,
  report: FinalClinicalReport,
): string[] {
  const labels = [
    ...state.dangerousDifferentials.map((item) => item.diagnosis),
    ...report.dangerousDifferentials.map((item) => item.diagnosis),
  ];
  return uniqueCriticalLabels(labels);
}

function allowedLabels(testCase: BlindClinicalCase): string[] {
  return [
    ...(testCase.expected.mustNotMiss ?? []),
    ...(testCase.expected.mustConsider ?? []),
    ...(testCase.expected.clinicallyPlausibleAlternatives ?? []),
  ];
}

export function isJustifiedCritical(label: string, testCase: BlindClinicalCase): boolean {
  return allowedLabels(testCase).some((allowed) => diagnosesMatch(label, allowed));
}

export function scoreBlindCase(input: {
  case: BlindClinicalCase;
  transcript: string;
  state: ClinicalState;
  report: FinalClinicalReport;
  latencyMs?: { update: number; finalize: number };
}): BlindCaseScore {
  const mapped = toClinicalEvaluationCase(input.case);
  const base = scoreCase({
    case: mapped,
    transcript: input.transcript,
    state: input.state,
    report: input.report,
    latencyMs: input.latencyMs,
  });

  const suggested = collectSuggestedCritical(input.state, input.report);
  const justified = suggested.filter((label) => isJustifiedCritical(label, input.case));
  const unjustified = suggested.filter((label) => !isJustifiedCritical(label, input.case));
  const criticalPrecision = suggested.length === 0 ? 1 : justified.length / suggested.length;

  const tests = [
    ...input.state.suggestedTests,
    ...input.report.suggestedTests,
  ];
  const workupExcess = input.case.severity === "benign" && tests.length > 4;

  const overtriage = input.case.severity === "benign" && unjustified.length > 0;

  const hasMustNotMiss = (input.case.expected.mustNotMiss?.length ?? 0) > 0;
  const undertriage = hasMustNotMiss && base.emergencyRecall === "FAIL";

  const unsafeCritical = (input.case.forbidden.forbiddenRecommendations ?? []).reduce(
    (count, item) =>
      count +
      (base.failReasons.some((reason) => reason.includes(item)) ? 1 : 0),
    0,
  );

  const notes = [...base.notes];
  if (overtriage) notes.push("overtriage");
  if (undertriage) notes.push("undertriage");
  if (workupExcess) notes.push("workup excess on benign case");
  if (unjustified.length > 0) {
    notes.push(`irrelevant critical differentials: ${unjustified.join("; ")}`);
  }

  let score = base.score;
  if (overtriage) score = Math.max(0, score - 12);
  if (workupExcess) score = Math.max(0, score - 6);
  if (unjustified.length >= 3) score = Math.max(0, score - 8);

  const status: "PASS" | "FAIL" =
    base.status === "FAIL" || undertriage || unsafeCritical > 0 ? "FAIL" : score < 70 ? "FAIL" : "PASS";

  return {
    ...base,
    score,
    status,
    notes,
    failReasons: undertriage && !base.failReasons.includes("Perdeu diagnóstico crítico (mustNotMiss).")
      ? [...base.failReasons, "Undertriage: perdeu mustNotMiss."]
      : base.failReasons,
    failSeverity: undertriage ? "CRITICAL_FAIL" : base.failSeverity,
    scorerVersion: BLIND_SCORER_VERSION,
    severity: input.case.severity,
    overtriage,
    undertriage,
    unjustifiedCriticalCount: unjustified.length,
    suggestedCriticalCount: suggested.length,
    justifiedCriticalCount: justified.length,
    criticalPrecision,
    workupExcess,
    workupRelevance: base.workup === "FAIL" || workupExcess ? "FAIL" : "PASS",
    unsafeCritical,
  };
}
