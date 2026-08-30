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
  | "reconnecting"
  | "paused"
  | "processing"
  | "finalizing"
  | "completed"
  | "error";

export type TranscriptionChoice = "standard" | "turbo";

export interface AppSettings {
  transcription: TranscriptionChoice;
  showQuestions: boolean;
  showHypotheses: boolean;
  showAlerts: boolean;
  showTests: boolean;
  showTreatments: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  transcription: "standard",
  showQuestions: true,
  showHypotheses: true,
  showAlerts: true,
  showTests: true,
  showTreatments: true,
};
