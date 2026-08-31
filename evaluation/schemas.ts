import type { FailSeverity, HallucinationEvent } from "./clinical-gates";
import type { ClinicalQualityGateReport } from "./clinical-gates";

export interface ClinicalEvaluationCase {
  id: string;
  title: string;
  category: string;
  transcriptSegments: string[];
  expected: {
    mustConsider?: string[];
    mustNotMiss?: string[];
    expectedQuestions?: string[];
    expectedTests?: string[];
    expectedAlerts?: string[];
  };
  forbidden: {
    fabricatedFacts?: string[];
    unsafeRecommendations?: string[];
  };
}

export interface CaseScore {
  id: string;
  title: string;
  category: string;
  emergencyRecall: "PASS" | "FAIL";
  criticalQuestions: { hit: number; total: number };
  hallucinations: number;
  hallucinationEvents: HallucinationEvent[];
  casesWithFabrication: boolean;
  soapFidelity: "PASS" | "FAIL";
  workup: "PASS" | "FAIL";
  score: number;
  status: "PASS" | "FAIL";
  failSeverity: FailSeverity | null;
  failReasons: string[];
  notes: string[];
  latencyMs?: { update: number; finalize: number };
}

export interface EvaluationReport {
  generatedAt: string;
  provider: string;
  model: string;
  promptVersion: string;
  clinicalStateVersion: string;
  safetyVersion: string;
  knowledgeVersion: string;
  temperature: number;
  totals: {
    cases: number;
    pass: number;
    fail: number;
    meanScore: number;
    criticalDiagnosisRecall: number;
    hallucinationRate: number;
    casesWithFabricationRate: number;
    fabricatedFactCount: number;
    soapFidelity: number;
    criticalFails: number;
    criticalHallucinations: number;
    unsupportedGroundingRate: number;
    criticalUnsafeRecommendations: number;
    meanUpdateLatencyMs: number;
    meanFinalizeLatencyMs: number;
  };
  gates?: ClinicalQualityGateReport;
  cases: CaseScore[];
}
