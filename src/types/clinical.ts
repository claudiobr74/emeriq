export type {
  ClinicalAlert,
  ClinicalHypothesis,
  ClinicalState,
  ClinicalSuggestion,
  ClinicalTestResult,
  FinalClinicalReport,
  QuestionPriority,
  SoapNote,
  SuggestedQuestion,
} from "@/lib/clinical/schemas";

export type SessionPhase =
  | "idle"
  | "starting"
  | "listening"
  | "paused"
  | "finalizing"
  | "completed"
  | "error";

export type DisplayStatus =
  | "idle"
  | "starting"
  | "listening"
  | "transcribing"
  | "paused"
  | "processing"
  | "finalizing"
  | "completed"
  | "error";

export type TranscriptionChoice = "standard" | "turbo";

export type AnalysisPace = "fast" | "balanced" | "economical";

export interface AppSettings {
  transcription: TranscriptionChoice;
  analysisPace: AnalysisPace;
  showQuestions: boolean;
  showHypotheses: boolean;
  showAlerts: boolean;
  showTests: boolean;
  showTreatments: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  transcription: "standard",
  analysisPace: "balanced",
  showQuestions: true,
  showHypotheses: true,
  showAlerts: true,
  showTests: true,
  showTreatments: true,
};
