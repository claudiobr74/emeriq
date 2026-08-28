import { z } from "zod";

export const prioritySchema = z.enum(["high", "medium", "low"]);
export const suggestionPrioritySchema = z.enum([
  "immediate",
  "urgent",
  "routine",
]);
export const alertSeveritySchema = z.enum(["critical", "warning", "info"]);

export const clinicalHypothesisSchema = z.object({
  diagnosis: z.string(),
  priority: prioritySchema,
  supportingFindings: z.array(z.string()),
  opposingFindings: z.array(z.string()),
  rationale: z.string().nullable(),
});

export const clinicalSuggestionSchema = z.object({
  item: z.string(),
  rationale: z.string(),
  priority: suggestionPrioritySchema.nullable(),
});

export const clinicalAlertSchema = z.object({
  severity: alertSeveritySchema,
  title: z.string(),
  message: z.string(),
});

export const clinicalStateSchema = z.object({
  patient: z.object({
    age: z.number().nullable(),
    sex: z.string().nullable(),
  }),
  chiefComplaint: z.string().nullable(),
  historyPresentIllness: z.object({
    onset: z.string().nullable(),
    duration: z.string().nullable(),
    location: z.string().nullable(),
    character: z.string().nullable(),
    radiation: z.string().nullable(),
    intensity: z.string().nullable(),
    aggravatingFactors: z.array(z.string()),
    relievingFactors: z.array(z.string()),
    associatedSymptoms: z.array(z.string()),
  }),
  pastMedicalHistory: z.array(z.string()),
  medications: z.array(z.string()),
  allergies: z.array(z.string()),
  riskFactors: z.array(z.string()),
  vitalSigns: z.object({
    bloodPressure: z.string().nullable(),
    heartRate: z.number().nullable(),
    respiratoryRate: z.number().nullable(),
    oxygenSaturation: z.number().nullable(),
    temperature: z.number().nullable(),
    glucose: z.number().nullable(),
  }),
  physicalExam: z.array(z.string()),
  positiveFindings: z.array(z.string()),
  negativeFindings: z.array(z.string()),
  reportedFacts: z.array(z.string()),
  observedFindings: z.array(z.string()),
  inferences: z.array(z.string()),
  hypotheses: z.array(clinicalHypothesisSchema).max(6),
  dangerousDifferentials: z.array(clinicalHypothesisSchema).max(5),
  missingInformation: z.array(z.string()).max(8),
  suggestedQuestions: z.array(z.string()).max(5),
  suggestedTests: z.array(clinicalSuggestionSchema).max(6),
  possibleTreatments: z.array(clinicalSuggestionSchema).max(6),
  alerts: z.array(clinicalAlertSchema).max(5),
});

export const soapSchema = z.object({
  subjective: z.string(),
  objective: z.string(),
  assessment: z.string(),
  plan: z.string(),
});

export const finalClinicalReportSchema = z.object({
  soap: soapSchema,
  hypotheses: z.array(clinicalHypothesisSchema).max(6),
  dangerousDifferentials: z.array(clinicalHypothesisSchema).max(5),
  suggestedTests: z.array(clinicalSuggestionSchema).max(6),
  possibleTreatments: z.array(clinicalSuggestionSchema).max(6),
  unresolvedQuestions: z.array(z.string()).max(10),
  alerts: z.array(clinicalAlertSchema).max(5),
});

export const clinicalUpdateRequestSchema = z.object({
  currentState: clinicalStateSchema,
  confirmedTranscript: z.string(),
  newSegment: z.string(),
  sequence: z.number().int().nonnegative(),
});

export const clinicalFinalizeRequestSchema = z.object({
  transcript: z.string(),
  state: clinicalStateSchema,
});

export type ClinicalState = z.infer<typeof clinicalStateSchema>;
export type ClinicalHypothesis = z.infer<typeof clinicalHypothesisSchema>;
export type ClinicalSuggestion = z.infer<typeof clinicalSuggestionSchema>;
export type ClinicalAlert = z.infer<typeof clinicalAlertSchema>;
export type FinalClinicalReport = z.infer<typeof finalClinicalReportSchema>;
export type SoapNote = z.infer<typeof soapSchema>;
