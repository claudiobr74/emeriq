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
import type { ClinicalState, FinalClinicalReport } from "../../src/lib/clinical/schemas";
import { formatClinicalGateReport } from "../clinical-gates";
import { evaluateBlindGates } from "./gates";
import { hashBlindCases } from "./hash";
import { scoreBlindCase, type BlindCaseScore } from "./scorer";
import { BLIND_SCORER_VERSION, BLIND_HOLDOUT_ID } from "./types";
import { BLIND_V14_CASES } from "./v1.4";
import type { BlindClinicalCase } from "./types";

const RESULTS_DIR = path.join(process.cwd(), "evaluation/blind/results");
const FREEZE_PATH = path.join(process.cwd(), "evaluation/blind/V1_3_FREEZE.md");
const FROZEN_COMMIT = "d19a2d213200c4a450101efde79a7f2f18ad6b64";

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
      if (!isRetryableClinicalError(error) || i === attempts - 1) throw error;
      const wait =
        error instanceof AppError && error.retryAfterMs
          ? Math.min(Math.max(error.retryAfterMs, 5_000), 240_000)
          : 65_000;
      const message = error instanceof Error ? error.message.slice(0, 120) : "erro";
      console.error(`  retry ${i + 1}/${attempts - 1} in ${Math.round(wait / 1000)}s (${message})`);
      await sleep(wait);
    }
  }
  throw last;
}

export interface BlindCaseTrace {
  transcript: string;
  hypotheses: ClinicalState["hypotheses"];
  dangerousDifferentials: ClinicalState["dangerousDifferentials"];
  questions: ClinicalState["suggestedQuestions"];
  tests: ClinicalState["suggestedTests"];
  alerts: ClinicalState["alerts"];
  safety: ClinicalState["systemSafetyTriggers"];
  soap: FinalClinicalReport["soap"];
}

export interface BlindCaseResult extends BlindCaseScore {
  trace: BlindCaseTrace;
}

export interface BlindRunReport {
  runId: string;
  generatedAt: string;
  gitCommitExpected: string;
  provider: string;
  model: string;
  promptVersion: string;
  clinicalStateVersion: string;
  safetyVersion: string;
  knowledgeVersion: string;
  scorerVersion: string;
  holdoutId: string;
  casesHash: string;
  temperature: { update: number; finalize: number };
  maxCompletionTokens: { update: number; finalize: number };
  totals: {
    cases: number;
    pass: number;
    fail: number;
    meanScore: number;
    criticalDiagnosisRecall: number;
    criticalPrecision: number;
    dangerousDifferentialRelevance: number;
    criticalQuestionRecall: number;
    workupRelevance: number;
    casesWithFabricationRate: number;
    fabricatedFactCount: number;
    criticalHallucinations: number;
    unsafeRecommendationRate: number;
    soapFidelity: number;
    overtriageRate: number;
    undertriageRate: number;
    criticalFailCount: number;
    meanUpdateLatencyMs: number;
    meanFinalizeLatencyMs: number;
  };
  gates: ReturnType<typeof evaluateBlindGates>;
  cases: BlindCaseResult[];
}

function verifyFreeze(): void {
  if (!existsSync(FREEZE_PATH)) {
    throw new Error("Freeze ausente: evaluation/blind/V1_3_FREEZE.md");
  }
  if (CLINICAL_PROMPT_VERSION !== "1.3") {
    throw new Error(`Prompt não congelado: ${CLINICAL_PROMPT_VERSION}`);
  }
  if (CLINICAL_STATE_VERSION !== "1.3" || CLINICAL_SAFETY_VERSION !== "1.3") {
    throw new Error("State/Safety não estão em 1.3");
  }
  if (AI_CONFIG.clinicalModel !== "gpt-4o-mini") {
    throw new Error(`Modelo não congelado: ${AI_CONFIG.clinicalModel}`);
  }
}

export function expectedCasesHash(): string {
  return hashBlindCases(BLIND_V14_CASES);
}

function verifyHash(): string {
  const hash = expectedCasesHash();
  const freeze = readFileSync(FREEZE_PATH, "utf8");
  if (!freeze.includes(hash)) {
    throw new Error(
      `BLIND_CASESET_SHA256 no freeze não bate com o conjunto atual (${hash}). Atualize o freeze ANTES do FIRST_RUN, nunca depois.`,
    );
  }
  return hash;
}

function nextRunId(): string {
  const forced = process.env.BLIND_RUN_ID;
  if (forced) return forced;
  if (!existsSync(path.join(RESULTS_DIR, "FIRST_RUN.json"))) return "FIRST_RUN";
  if (!existsSync(path.join(RESULTS_DIR, "SECOND_RUN.json"))) return "SECOND_RUN";
  if (!existsSync(path.join(RESULTS_DIR, "THIRD_RUN.json"))) return "THIRD_RUN";
  throw new Error("Runs FIRST/SECOND/THIRD já existem. Defina BLIND_RUN_ID.");
}

function assertNotOverwrite(runId: string): void {
  const target = path.join(RESULTS_DIR, `${runId}.json`);
  if (existsSync(target)) {
    throw new Error(`${runId}.json já existe e é imutável. Não sobrescrever.`);
  }
}

async function runOne(testCase: BlindClinicalCase): Promise<BlindCaseResult> {
  let state: ClinicalState = createEmptyClinicalState();
  let transcript = "";
  let updateMs = 0;
  for (const segment of testCase.transcriptSegments) {
    transcript = transcript ? `${transcript} ${segment}` : segment;
    const previous = state;
    const started = Date.now();
    state = await withRetry(() =>
      clinicalAIProvider.update({
        currentState: previous,
        confirmedTranscript: transcript,
        newSegment: segment,
      }),
    );
    updateMs += Date.now() - started;
    await sleep(2_000);
  }
  const finalizeStarted = Date.now();
  const report = await withRetry(() =>
    clinicalAIProvider.finalize({
      transcript,
      state,
    }),
  );
  const scored = scoreBlindCase({
    case: testCase,
    transcript,
    state,
    report,
    latencyMs: {
      update: Math.round(updateMs / Math.max(testCase.transcriptSegments.length, 1)),
      finalize: Date.now() - finalizeStarted,
    },
  });
  return {
    ...scored,
    trace: {
      transcript,
      hypotheses: state.hypotheses,
      dangerousDifferentials: state.dangerousDifferentials,
      questions: state.suggestedQuestions,
      tests: state.suggestedTests,
      alerts: state.alerts,
      safety: state.systemSafetyTriggers,
      soap: report.soap,
    },
  };
}

function rate(hit: number, total: number): number {
  return total === 0 ? 1 : hit / total;
}

export function buildBlindReport(runId: string, scores: BlindCaseResult[], casesHash: string): BlindRunReport {
  const mustNotMissCases = scores.filter((item) => {
    const source = BLIND_V14_CASES.find((candidate) => candidate.id === item.id.split("#")[0]);
    return (source?.expected.mustNotMiss?.length ?? 0) > 0;
  });
  const recallHits = mustNotMissCases.filter((item) => item.emergencyRecall === "PASS").length;
  const justified = scores.reduce((sum, item) => sum + item.justifiedCriticalCount, 0);
  const suggested = scores.reduce((sum, item) => sum + item.suggestedCriticalCount, 0);
  const questionHit = scores.reduce((sum, item) => sum + item.criticalQuestions.hit, 0);
  const questionTotal = scores.reduce((sum, item) => sum + item.criticalQuestions.total, 0);
  const workupPass = scores.filter((item) => item.workupRelevance === "PASS").length;
  const hallCases = scores.filter((item) => item.casesWithFabrication).length;
  const facts = scores.reduce((sum, item) => sum + item.hallucinations, 0);
  const critHall = scores.filter((item) =>
    item.hallucinationEvents.some((event) => event.severity === "critical"),
  ).length;
  const unsafe = scores.reduce((sum, item) => sum + item.unsafeCritical, 0);
  const soapPass = scores.filter((item) => item.soapFidelity === "PASS").length;
  const benign = scores.filter((item) => item.severity === "benign");
  const over = benign.filter((item) => item.overtriage).length;
  const under = scores.filter((item) => item.undertriage).length;
  const pass = scores.filter((item) => item.status === "PASS").length;
  const mean = scores.reduce((sum, item) => sum + item.score, 0) / (scores.length || 1);
  const criticalFails = scores.filter((item) => item.failSeverity === "CRITICAL_FAIL").length;
  const precision = suggested === 0 ? 1 : justified / suggested;

  const metrics = {
    criticalDiagnosisRecall: rate(recallHits, mustNotMissCases.length),
    criticalFails,
    criticalHallucinations: critHall,
    casesWithFabricationRate: rate(hallCases, scores.length),
    soapFidelity: rate(soapPass, scores.length),
    unsafeRecommendations: unsafe,
    undertriageCriticalRate: rate(under, mustNotMissCases.length),
    criticalPrecision: precision,
    overtriageRate: rate(over, benign.length || 1),
  };

  return {
    runId,
    generatedAt: new Date().toISOString(),
    gitCommitExpected: FROZEN_COMMIT,
    provider: "openai",
    model: AI_CONFIG.clinicalModel,
    promptVersion: CLINICAL_PROMPT_VERSION,
    clinicalStateVersion: CLINICAL_STATE_VERSION,
    safetyVersion: CLINICAL_SAFETY_VERSION,
    knowledgeVersion: CLINICAL_KNOWLEDGE_VERSION,
    scorerVersion: BLIND_SCORER_VERSION,
    holdoutId: BLIND_HOLDOUT_ID,
    casesHash,
    temperature: { update: AI_CONFIG.temperature.update, finalize: AI_CONFIG.temperature.finalize },
    maxCompletionTokens: {
      update: AI_CONFIG.maxCompletionTokens.update,
      finalize: AI_CONFIG.maxCompletionTokens.finalize,
    },
    totals: {
      cases: scores.length,
      pass,
      fail: scores.length - pass,
      meanScore: Math.round(mean * 10) / 10,
      criticalDiagnosisRecall: Math.round(metrics.criticalDiagnosisRecall * 1000) / 10,
      criticalPrecision: Math.round(precision * 1000) / 10,
      dangerousDifferentialRelevance: Math.round(precision * 1000) / 10,
      criticalQuestionRecall: Math.round(rate(questionHit, questionTotal) * 1000) / 10,
      workupRelevance: Math.round(rate(workupPass, scores.length) * 1000) / 10,
      casesWithFabricationRate: Math.round(metrics.casesWithFabricationRate * 1000) / 10,
      fabricatedFactCount: facts,
      criticalHallucinations: critHall,
      unsafeRecommendationRate: scores.length === 0 ? 0 : Math.round((unsafe / scores.length) * 1000) / 10,
      soapFidelity: Math.round(metrics.soapFidelity * 1000) / 10,
      overtriageRate: Math.round(metrics.overtriageRate * 1000) / 10,
      undertriageRate: Math.round(metrics.undertriageCriticalRate * 1000) / 10,
      criticalFailCount: criticalFails,
      meanUpdateLatencyMs: Math.round(
        scores.reduce((sum, item) => sum + (item.latencyMs?.update ?? 0), 0) / (scores.length || 1),
      ),
      meanFinalizeLatencyMs: Math.round(
        scores.reduce((sum, item) => sum + (item.latencyMs?.finalize ?? 0), 0) / (scores.length || 1),
      ),
    },
    gates: evaluateBlindGates({
      criticalDiagnosisRecall: metrics.criticalDiagnosisRecall,
      criticalFails: metrics.criticalFails,
      criticalHallucinations: metrics.criticalHallucinations,
      casesWithFabricationRate: metrics.casesWithFabricationRate,
      soapFidelity: metrics.soapFidelity,
      unsafeRecommendations: metrics.unsafeRecommendations,
      undertriageCriticalRate: metrics.undertriageCriticalRate,
      criticalPrecision: metrics.criticalPrecision,
      overtriageRate: metrics.overtriageRate,
    }),
    cases: scores,
  };
}

function writeMarkdown(report: BlindRunReport): string {
  return [
    `# Blind clinical challenge ${report.runId}`,
    "",
    `- Generated: ${report.generatedAt}`,
    `- Frozen commit: ${report.gitCommitExpected}`,
    `- Model: ${report.model}`,
    `- Prompt/state/safety/knowledge: ${report.promptVersion} / ${report.clinicalStateVersion} / ${report.safetyVersion} / ${report.knowledgeVersion}`,
    `- Scorer: ${report.scorerVersion}`,
    `- Cases hash: ${report.casesHash}`,
    `- Temperature: ${report.temperature.update} / ${report.temperature.finalize}`,
    "",
    `PASS ${report.totals.pass} / FAIL ${report.totals.fail} / mean ${report.totals.meanScore}`,
    `Critical recall ${report.totals.criticalDiagnosisRecall}% · Critical precision ${report.totals.criticalPrecision}%`,
    `Hallucination (casos) ${report.totals.casesWithFabricationRate}% · facts ${report.totals.fabricatedFactCount}`,
    `SOAP ${report.totals.soapFidelity}% · Overtriage ${report.totals.overtriageRate}% · Undertriage ${report.totals.undertriageRate}%`,
    `Critical fails ${report.totals.criticalFailCount} · Critical hallucinations ${report.totals.criticalHallucinations}`,
    `Gate: ${report.gates.overall}`,
    "",
    "| Case | Bucket | Score | Status | Emergency | Over | Under | Hall | Prec |",
    "|---|---|---:|---|---|---|---|---:|---:|",
    ...report.cases.map(
      (item) =>
        `| ${item.id} | ${item.severity} | ${item.score} | ${item.status} | ${item.emergencyRecall} | ${item.overtriage ? "Y" : ""} | ${item.undertriage ? "Y" : ""} | ${item.hallucinations} | ${Math.round(item.criticalPrecision * 100)}% |`,
    ),
    "",
    formatClinicalGateReport(report.gates),
    "",
    "Este resultado é avaliação sintética interna de engenharia. Não constitui validação clínica, certificação, aprovação regulatória nem demonstração de segurança para uso clínico autônomo.",
    "",
  ].join("\n");
}

export function writeBlindReport(report: BlindRunReport): void {
  mkdirSync(RESULTS_DIR, { recursive: true });
  const jsonPath = path.join(RESULTS_DIR, `${report.runId}.json`);
  assertNotOverwrite(report.runId);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeFileSync(path.join(RESULTS_DIR, `${report.runId}.md`), writeMarkdown(report));
}

function selectedCases(): BlindClinicalCase[] {
  const suite = process.env.EVAL_BLIND_SUITE || "full";
  const filters = (process.env.EVAL_FILTER || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  let cases = BLIND_V14_CASES;
  if (suite === "stability") {
    cases = cases.filter((item) => item.severity === "critical");
  }
  if (filters.length) {
    cases = cases.filter((item) =>
      filters.some((filter) => item.id.includes(filter) || item.severity.includes(filter)),
    );
  }
  return cases;
}

export async function runBlindEvaluation(): Promise<BlindRunReport> {
  if (!getOpenAiApiKey()) {
    throw new Error("OPENAI_API_KEY ausente.");
  }
  verifyFreeze();
  const casesHash = verifyHash();
  const runId = nextRunId();
  assertNotOverwrite(runId);

  const repeats = Math.max(1, Number(process.env.EVAL_REPEAT || 1) || 1);
  const selected = selectedCases();
  const scores: BlindCaseResult[] = [];

  for (const testCase of selected) {
    for (let round = 0; round < repeats; round += 1) {
      const label = repeats > 1 ? `${testCase.id}#${round + 1}` : testCase.id;
      try {
        const scored = await runOne(testCase);
        const named = repeats > 1 ? { ...scored, id: label, title: `${scored.title} (${round + 1}/${repeats})` } : scored;
        scores.push(named);
        console.log(`\nCASE: ${named.id}`);
        console.log(`STATUS: ${named.status}  score ${named.score}  recall ${named.emergencyRecall}  over ${named.overtriage}  under ${named.undertriage}`);
        if (named.failReasons.length) {
          for (const reason of named.failReasons) console.log(`  - ${reason}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "erro";
        scores.push({
          id: label,
          title: testCase.title,
          category: testCase.category,
          emergencyRecall: "FAIL",
          criticalQuestions: { hit: 0, total: testCase.expected.shouldAsk?.length ?? 0 },
          hallucinations: 0,
          hallucinationEvents: [],
          casesWithFabrication: false,
          soapFidelity: "FAIL",
          workup: "FAIL",
          score: 0,
          status: "FAIL",
          failSeverity: "CRITICAL_FAIL",
          failReasons: [message.slice(0, 200)],
          notes: [message.slice(0, 200)],
          scorerVersion: BLIND_SCORER_VERSION,
          severity: testCase.severity,
          overtriage: false,
          undertriage: true,
          unjustifiedCriticalCount: 0,
          suggestedCriticalCount: 0,
          justifiedCriticalCount: 0,
          criticalPrecision: 1,
          workupExcess: false,
          workupRelevance: "FAIL",
          unsafeCritical: 0,
          trace: {
            transcript: testCase.transcriptSegments.join(" "),
            hypotheses: [],
            dangerousDifferentials: [],
            questions: [],
            tests: [],
            alerts: [],
            safety: [],
            soap: { subjective: "", objective: "", assessment: "", plan: "" },
          },
        });
        console.log(`\nCASE: ${label}`);
        console.log(`STATUS: FAIL  ${message}`);
      }
      await sleep(4_000);
    }
  }

  const report = buildBlindReport(runId, scores, casesHash);
  writeBlindReport(report);
  console.log(`\n${report.totals.cases} cases`);
  console.log(`PASS: ${report.totals.pass}`);
  console.log(`FAIL: ${report.totals.fail}`);
  console.log(`Mean score: ${report.totals.meanScore}`);
  console.log(`Critical recall: ${report.totals.criticalDiagnosisRecall}%`);
  console.log(`Critical precision: ${report.totals.criticalPrecision}%`);
  console.log(`Overtriage: ${report.totals.overtriageRate}%`);
  console.log(`Undertriage: ${report.totals.undertriageRate}%`);
  console.log(`Hallucination: ${report.totals.casesWithFabricationRate}% (${report.totals.fabricatedFactCount} facts)`);
  console.log(`SOAP: ${report.totals.soapFidelity}%`);
  console.log(`Critical fails: ${report.totals.criticalFailCount}`);
  console.log(`\n${formatClinicalGateReport(report.gates)}`);
  return report;
}
