import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { AI_CONFIG } from "../../src/config/ai";
import { createEmptyClinicalState } from "../../src/lib/clinical/clinical-state";
import { getOpenAiApiKey } from "../../src/lib/env";
import { clinicalAIProvider } from "../../src/lib/openai/clinical";
import { CLINICAL_PROMPT_VERSION } from "../../src/lib/clinical/prompts/version";
import {
  CLINICAL_KNOWLEDGE_VERSION,
  CLINICAL_SAFETY_VERSION,
  CLINICAL_STATE_VERSION,
} from "../../src/lib/clinical/versions";
import { AppError, isRetryableClinicalError } from "../../src/lib/errors";
import { formatClinicalGateReport } from "../clinical-gates";
import { evaluateComplexGates, loadComplexGates } from "./gates";
import { hashComplexCases } from "./hash";
import { writeComplexReports } from "./report";
import { scoreComplexCase, traceAfterSegment, type ComplexCaseScore, type SegmentTrace } from "./scorer";
import { COMPLEX_SCORER_VERSION, ECCV_DATASET_ID } from "./types";
import type { ComplexVignetteCase } from "./types";
import { ECCV_V1_CASES } from "./v1";

const RESULTS_DIR = path.join(process.cwd(), "evaluation/complex-vignettes/v1/results");
const FREEZE_PATH = path.join(process.cwd(), "evaluation/complex-vignettes/v1/FREEZE.md");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      const wrappedFail =
        error instanceof AppError &&
        (error.code === "clinical_model_failed" || error.status === 502);
      if ((!isRetryableClinicalError(error) && !wrappedFail) || i === attempts - 1) {
        throw error;
      }
      const wait =
        error instanceof AppError && error.retryAfterMs
          ? Math.min(Math.max(error.retryAfterMs, 5_000), 240_000)
          : 12_000 * (i + 1);
      const message = error instanceof Error ? error.message.slice(0, 120) : "erro";
      console.error(`  retry ${i + 1}/${attempts - 1} in ${Math.round(wait / 1000)}s (${message})`);
      await sleep(wait);
    }
  }
  throw last;
}

export interface ComplexRunReport {
  runId: string;
  generatedAt: string;
  provider: string;
  model: string;
  promptVersion: string;
  clinicalStateVersion: string;
  safetyVersion: string;
  knowledgeVersion: string;
  scorerVersion: string;
  datasetId: string;
  casesHash: string;
  temperature: { update: number; finalize: number };
  totals: Record<string, number>;
  gates: ReturnType<typeof evaluateComplexGates>;
  cases: ComplexCaseScore[];
}

function frozenDatasetHash(): string | null {
  const text = readFileSync(FREEZE_PATH, "utf8");
  const match = text.match(/DATASET_SHA256\s*\|\s*`([a-f0-9]{64})`/);
  return match?.[1] ?? null;
}

function verifyFreeze(): void {
  if (!existsSync(FREEZE_PATH)) {
    throw new Error("Freeze ausente: evaluation/complex-vignettes/v1/FREEZE.md");
  }
  if (CLINICAL_PROMPT_VERSION !== "1.3") {
    throw new Error(`Prompt não congelado: ${CLINICAL_PROMPT_VERSION}`);
  }
  if (CLINICAL_STATE_VERSION !== "1.3" || CLINICAL_SAFETY_VERSION !== "1.3") {
    throw new Error("State/Safety não estão em 1.3");
  }
  if (CLINICAL_KNOWLEDGE_VERSION !== "1.3") {
    throw new Error(`Knowledge não congelado: ${CLINICAL_KNOWLEDGE_VERSION}`);
  }
  if (AI_CONFIG.clinicalModel !== "gpt-4o-mini") {
    throw new Error(`Modelo não congelado: ${AI_CONFIG.clinicalModel}`);
  }
  const gates = loadComplexGates();
  if (!gates.definedBeforeFirstRun) {
    throw new Error("GATES.json deve declarar definedBeforeFirstRun");
  }
  const frozen = frozenDatasetHash();
  if (!frozen) {
    throw new Error("DATASET_SHA256 pendente. Rode pnpm eval:clinical:complex:hash antes do FIRST_RUN.");
  }
  const actual = hashComplexCases(ECCV_V1_CASES);
  if (frozen !== actual) {
    throw new Error(`Hash do dataset diverge do freeze (${frozen} vs ${actual}).`);
  }
}

function failRate(fail: number, total: number): number {
  if (total === 0) return 0;
  return fail / total;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function baseCaseId(id: string): string {
  return id.replace(/#\d+$/, "");
}

function rate(pass: number, total: number): number {
  if (total === 0) return 1;
  return pass / total;
}

export function buildComplexReport(
  scores: ComplexCaseScore[],
  cases: ComplexVignetteCase[],
  runId: string,
): ComplexRunReport {
  const byId = new Map(cases.map((item) => [item.id, item]));
  const lookup = (scoreId: string) => byId.get(baseCaseId(scoreId));
  const withCritical = scores.filter((item) => (lookup(item.id)?.mustNotMiss.length ?? 0) > 0);
  const criticalHits = withCritical.filter((item) => item.emergencyRecall === "PASS").length;
  const hallCases = scores.filter((item) => item.hallucinations > 0).length;
  const soapPass = scores.filter((item) => item.soapFidelity === "PASS").length;
  const overDenom = scores.filter((item) => {
    const c = lookup(item.id);
    return c?.flags.overtriageTest || c?.criticality === "noncritical";
  });
  const underDenom = scores.filter((item) => lookup(item.id)?.criticality === "critical");
  const tempDenom = scores.filter((item) => item.temporalUpdateApplicable);
  const lateDenom = scores.filter((item) => item.lateInfoApplicable);
  const corrDenom = scores.filter((item) => item.correctionApplicable);
  const trapDenom = scores.filter((item) => item.prematureClosureApplicable);
  const anchorDenom = scores.filter((item) => item.anchoringApplicable);

  const precisionParts = scores.map((item) => item.criticalPrecision);
  const metrics = {
    criticalDiagnosisRecall: rate(criticalHits, withCritical.length),
    criticalPrecision: mean(precisionParts),
    criticalFails: scores.filter((item) => item.failSeverity === "CRITICAL_FAIL").length,
    criticalHallucinations: scores.reduce(
      (sum, item) =>
        sum + item.hallucinationEvents.filter((event) => event.severity === "critical").length,
      0,
    ),
    unsafeRecommendations: scores.filter((item) =>
      item.failReasons.some((reason) => reason.includes("insegura")),
    ).length,
    casesWithFabricationRate: rate(hallCases, scores.length),
    soapFidelity: rate(soapPass, scores.length),
    overtriageRate: failRate(
      overDenom.filter((item) => item.overtriage).length,
      overDenom.length,
    ),
    undertriageRate: failRate(
      underDenom.filter((item) => item.undertriage).length,
      underDenom.length,
    ),
    complexIntegration: rate(scores.filter((item) => item.integrationPass).length, scores.length),
    temporalUpdate: rate(tempDenom.filter((item) => item.temporalUpdatePass).length, tempDenom.length),
    distractorResistance: rate(
      scores.filter((item) => item.distractorResistancePass).length,
      scores.length,
    ),
    prematureClosureRate: failRate(
      trapDenom.filter((item) => item.prematureClosureFail).length,
      trapDenom.length,
    ),
    anchoringErrorRate: failRate(
      anchorDenom.filter((item) => item.anchoringFail).length,
      anchorDenom.length,
    ),
    lateInformationIntegration: rate(lateDenom.filter((item) => item.lateInfoPass).length, lateDenom.length),
    correctionHandling: rate(corrDenom.filter((item) => item.correctionPass).length, corrDenom.length),
  };

  const pass = scores.filter((item) => item.status === "PASS" && item.failureKinds.length === 0).length;

  return {
    runId,
    generatedAt: new Date().toISOString(),
    provider: "openai",
    model: AI_CONFIG.clinicalModel,
    promptVersion: CLINICAL_PROMPT_VERSION,
    clinicalStateVersion: CLINICAL_STATE_VERSION,
    safetyVersion: CLINICAL_SAFETY_VERSION,
    knowledgeVersion: CLINICAL_KNOWLEDGE_VERSION,
    scorerVersion: COMPLEX_SCORER_VERSION,
    datasetId: ECCV_DATASET_ID,
    casesHash: hashComplexCases(cases),
    temperature: { update: AI_CONFIG.temperature.update, finalize: AI_CONFIG.temperature.finalize },
    totals: {
      cases: scores.length,
      pass,
      fail: scores.length - pass,
      meanScore: Math.round(mean(scores.map((item) => item.score)) * 10) / 10,
      ...metrics,
      meanUpdateLatencyMs: Math.round(mean(scores.map((item) => item.latencyMs?.update ?? 0))),
      meanFinalizeLatencyMs: Math.round(mean(scores.map((item) => item.latencyMs?.finalize ?? 0))),
    },
    gates: evaluateComplexGates(metrics),
    cases: scores,
  };
}

async function runOne(testCase: ComplexVignetteCase): Promise<ComplexCaseScore> {
  let state = createEmptyClinicalState();
  let transcript = "";
  let updateMs = 0;
  const segmentTrace: SegmentTrace[] = [];
  for (const segment of testCase.segments) {
    transcript = transcript ? `${transcript}\n${segment.text}` : segment.text;
    const previous = state;
    const started = Date.now();
    state = await withRetry(() =>
      clinicalAIProvider.update({
        currentState: previous,
        confirmedTranscript: transcript,
        newSegment: segment.text,
      }),
    );
    updateMs += Date.now() - started;
    segmentTrace.push(traceAfterSegment({ case: testCase, segment, state }));
    await sleep(800);
  }
  const finalizeStarted = Date.now();
  const report = await withRetry(() => clinicalAIProvider.finalize({ transcript, state }));
  return scoreComplexCase({
    case: testCase,
    transcript,
    state,
    report,
    latencyMs: {
      update: Math.round(updateMs / Math.max(testCase.segments.length, 1)),
      finalize: Date.now() - finalizeStarted,
    },
    segmentTrace,
  });
}

function printCase(score: ComplexCaseScore) {
  console.log(`\nCASE: ${score.id} [${score.difficulty}/${score.criticality}]`);
  console.log(`STATUS: ${score.status}  score ${score.score}  integration ${score.integrationScore}`);
  console.log(`Emergency: ${score.emergencyRecall}  SOAP: ${score.soapFidelity}  hall ${score.hallucinations}`);
  if (score.failureKinds.length) console.log(`Kinds: ${score.failureKinds.join(", ")}`);
  if (score.divergeSegmentId) console.log(`Diverge: ${score.divergeSegmentId}`);
  for (const reason of score.failReasons) console.log(`  - ${reason}`);
}

function selectCases(): ComplexVignetteCase[] {
  const suite = process.env.EVAL_COMPLEX_SUITE ?? "all";
  const filters = (process.env.EVAL_FILTER || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  let selected = ECCV_V1_CASES;
  if (suite === "hard") {
    selected = selected.filter((item) => item.difficulty === "hard" || item.difficulty === "very_hard");
  }
  if (suite === "stability") {
    selected = selected.filter(
      (item) => item.difficulty === "very_hard" && item.criticality === "critical",
    );
  }
  if (filters.length) {
    selected = selected.filter((item) =>
      filters.some((filter) => item.id.includes(filter) || item.domain.includes(filter)),
    );
  }
  const limit = Number(process.env.EVAL_LIMIT || selected.length);
  return selected.slice(0, Number.isFinite(limit) ? limit : selected.length);
}

function writeOutputs(report: ComplexRunReport, runId: string) {
  mkdirSync(RESULTS_DIR, { recursive: true });
  const jsonPath = path.join(RESULTS_DIR, `${runId}.json`);
  const slim = {
    ...report,
    cases: report.cases.map((item) => ({
      ...item,
      segmentTrace: item.segmentTrace.map((step) => ({
        segmentId: step.segmentId,
        kind: step.kind,
        mustNotMissHit: step.mustNotMissHit,
        mustNotMissTotal: step.mustNotMissTotal,
        distractorHits: step.distractorHits,
        urgencyMarks: step.urgencyMarks,
        notes: step.notes,
      })),
    })),
  };
  if (runId === "FIRST_RUN" && existsSync(jsonPath)) {
    console.error("FIRST_RUN.json já existe e é imutável. Use outro BLIND_RUN_ID / EVAL_COMPLEX_RUN.");
    return;
  }
  writeFileSync(jsonPath, JSON.stringify(slim, null, 2));
  const md = [
    `# ECCV-1 ${runId}`,
    "",
    `_Engineering only. Not clinical validation._`,
    "",
    `- Generated: ${report.generatedAt}`,
    `- Model: ${report.model}`,
    `- Hash: \`${report.casesHash}\``,
    `- PASS ${report.totals.pass} / FAIL ${report.totals.fail} / mean ${report.totals.meanScore}`,
    `- Gate: ${report.gates.overall}`,
    "",
    ...report.gates.results.map(
      (item) =>
        `- ${item.name}: ${item.actual} (${item.comparator} ${item.required}) ${item.pass ? "PASS" : "FAIL"}`,
    ),
    "",
    `| Case | Score | Status | Kinds | Diverge |`,
    `|---|---:|---|---|---|`,
    ...report.cases.map(
      (item) =>
        `| ${item.id} | ${item.score} | ${item.status} | ${item.failureKinds.join(";") || "—"} | ${item.divergeSegmentId ?? "—"} |`,
    ),
    "",
  ].join("\n");
  writeFileSync(path.join(RESULTS_DIR, `${runId}.md`), md);
  if (runId === "FIRST_RUN") {
    writeComplexReports(report);
  } else if (existsSync(path.join(RESULTS_DIR, "FIRST_RUN.json"))) {
    writeComplexReports(JSON.parse(readFileSync(path.join(RESULTS_DIR, "FIRST_RUN.json"), "utf8")));
  }
}

export async function runComplexEvaluation(): Promise<ComplexRunReport> {
  if (!getOpenAiApiKey()) {
    throw new Error("OPENAI_API_KEY ausente. Defina no ambiente para pnpm eval:clinical:complex.");
  }
  verifyFreeze();
  const suite = process.env.EVAL_COMPLEX_SUITE ?? "all";
  const repeats = Math.max(1, Number(process.env.EVAL_REPEAT || 1) || 1);
  const runId =
    process.env.EVAL_COMPLEX_RUN ||
    (suite === "stability" || repeats > 1 ? "STABILITY_RUN" : suite === "hard" ? "HARD_RUN" : "FIRST_RUN");
  const selected = selectCases();
  const scores: ComplexCaseScore[] = [];

  for (const testCase of selected) {
    for (let round = 0; round < repeats; round += 1) {
      const label = repeats > 1 ? `${testCase.id}#${round + 1}` : testCase.id;
      try {
        const scored = await runOne(testCase);
        const named = repeats > 1 ? { ...scored, id: label, title: `${scored.title} (${round + 1}/${repeats})` } : scored;
        scores.push(named);
        printCase(named);
      } catch (error) {
        const message = error instanceof Error ? error.message : "erro";
        const failed = scoreComplexCase({
          case: testCase,
          transcript: "",
          state: createEmptyClinicalState(),
          report: {
            soap: { subjective: "", objective: "", assessment: "", plan: "" },
            hypotheses: [],
            dangerousDifferentials: [],
            suggestedTests: [],
            possibleTreatments: [],
            unresolvedQuestions: [],
            alerts: [],
          },
          segmentTrace: [],
        });
        failed.id = label;
        failed.status = "FAIL";
        failed.failSeverity = "CRITICAL_FAIL";
        failed.failReasons = [message.slice(0, 200)];
        failed.failureKinds = ["SCORER_ERROR"];
        scores.push(failed);
        printCase(failed);
      }
      await sleep(3_000);
    }
  }

  const report = buildComplexReport(scores, selected, runId);
  writeOutputs(report, runId);
  console.log(`\n${report.totals.cases} cases  PASS ${report.totals.pass}  FAIL ${report.totals.fail}`);
  console.log(`Gate: ${report.gates.overall}`);
  console.log(`\n${formatClinicalGateReport(report.gates)}`);
  return report;
}
