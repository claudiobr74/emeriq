export type SafetyPriority = "critical" | "high" | "watch";

export interface SafetyTrigger {
  trigger: string;
  priority: SafetyPriority;
  matchedTerms: string[];
}

export interface SafetyEvaluationInput {
  transcript: string;
  newSegment?: string;
  chiefComplaint?: string | null;
  vitalSigns?: {
    bloodPressure: string | null;
    heartRate: number | null;
    respiratoryRate: number | null;
    oxygenSaturation: number | null;
    temperature: number | null;
    glasgow?: number | null;
    glucose: number | null;
  };
  medications?: string[];
}
