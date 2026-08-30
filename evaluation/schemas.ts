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
  soapFidelity: "PASS" | "FAIL";
  workup: "PASS" | "FAIL";
  score: number;
  status: "PASS" | "FAIL";
  failReasons: string[];
  notes: string[];
}

export interface EvaluationReport {
  generatedAt: string;
  provider: string;
  model: string;
  promptVersion: string;
  temperature: number;
  totals: {
    cases: number;
    pass: number;
    fail: number;
    meanScore: number;
    criticalDiagnosisRecall: number;
    hallucinationRate: number;
    soapFidelity: number;
  };
  cases: CaseScore[];
}
