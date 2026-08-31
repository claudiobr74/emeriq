import { CARDIOVASCULAR_CASES } from "./cardiovascular";
import { GI_CASES } from "./gi";
import { INFECTIOUS_CASES } from "./infectious";
import { NEUROLOGIC_CASES } from "./neurologic";
import { OBGYN_CASES } from "./obgyn";
import { RESPIRATORY_CASES } from "./respiratory";
import { TOX_CASES } from "./tox-metabolic";
import { TRAUMA_CASES } from "./trauma";
import { UNDIFF_CASES } from "./undifferentiated";
import { caseWordCount } from "../types";
import type { ComplexDomain, ComplexVignetteCase } from "../types";

export const ECCV_V1_CASES: ComplexVignetteCase[] = [
  ...CARDIOVASCULAR_CASES,
  ...NEUROLOGIC_CASES,
  ...RESPIRATORY_CASES,
  ...INFECTIOUS_CASES,
  ...GI_CASES,
  ...TRAUMA_CASES,
  ...TOX_CASES,
  ...OBGYN_CASES,
  ...UNDIFF_CASES,
];

const DOMAIN_QUOTA: Record<ComplexDomain, number> = {
  cardiovascular: 10,
  neurologic: 8,
  respiratory: 8,
  infectious: 8,
  gi: 6,
  trauma: 5,
  tox_metabolic: 5,
  obgyn: 5,
  undifferentiated: 5,
};

const PREFIX: Record<ComplexDomain, string> = {
  cardiovascular: "ecc-cv-",
  neurologic: "ecc-neuro-",
  respiratory: "ecc-resp-",
  infectious: "ecc-inf-",
  gi: "ecc-gi-",
  trauma: "ecc-trauma-",
  tox_metabolic: "ecc-tox-",
  obgyn: "ecc-obg-",
  undifferentiated: "ecc-und-",
};

export interface EccvDatasetStats {
  cases: number;
  byDomain: Record<string, number>;
  byDifficulty: Record<string, number>;
  meanVariableCount: number;
  meanSegmentCount: number;
  meanWordCount: number;
  meanDistractorCount: number;
  complexityAtLeast8: number;
  multimorbidity: number;
  polypharmacy: number;
  vitalsChange: number;
  undertriageTest: number;
  overtriageTest: number;
  lateRevealCases: number;
  correctionCases: number;
  deterioration: number;
}

export function eccvDatasetStats(cases: ComplexVignetteCase[] = ECCV_V1_CASES): EccvDatasetStats {
  const byDomain: Record<string, number> = {};
  const byDifficulty: Record<string, number> = { moderate: 0, hard: 0, very_hard: 0 };
  for (const item of cases) {
    byDomain[item.domain] = (byDomain[item.domain] ?? 0) + 1;
    byDifficulty[item.difficulty] = (byDifficulty[item.difficulty] ?? 0) + 1;
  }
  const n = cases.length || 1;
  return {
    cases: cases.length,
    byDomain,
    byDifficulty,
    meanVariableCount: cases.reduce((sum, item) => sum + item.variableCount, 0) / n,
    meanSegmentCount: cases.reduce((sum, item) => sum + item.segments.length, 0) / n,
    meanWordCount: cases.reduce((sum, item) => sum + caseWordCount(item), 0) / n,
    meanDistractorCount: cases.reduce((sum, item) => sum + item.distractorCount, 0) / n,
    complexityAtLeast8: cases.filter((item) => item.complexityScore >= 8).length,
    multimorbidity: cases.filter((item) => item.flags.multimorbidity || item.comorbidities.length >= 2).length,
    polypharmacy: cases.filter((item) => item.flags.polypharmacy || item.medications.length >= 5).length,
    vitalsChange: cases.filter((item) => item.flags.vitalsChange || (item.vitalsTimeline?.length ?? 0) >= 2)
      .length,
    undertriageTest: cases.filter((item) => item.flags.undertriageTest).length,
    overtriageTest: cases.filter((item) => item.flags.overtriageTest).length,
    lateRevealCases: cases.filter((item) => item.lateRevealCount >= 1).length,
    correctionCases: cases.filter((item) => item.correctionCount >= 1).length,
    deterioration: cases.filter((item) => item.flags.deterioration).length,
  };
}

export function assertEccvCaseSet(cases: ComplexVignetteCase[] = ECCV_V1_CASES): void {
  const ids = cases.map((item) => item.id);
  if (ids.length !== 60) {
    throw new Error(`ECCV-1 deve ter 60 casos, tem ${ids.length}`);
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error("IDs duplicados no ECCV-1");
  }
  for (const item of cases) {
    if (!item.id.startsWith(PREFIX[item.domain])) {
      throw new Error(`${item.id}: prefixo incompatível com domínio ${item.domain}`);
    }
    if (item.complexityScore < 6) {
      throw new Error(`${item.id}: complexityScore < 6`);
    }
    if (item.segments.length < 8 || item.segments.length > 20) {
      throw new Error(`${item.id}: ${item.segments.length} segmentos`);
    }
    if (item.distractorCount < 2 || item.distractorCount > 6) {
      throw new Error(`${item.id}: distractors ${item.distractorCount}`);
    }
    if (item.variableCount < 12) {
      throw new Error(`${item.id}: variableCount ${item.variableCount}`);
    }
  }
  for (const [domain, expected] of Object.entries(DOMAIN_QUOTA)) {
    const actual = cases.filter((item) => item.domain === domain).length;
    if (actual !== expected) {
      throw new Error(`Domínio ${domain}: ${actual}, esperado ${expected}`);
    }
  }
  const stats = eccvDatasetStats(cases);
  if (stats.byDifficulty.moderate !== 10 || stats.byDifficulty.hard !== 30 || stats.byDifficulty.very_hard !== 20) {
    throw new Error(`Dificuldade inválida: ${JSON.stringify(stats.byDifficulty)}`);
  }
  if (stats.complexityAtLeast8 < 20) {
    throw new Error(`complexityScore>=8: ${stats.complexityAtLeast8}`);
  }
  if (stats.meanVariableCount < 18) {
    throw new Error(`variableCount médio ${stats.meanVariableCount}`);
  }
  if (stats.multimorbidity < 20) {
    throw new Error(`multimorbidade ${stats.multimorbidity}`);
  }
  if (stats.polypharmacy < 15) {
    throw new Error(`polifarmácia ${stats.polypharmacy}`);
  }
  if (stats.vitalsChange < 15) {
    throw new Error(`vitalsChange ${stats.vitalsChange}`);
  }
  if (stats.undertriageTest < 15) {
    throw new Error(`undertriageTest ${stats.undertriageTest}`);
  }
  if (stats.overtriageTest < 15) {
    throw new Error(`overtriageTest ${stats.overtriageTest}`);
  }
  if (stats.lateRevealCases < 30) {
    throw new Error(`late reveal em ${stats.lateRevealCases} casos`);
  }
  if (stats.correctionCases < 10) {
    throw new Error(`correções em ${stats.correctionCases} casos`);
  }
  if (stats.deterioration < 10) {
    throw new Error(`deterioração ${stats.deterioration}`);
  }
  const richLabs = cases.filter((item) => (item.labs?.length ?? 0) >= 5).length;
  if (richLabs < 30) {
    throw new Error(`labs>=5 em ${richLabs} casos`);
  }
}

assertEccvCaseSet();
