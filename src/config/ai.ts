export const AI_CONFIG = {
  // Transcrição via OpenAI (audio.transcriptions). "Alta precisão" usa o modelo
  // completo; "Tempo real" usa a variante mini (mais rápida). Rótulos de UX;
  // os IDs técnicos não são expostos ao médico (seção 46).
  transcriptionModel: "gpt-4o-transcribe",
  transcriptionModelTurbo: "gpt-4o-mini-transcribe",
  // Raciocínio clínico via OpenAI Chat Completions com saída JSON estruturada.
  clinicalModel: "gpt-4o-mini",
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
  temperature: {
    update: 0.2,
    finalize: 0.2,
  },
  timeouts: {
    transcriptionMs: 30_000,
    clinicalUpdateMs: 45_000,
    clinicalFinalizeMs: 60_000,
  },
  maxCompletionTokens: {
    update: 1_400,
    finalize: 1_800,
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
