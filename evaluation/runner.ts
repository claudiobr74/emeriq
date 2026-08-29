import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { AI_CONFIG } from "../src/config/ai";
import { createEmptyClinicalState } from "../src/lib/clinical/clinical-state";
import { getGroqApiKey } from "../src/lib/env";
import { clinicalAIProvider } from "../src/lib/groq/clinical";
import { CLINICAL_PROMPT_VERSION } from "../src/lib/clinical/prompts/version";
import { AppError, isRetryableClinicalError } from "../src/lib/errors";
import type { ClinicalState } from "../src/lib/clinical/schemas";
import { CLINICAL_CASES } from "./cases";
import type { CaseScore, EvaluationReport } from "./schemas";
import { scoreCase } from "./scorer";

const REPORT_DIR = path.join(process.cwd(), "evaluation/reports");
const LATEST_JSON = path.join(REPORT_DIR, "latest.json");

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
      if (!isRetryableClinicalError(error) || i === attempts - 1) {
        throw error;
      }
      const wait =
        error instanceof AppError && error.retryAfterMs
          ? Math.min(Math.max(error.retryAfterMs, 5_000), 120_000)
          : 65_000;
      const message = error instanceof Error ? error.message.slice(0, 120) : "erro";
      console.error(`  retry ${i + 1}/${attempts - 1} in ${Math.round(wait / 1000)}s (${message})`);
      await sleep(wait);
    }
  }
  throw last;
}

async function runCase(testCase: (typeof CLINICAL_CASES)[number]): Promise<CaseScore> {
  let state: ClinicalState = createEmptyClinicalState();
  let transcript = "";
  for (const segment of testCase.transcriptSegments) {
    transcript = transcript ? `${transcript} ${segment}` : segment;
    const previous = state;
    state = await withRetry(() =>
      clinicalAIProvider.update({
        currentState: previous,
        confirmedTranscript: transcript,
        newSegment: segment,
      }),
    );
    await sleep(2_000);
  }

  const report = await withRetry(() =>
    clinicalAIProvider.finalize({
      transcript,
      state,
    }),
  );

  return scoreCase({ case: testCase, transcript, state, report });
}

function printCase(score: CaseScore) {
  console.log(`\nCASE: ${score.id}`);
  console.log(`Emergency Recall: ${score.emergencyRecall}`);
  console.log(
    `Critical Questions: ${score.criticalQuestions.hit}/${score.criticalQuestions.total || 0}`,
  );
  console.log(`Hallucinations: ${score.hallucinations}`);
  console.log(`SOAP Fidelity: ${score.soapFidelity}`);
  console.log(`Workup: ${score.workup}`);
  console.log(`Score: ${score.score}/100`);
  console.log(`STATUS: ${score.status}`);
  if (score.failReasons.length) {
    for (const reason of score.failReasons) console.log(`  - ${reason}`);
  }
}

function parseFilters(): string[] {
  return (process.env.EVAL_FILTER || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function loadPreviousReport(): EvaluationReport | null {
  try {
    if (!existsSync(LATEST_JSON)) return null;
    return JSON.parse(readFileSync(LATEST_JSON, "utf8")) as EvaluationReport;
  } catch {
    return null;
  }
}

function buildReport(scores: CaseScore[]): EvaluationReport {
  const pass = scores.filter((item) => item.status === "PASS").length;
  const withCritical = scores.filter((item) =>
    CLINICAL_CASES.find((c) => c.id === item.id)?.expected.mustNotMiss?.length,
  );
  const criticalHits = withCritical.filter((item) => item.emergencyRecall === "PASS").length;
  const hallCases = scores.filter((item) => item.hallucinations > 0).length;
  const soapPass = scores.filter((item) => item.soapFidelity === "PASS").length;
  const mean = scores.reduce((sum, item) => sum + item.score, 0) / (scores.length || 1);

  return {
    generatedAt: new Date().toISOString(),
    provider: "groq",
    model: AI_CONFIG.clinicalModel,
    promptVersion: CLINICAL_PROMPT_VERSION,
    reasoningLevel: AI_CONFIG.reasoning.update,
    totals: {
      cases: scores.length,
      pass,
      fail: scores.length - pass,
      meanScore: Math.round(mean * 10) / 10,
      criticalDiagnosisRecall:
        withCritical.length === 0 ? 100 : Math.round((criticalHits / withCritical.length) * 1000) / 10,
      hallucinationRate:
        scores.length === 0 ? 0 : Math.round((hallCases / scores.length) * 1000) / 10,
      soapFidelity: scores.length === 0 ? 0 : Math.round((soapPass / scores.length) * 1000) / 10,
    },
    cases: scores,
  };
}

export function writeReports(report: EvaluationReport) {
  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(LATEST_JSON, JSON.stringify(report, null, 2));
  const md = [
    `# Clinical evaluation ${report.promptVersion}`,
    "",
    `- Generated: ${report.generatedAt}`,
    `- Provider: ${report.provider}`,
    `- Model: ${report.model}`,
    `- Prompt: ${report.promptVersion}`,
    `- Reasoning: ${report.reasoningLevel}`,
    "",
    `PASS ${report.totals.pass} / FAIL ${report.totals.fail} / mean ${report.totals.meanScore}`,
    "",
    `| Case | Score | Status | Emergency | SOAP | Hallucinations |`,
    `|---|---:|---|---|---|---:|`,
    ...report.cases.map(
      (item) =>
        `| ${item.id} | ${item.score} | ${item.status} | ${item.emergencyRecall} | ${item.soapFidelity} | ${item.hallucinations} |`,
    ),
    "",
  ].join("\n");
  writeFileSync(path.join(REPORT_DIR, "latest.md"), md);
}

export async function runClinicalEvaluation(): Promise<EvaluationReport> {
  if (!getGroqApiKey()) {
    throw new Error("GROQ_API_KEY ausente. Defina no ambiente para pnpm eval:clinical.");
  }

  const scores: CaseScore[] = [];
  const filters = parseFilters();
  const limit = Number(process.env.EVAL_LIMIT || CLINICAL_CASES.length);
  const resume = process.env.EVAL_RESUME === "1";
  const previous = resume ? loadPreviousReport() : null;
  const previousById = new Map((previous?.cases ?? []).map((item) => [item.id, item]));

  const selected = CLINICAL_CASES.filter((item) =>
    filters.length === 0
      ? true
      : filters.some((filter) => item.id.includes(filter) || item.category.includes(filter)),
  ).slice(0, Number.isFinite(limit) ? limit : CLINICAL_CASES.length);

  for (const testCase of selected) {
    const cached = previousById.get(testCase.id);
    if (resume && cached?.status === "PASS") {
      scores.push(cached);
      console.log(`\nCASE: ${testCase.id}`);
      console.log(`STATUS: PASS (resume)`);
      writeReports(buildReport(scores));
      continue;
    }

    try {
      const score = await runCase(testCase);
      scores.push(score);
      printCase(score);
    } catch (error) {
      const message = error instanceof Error ? error.message : "erro";
      const failed: CaseScore = {
        id: testCase.id,
        title: testCase.title,
        category: testCase.category,
        emergencyRecall: "FAIL",
        criticalQuestions: { hit: 0, total: testCase.expected.expectedQuestions?.length ?? 0 },
        hallucinations: 0,
        soapFidelity: "FAIL",
        workup: "FAIL",
        score: 0,
        status: "FAIL",
        failReasons: [message.slice(0, 200)],
        notes: [message.slice(0, 200)],
      };
      scores.push(failed);
      printCase(failed);
    }
    writeReports(buildReport(scores));
    await sleep(4_000);
  }

  const report = buildReport(scores);
  console.log(`\n${report.totals.cases} cases`);
  console.log(`PASS: ${report.totals.pass}`);
  console.log(`FAIL: ${report.totals.fail}`);
  console.log(`Mean score: ${report.totals.meanScore}`);
  console.log(`Critical diagnosis recall: ${report.totals.criticalDiagnosisRecall}%`);
  console.log(`Hallucination rate: ${report.totals.hallucinationRate}%`);
  console.log(`SOAP fidelity: ${report.totals.soapFidelity}%`);
  return report;
}
