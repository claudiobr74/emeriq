export const AI_CONFIG = {
  // Transcrição OpenAI. Transporte principal: Realtime (streaming); fallback
  // degradado: audio/transcriptions (REST em chunks). "Alta precisão" usa o
  // modelo completo; "Tempo real" usa a variante mini. Rótulos de UX; os IDs
  // técnicos não são expostos ao médico (seção 46).
  transcription: {
    provider: "openai" as const,
    transport: "realtime" as const,
    model: "gpt-4o-transcribe" as const,
  },
  realtime: {
    // Modelo Realtime de transcrição e taxa de amostragem do PCM16 enviado.
    model: "gpt-4o-transcribe" as const,
    sampleRate: 24_000,
    // Backoff de reconexão (ms) e nº máximo de tentativas antes de degradar.
    reconnect: { baseDelayMs: 1_000, maxDelayMs: 15_000, maxAttempts: 4 },
  },
  transcriptionModel: "gpt-4o-transcribe",
  transcriptionModelTurbo: "gpt-4o-mini-transcribe",
  // Raciocínio clínico via OpenAI Chat Completions com saída JSON estruturada.
  clinicalModel: "gpt-4o-mini",
  chunkDurationMs: 6_000,
  chunkOverlapMs: 1_500,
  sampleRate: 16_000,
  minFlushDurationMs: 1_200,
  whisperLanguage: "pt" as const,
  // Cadência de análise = FREQUÊNCIA de atualização clínica (não é profundidade
  // de raciocínio). "balanced" é o padrão único exposto ao usuário.
  analysisCadence: {
    fast: { intervalMs: 8_000, minNewChars: 60 },
    balanced: { intervalMs: 12_000, minNewChars: 100 },
    economical: { intervalMs: 20_000, minNewChars: 180 },
  },
  defaultCadence: "balanced" as const,
  temperature: {
    update: 0.2,
    finalize: 0.2,
  },
  // Timeouts do cliente OpenAI (server-side), abaixo do maxDuration da rota para
  // falhar de forma controlada antes de a plataforma matar a função. Ver DEPLOYMENT.md.
  timeouts: {
    transcriptionMs: 28_000,
    clinicalUpdateMs: 43_000,
    clinicalFinalizeMs: 58_000,
  },
  // maxDuration (segundos) de cada rota — coerente com os timeouts acima.
  routeMaxDurationSec: {
    transcribe: 30,
    clinicalUpdate: 45,
    clinicalFinalize: 60,
  },
  maxCompletionTokens: {
    update: 1_400,
    finalize: 1_800,
  },
} as const;

export type TranscriptionModelId =
  | typeof AI_CONFIG.transcriptionModel
  | typeof AI_CONFIG.transcriptionModelTurbo;

export type AnalysisCadence = keyof typeof AI_CONFIG.analysisCadence;

export const ALLOWED_TRANSCRIPTION_MODELS: readonly TranscriptionModelId[] = [
  AI_CONFIG.transcriptionModel,
  AI_CONFIG.transcriptionModelTurbo,
];

export function isAllowedTranscriptionModel(
  value: string,
): value is TranscriptionModelId {
  return (ALLOWED_TRANSCRIPTION_MODELS as readonly string[]).includes(value);
}

export function getAnalysisCadence(
  cadence: AnalysisCadence = AI_CONFIG.defaultCadence,
) {
  return AI_CONFIG.analysisCadence[cadence];
}
