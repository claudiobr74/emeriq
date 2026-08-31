import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { AI_CONFIG } from "../src/config/ai";
import { createEmptyClinicalState } from "../src/lib/clinical/clinical-state";
import { getOpenAiApiKey } from "../src/lib/env";
import { clinicalAIProvider } from "../src/lib/openai/clinical";
import { CLINICAL_PROMPT_VERSION } from "../src/lib/clinical/prompts/version";
import {
  CLINICAL_KNOWLEDGE_VERSION,
  CLINICAL_SAFETY_VERSION,
  CLINICAL_STATE_VERSION,
} from "../src/lib/clinical/versions";
import { AppError, isRetryableClinicalError } from "../src/lib/errors";
import type { ClinicalState } from "../src/lib/clinical/schemas";
import { CLINICAL_CASES } from "./cases";
import {
  evaluateClinicalGates,
  formatClinicalGateReport,
} from "./clinical-gates";
import { GOLDEN_CRITICAL_CASE_IDS } from "./golden-critical/ids";
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
          ? Math.min(Math.max(error.retryAfterMs, 5_000), 240_000)
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
  const finalizeMs = Date.now() - finalizeStarted;

  const scored = scoreCase({
    case: testCase,
    transcript,
    state,
    report,
    latencyMs: {
      update: Math.round(updateMs / Math.max(testCase.transcriptSegments.length, 1)),
      finalize: finalizeMs,
    },
  });

  if (process.env.EVAL_DUMP === "1") {
    const dumpDir = path.join(REPORT_DIR, "dumps");
    mkdirSync(dumpDir, { recursive: true });
    writeFileSync(
      path.join(dumpDir, `${testCase.id}.json`),
      JSON.stringify(
        {
          id: testCase.id,
          transcript,
          safety: state.systemSafetyTriggers,
          keyPresence: state.keyPresence,
          hypotheses: state.hypotheses,
          dangerousDifferentials: state.dangerousDifferentials,
          questions: state.suggestedQuestions,
          soap: report.soap,
          score: scored,
        },
        null,
        2,
      ),
    );
  }

  return scored;
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
  if (score.failSeverity) console.log(`Severity: ${score.failSeverity}`);
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
  const hallCases = scores.filter((item) => (item.hallucinations ?? 0) > 0).length;
  const fabricatedFactCount = scores.reduce((sum, item) => sum + (item.hallucinations ?? 0), 0);
  const soapPass = scores.filter((item) => item.soapFidelity === "PASS").length;
  const mean = scores.reduce((sum, item) => sum + item.score, 0) / (scores.length || 1);
  const criticalFails = scores.filter((item) => item.failSeverity === "CRITICAL_FAIL").length;
  const criticalHallucinations = scores.reduce(
    (sum, item) =>
      sum + (item.hallucinationEvents ?? []).filter((event) => event.severity === "critical").length,
    0,
  );
  const unsafe = scores.filter((item) =>
    item.failReasons.some((reason) => reason.includes("insegura")),
  ).length;
  const updates = scores.map((item) => item.latencyMs?.update ?? 0);
  const finals = scores.map((item) => item.latencyMs?.finalize ?? 0);
  const criticalDiagnosisRecall =
    withCritical.length === 0 ? 1 : criticalHits / withCritical.length;
  const hallucinationRate = scores.length === 0 ? 0 : hallCases / scores.length;
  const soapFidelity = scores.length === 0 ? 0 : soapPass / scores.length;

  const gates = evaluateClinicalGates({
    criticalDiagnosisRecall,
    soapFidelity,
    hallucinationRate,
    unsupportedGroundingRate: 0,
    criticalUnsafeRecommendations: unsafe,
    criticalFails,
    criticalHallucinations,
  });

  return {
    generatedAt: new Date().toISOString(),
    provider: "openai",
    model: AI_CONFIG.clinicalModel,
    promptVersion: CLINICAL_PROMPT_VERSION,
    clinicalStateVersion: CLINICAL_STATE_VERSION,
    safetyVersion: CLINICAL_SAFETY_VERSION,
    knowledgeVersion: CLINICAL_KNOWLEDGE_VERSION,
    temperature: AI_CONFIG.temperature.update,
    totals: {
      cases: scores.length,
      pass,
      fail: scores.length - pass,
      meanScore: Math.round(mean * 10) / 10,
      criticalDiagnosisRecall: Math.round(criticalDiagnosisRecall * 1000) / 10,
      hallucinationRate: Math.round(hallucinationRate * 1000) / 10,
      casesWithFabricationRate: Math.round(hallucinationRate * 1000) / 10,
      fabricatedFactCount,
      soapFidelity: Math.round(soapFidelity * 1000) / 10,
      criticalFails,
      criticalHallucinations,
      unsupportedGroundingRate: 0,
      criticalUnsafeRecommendations: unsafe,
      meanUpdateLatencyMs: Math.round(updates.reduce((a, b) => a + b, 0) / (updates.length || 1)),
      meanFinalizeLatencyMs: Math.round(finals.reduce((a, b) => a + b, 0) / (finals.length || 1)),
    },
    gates,
    cases: scores,
  };
}

function orderedScores(scores: CaseScore[]): CaseScore[] {
  const byId = new Map(scores.map((item) => [item.id, item]));
  const ordered = CLINICAL_CASES.map((item) => byId.get(item.id)).filter(
    (item): item is CaseScore => Boolean(item),
  );
  for (const score of scores) {
    if (!ordered.some((item) => item.id === score.id)) ordered.push(score);
  }
  return ordered;
}

export function writeReports(report: EvaluationReport) {
  mkdirSync(REPORT_DIR, { recursive: true });
  const shouldMerge = process.env.EVAL_RESUME === "1" || Boolean(process.env.EVAL_LIMIT);
  let next: EvaluationReport = {
    ...report,
    cases: orderedScores(report.cases),
  };
  const rebuilt = buildReport(next.cases);
  next = { ...rebuilt, generatedAt: report.generatedAt };
  if (shouldMerge) {
    const previous = loadPreviousReport();
    if (previous?.clinicalStateVersion === CLINICAL_STATE_VERSION) {
      const byId = new Map(previous.cases.map((item) => [item.id, item]));
      for (const score of report.cases) byId.set(score.id, score);
      next = buildReport(orderedScores([...byId.values()]));
      next.generatedAt = report.generatedAt;
    }
  }
  writeFileSync(LATEST_JSON, JSON.stringify(next, null, 2));
  const md = [
    `# Clinical evaluation ${next.promptVersion}`,
    "",
    `- Generated: ${next.generatedAt}`,
    `- Provider: ${next.provider}`,
    `- Model: ${next.model}`,
    `- Prompt: ${next.promptVersion}`,
    `- ClinicalState: ${next.clinicalStateVersion}`,
    `- Safety: ${next.safetyVersion}`,
    `- Knowledge: ${next.knowledgeVersion}`,
    `- Temperature: ${next.temperature}`,
    "",
    `PASS ${next.totals.pass} / FAIL ${next.totals.fail} / mean ${next.totals.meanScore}`,
    `Critical recall ${next.totals.criticalDiagnosisRecall}% · Hallucination (cases) ${next.totals.hallucinationRate}% · SOAP ${next.totals.soapFidelity}%`,
    `Critical fails ${next.totals.criticalFails} · Critical hallucinations ${next.totals.criticalHallucinations}`,
    next.gates ? `Gate: ${next.gates.overall}` : "",
    "",
    `| Case | Score | Status | Emergency | SOAP | Hallucinations |`,
    `|---|---:|---|---|---|---:|`,
    ...next.cases.map(
      (item) =>
        `| ${item.id} | ${item.score} | ${item.status} | ${item.emergencyRecall} | ${item.soapFidelity} | ${item.hallucinations} |`,
    ),
    "",
  ].join("\n");
  writeFileSync(path.join(REPORT_DIR, "latest.md"), md);
}

export async function runClinicalEvaluation(): Promise<EvaluationReport> {
  if (!getOpenAiApiKey()) {
    throw new Error("OPENAI_API_KEY ausente. Defina no ambiente para pnpm eval:clinical.");
  }

  const scores: CaseScore[] = [];
  const filters = parseFilters();
  const limit = Number(process.env.EVAL_LIMIT || CLINICAL_CASES.length);
  const resume = process.env.EVAL_RESUME === "1";
  const previous = resume ? loadPreviousReport() : null;
  const previousById = new Map((previous?.cases ?? []).map((item) => [item.id, item]));
  const suiteCritical = process.env.EVAL_SUITE === "critical";
  const repeats = Math.max(1, Number(process.env.EVAL_REPEAT || 1) || 1);

  const selected = CLINICAL_CASES.filter((item) => {
    if (suiteCritical) {
      return (GOLDEN_CRITICAL_CASE_IDS as readonly string[]).includes(item.id);
    }
    if (filters.length === 0) return true;
    return filters.some((filter) => item.id.includes(filter) || item.category.includes(filter));
  }).slice(0, Number.isFinite(limit) ? limit : CLINICAL_CASES.length);

  for (const testCase of selected) {
    const cached = previousById.get(testCase.id);
    if (resume && cached?.status === "PASS" && cached.failSeverity == null) {
      scores.push(cached);
      console.log(`\nCASE: ${testCase.id}`);
      console.log(`STATUS: PASS (resume)`);
      writeReports(buildReport(scores));
      continue;
    }

    for (let round = 0; round < repeats; round += 1) {
      const label = repeats > 1 ? `${testCase.id}#${round + 1}` : testCase.id;
      try {
        const score = await runCase(testCase);
        const named = repeats > 1 ? { ...score, id: label, title: `${score.title} (${round + 1}/${repeats})` } : score;
        scores.push(named);
        printCase(named);
      } catch (error) {
      const message = error instanceof Error ? error.message : "erro";
      const failed: CaseScore = {
        id: testCase.id,
        title: testCase.title,
        category: testCase.category,
        emergencyRecall: "FAIL",
        criticalQuestions: { hit: 0, total: testCase.expected.expectedQuestions?.length ?? 0 },
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
      };
      scores.push(failed);
      printCase(failed);
      }
      writeReports(buildReport(scores));
      await sleep(4_000);
    }
  }

  const report = buildReport(scores);
  console.log(`\n${report.totals.cases} cases`);
  console.log(`PASS: ${report.totals.pass}`);
  console.log(`FAIL: ${report.totals.fail}`);
  console.log(`Mean score: ${report.totals.meanScore}`);
  console.log(`Critical diagnosis recall: ${report.totals.criticalDiagnosisRecall}%`);
  console.log(`Hallucination rate: ${report.totals.hallucinationRate}% (${report.totals.fabricatedFactCount} facts / ${report.totals.casesWithFabricationRate}% of cases)`);
  console.log(`SOAP fidelity: ${report.totals.soapFidelity}%`);
  console.log(`Critical fails: ${report.totals.criticalFails}`);
  console.log(`Critical hallucinations: ${report.totals.criticalHallucinations}`);
  if (report.gates) {
    console.log(`\n${formatClinicalGateReport(report.gates)}`);
  }
  return report;
}
