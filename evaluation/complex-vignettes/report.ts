import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ClinicalQualityGateReport } from "../clinical-gates";
import { caseWordCount } from "./types";
import type { ComplexCaseScore } from "./scorer";
import { ECCV_V1_CASES, eccvDatasetStats } from "./v1";

const V1_DIR = path.join(process.cwd(), "evaluation/complex-vignettes/v1");
const RESULTS_DIR = path.join(V1_DIR, "results");

interface ComplexRunSnapshot {
  generatedAt: string;
  model: string;
  promptVersion: string;
  clinicalStateVersion: string;
  safetyVersion: string;
  knowledgeVersion: string;
  scorerVersion: string;
  casesHash: string;
  totals: Record<string, number>;
  gates: ClinicalQualityGateReport;
  cases: ComplexCaseScore[];
}

function readRun(name: string): ComplexRunSnapshot | null {
  const file = path.join(RESULTS_DIR, `${name}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as ComplexRunSnapshot;
}

function pct(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function group<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of items) {
    const k = key(item);
    (out[k] ??= []).push(item);
  }
  return out;
}

function subsetLines(scores: ComplexCaseScore[], label: (item: ComplexCaseScore) => string): string[] {
  const buckets = group(scores, label);
  return Object.keys(buckets)
    .sort()
    .map((key) => {
      const list = buckets[key]!;
      const pass = list.filter((item) => item.status === "PASS" && item.failureKinds.length === 0).length;
      const mean = list.reduce((sum, item) => sum + item.score, 0) / list.length;
      return `- ${key}: n=${list.length} PASS ${pass} mean ${mean.toFixed(1)}`;
    });
}

function failureNarrative(score: ComplexCaseScore): string {
  const lines = [
    `### ${score.id} — ${score.title}`,
    "",
    `- Difficulty: ${score.difficulty}  Criticality: ${score.criticality}  Complexity: ${score.complexityScore}`,
    `- Domain: ${score.domain}`,
    `- Status: ${score.status}  score ${score.score}`,
    `- Kinds: ${score.failureKinds.join(", ") || "—"}`,
    `- Diverge segment: ${score.divergeSegmentId ?? "—"}`,
    "",
  ];
  if (score.segmentTrace.length) {
    lines.push("Segment trace:");
    for (const step of score.segmentTrace) {
      lines.push(
        `- ${step.segmentId} (${step.kind ?? "other"}): mustNotMiss ${step.mustNotMissHit}/${step.mustNotMissTotal}; distractors ${step.distractorHits}; urgency ${step.urgencyMarks}${step.notes.length ? `; ${step.notes.join("; ")}` : ""}`,
      );
    }
    lines.push("");
  }
  for (const reason of score.failReasons) {
    lines.push(`- ${reason}`);
  }
  lines.push("");
  return lines.join("\n");
}

export function writeComplexReports(firstRun: ComplexRunSnapshot): void {
  const stats = eccvDatasetStats();
  const hard = readRun("HARD_RUN");
  const stability = readRun("STABILITY_RUN");
  const failures = firstRun.cases.filter((item) => item.status === "FAIL" || item.failureKinds.length > 0);

  const report = [
    "# ECCV-1 COMPLEX_CASE_REPORT",
    "",
    "_Engineering only. Not clinical validation, certification, or evidence of safety for clinical use._",
    "",
    "## Dataset design",
    "",
    `- Name: EMERIQ COMPLEX CLINICAL VIGNETTES (ECCV-1)`,
    `- Cases: ${stats.cases}`,
    `- Hash: \`${firstRun.casesHash}\``,
    `- Model: ${firstRun.model} (único clinicalModel no repositório; sem A/B)`,
    `- Prompt / State / Safety / Knowledge: ${firstRun.promptVersion} / ${firstRun.clinicalStateVersion} / ${firstRun.safetyVersion} / ${firstRun.knowledgeVersion}`,
    `- Complex scorer: ${firstRun.scorerVersion}`,
    "",
    "## Case distribution",
    "",
    ...Object.entries(stats.byDomain).map(([key, value]) => `- ${key}: ${value}`),
    "",
    `- moderate: ${stats.byDifficulty.moderate}`,
    `- hard: ${stats.byDifficulty.hard}`,
    `- very_hard: ${stats.byDifficulty.very_hard}`,
    "",
    "## Dataset metrics",
    "",
    `- Average variable count: ${stats.meanVariableCount.toFixed(1)}`,
    `- Average segment count: ${stats.meanSegmentCount.toFixed(1)}`,
    `- Average word count: ${stats.meanWordCount.toFixed(0)}`,
    `- Average distractor count: ${stats.meanDistractorCount.toFixed(1)}`,
    `- complexityScore ≥ 8: ${stats.complexityAtLeast8}`,
    `- multimorbidity: ${stats.multimorbidity}`,
    `- polypharmacy: ${stats.polypharmacy}`,
    `- vitalsChange: ${stats.vitalsChange}`,
    `- undertriage-test: ${stats.undertriageTest}`,
    `- overtriage-test: ${stats.overtriageTest}`,
    `- late reveal cases: ${stats.lateRevealCases}`,
    `- correction cases: ${stats.correctionCases}`,
    `- deterioration: ${stats.deterioration}`,
    `- Word count range: ${Math.min(...ECCV_V1_CASES.map(caseWordCount))}–${Math.max(...ECCV_V1_CASES.map(caseWordCount))}`,
    "",
    "## FIRST_RUN results",
    "",
    `- Generated: ${firstRun.generatedAt}`,
    `- PASS ${firstRun.totals.pass} / FAIL ${firstRun.totals.fail} / mean ${firstRun.totals.meanScore}`,
    `- Gate: **${firstRun.gates.overall}**`,
    "",
    "## Critical metrics",
    "",
    ...firstRun.gates.results.map(
      (item) =>
        `- ${item.name}: ${typeof item.actual === "number" && item.actual <= 1 && item.name !== "criticalFails" && item.name !== "criticalHallucinations" && item.name !== "unsafeRecommendations" ? pct(item.actual) : item.actual} (${item.comparator} ${item.required}) ${item.pass ? "PASS" : "FAIL"}`,
    ),
    "",
    "## Complex integration / temporal / distractors",
    "",
    `- Complex Case Integration: ${pct(firstRun.totals.complexIntegration as number)}`,
    `- Temporal Update: ${pct(firstRun.totals.temporalUpdate as number)}`,
    `- Distractor Resistance: ${pct(firstRun.totals.distractorResistance as number)}`,
    `- Premature Closure Rate: ${pct(firstRun.totals.prematureClosureRate as number)}`,
    `- Anchoring Error Rate: ${pct(firstRun.totals.anchoringErrorRate as number)}`,
    `- Late Information Integration: ${pct(firstRun.totals.lateInformationIntegration as number)}`,
    `- Correction Handling: ${pct(firstRun.totals.correctionHandling as number)}`,
    "",
    "## Results by specialty",
    "",
    ...subsetLines(firstRun.cases, (item) => item.domain),
    "",
    "## Results by difficulty",
    "",
    ...subsetLines(firstRun.cases, (item) => item.difficulty),
    "",
    "## Results by complexity score",
    "",
    ...subsetLines(firstRun.cases, (item) => String(item.complexityScore)),
    "",
    "## Model comparison",
    "",
    "Único modelo clínico declarado em `AI_CONFIG.clinicalModel`: `gpt-4o-mini`. Não há candidato mais forte no repositório. Comparação A/B **não executada** (não inventar ID). Roteamento por complexidade: experimento futuro, **não ativado**.",
    "",
    "## Hard subset",
    "",
    hard
      ? `- PASS ${hard.totals.pass} / FAIL ${hard.totals.fail} / gate ${hard.gates.overall}`
      : "_Ainda não executado (`pnpm eval:clinical:complex:hard`)._",
    "",
    "## Stability (very_hard ∩ critical, 3×)",
    "",
    stability
      ? `- runs: ${stability.totals.cases}  PASS ${stability.totals.pass}  FAIL ${stability.totals.fail}  gate ${stability.gates.overall}`
      : "_Ainda não executado (`pnpm eval:clinical:complex:stability`)._",
    "",
    "## Failures",
    "",
    failures.length
      ? `Ver \`evaluation/complex-vignettes/v1/results/FAILURE_REPORT.md\` (${failures.length} casos).`
      : "Nenhuma falha no FIRST_RUN.",
    "",
    "## Post-run policy",
    "",
    "Gates definidos **antes** do FIRST_RUN. Este relatório **não** altera prompt, ClinicalState, Safety, knowledge, aliases, scorer v1.3 nem o modelo.",
    "",
  ].join("\n");

  writeFileSync(path.join(V1_DIR, "COMPLEX_CASE_REPORT.md"), report);

  const failureDoc = [
    "# ECCV-1 FAILURE_REPORT",
    "",
    "_Engineering only. Not clinical validation._",
    "",
    `Run: FIRST_RUN  Generated: ${firstRun.generatedAt}  Hash: \`${firstRun.casesHash}\``,
    "",
    failures.length === 0
      ? "Nenhuma falha."
      : failures.map(failureNarrative).join("\n"),
  ].join("\n");
  writeFileSync(path.join(RESULTS_DIR, "FAILURE_REPORT.md"), failureDoc);
}
