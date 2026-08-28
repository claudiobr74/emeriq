export const AI_CONFIG = {
  transcriptionModel: "whisper-large-v3",
  transcriptionModelTurbo: "whisper-large-v3-turbo",
  clinicalModel: "openai/gpt-oss-120b",
  chunkDurationMs: 6_000,
  chunkOverlapMs: 1_500,
  sampleRate: 16_000,
  minFlushDurationMs: 1_200,
  whisperLanguage: "pt" as const,
  analysis: {
    fast: { intervalMs: 8_000, minNewChars: 60 },
    balanced: { intervalMs: 12_000, minNewChars: 100 },
    economical: { intervalMs: 20_000, minNewChars: 180 },
  },
  reasoning: {
    update: "low" as const,
    finalize: "medium" as const,
  },
  timeouts: {
    transcriptionMs: 30_000,
    clinicalUpdateMs: 60_000,
    clinicalFinalizeMs: 90_000,
  },
  maxCompletionTokens: {
    update: 8_000,
    finalize: 10_000,
  },
} as const;

export type TranscriptionModelId =
  | typeof AI_CONFIG.transcriptionModel
  | typeof AI_CONFIG.transcriptionModelTurbo;

export type AnalysisPace = keyof typeof AI_CONFIG.analysis;

export const ALLOWED_TRANSCRIPTION_MODELS: readonly TranscriptionModelId[] = [
  AI_CONFIG.transcriptionModel,
  AI_CONFIG.transcriptionModelTurbo,
];

export function isAllowedTranscriptionModel(
  value: string,
): value is TranscriptionModelId {
  return (ALLOWED_TRANSCRIPTION_MODELS as readonly string[]).includes(value);
}

export function getAnalysisThresholds(pace: AnalysisPace) {
  return AI_CONFIG.analysis[pace];
}
