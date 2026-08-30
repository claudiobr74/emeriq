import { AI_CONFIG } from "@/config/ai";
import { getOpenAiApiKey } from "@/lib/env";
import { WHISPER_PROMPT } from "@/lib/clinical/prompts";
import { AppError } from "@/lib/errors";

export interface EphemeralRealtimeSession {
  clientSecret: string;
  expiresAt: number | null;
  model: string;
  sampleRate: number;
}

/**
 * Cria uma sessão de transcrição Realtime da OpenAI e devolve uma credencial
 * EFÊMERA (client_secret) para o browser conectar. A `OPENAI_API_KEY` permanente
 * nunca sai do servidor (seção 6). Isolado da rota para ser testável/mockável.
 */
export async function createRealtimeTranscriptionSession(
  fetchImpl: typeof fetch = fetch,
): Promise<EphemeralRealtimeSession> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new AppError(
      "OPENAI_API_KEY não encontrada.",
      "missing_api_key",
      500,
    );
  }

  // API GA da OpenAI: cria uma credencial efêmera (ek_...) para o browser.
  const response = await fetchImpl(
    "https://api.openai.com/v1/realtime/client_secrets",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "transcription",
          audio: {
            input: {
              format: { type: "audio/pcm", rate: AI_CONFIG.realtime.sampleRate },
              transcription: {
                model: AI_CONFIG.realtime.model,
                language: AI_CONFIG.whisperLanguage,
                prompt: WHISPER_PROMPT.slice(0, 800),
              },
              turn_detection: { type: "server_vad", silence_duration_ms: 500 },
            },
          },
        },
      }),
    },
  );

  if (!response.ok) {
    throw new AppError(
      "Não foi possível iniciar a sessão de transcrição em tempo real.",
      "realtime_session_failed",
      502,
    );
  }

  const data = (await response.json()) as {
    value?: string;
    expires_at?: number;
  };
  if (!data.value) {
    throw new AppError(
      "Resposta inválida ao criar a sessão Realtime.",
      "realtime_session_failed",
      502,
    );
  }

  return {
    clientSecret: data.value,
    expiresAt: data.expires_at ?? null,
    model: AI_CONFIG.realtime.model,
    sampleRate: AI_CONFIG.realtime.sampleRate,
  };
}
