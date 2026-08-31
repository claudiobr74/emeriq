import { toFile } from "openai";
import { AI_CONFIG, type TranscriptionModelId } from "@/config/ai";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getOpenAiClient } from "@/lib/openai/client";
import { stripTranscriptionLeak } from "@/lib/transcription/sanitize";

export async function transcribeAudio(input: {
  audio: File | Blob;
  filename: string;
  model: TranscriptionModelId;
  promptTail?: string;
}): Promise<string> {
  const openai = getOpenAiClient();
  const bytes = Buffer.from(await input.audio.arrayBuffer());

  if (bytes.length === 0) {
    return "";
  }

  const file = await toFile(bytes, input.filename);
  const prompt = stripTranscriptionLeak(input.promptTail ?? "").slice(0, 800);

  logger.transcription("sending chunk", {
    bytes: bytes.length,
    model: input.model,
  });

  try {
    const result = await openai.audio.transcriptions.create(
      {
        file,
        model: input.model,
        language: AI_CONFIG.whisperLanguage,
        response_format: "json",
        ...(prompt ? { prompt } : {}),
      },
      { timeout: AI_CONFIG.timeouts.transcriptionMs },
    );

    return stripTranscriptionLeak(result.text ?? "");
  } catch (error) {
    logger.error("transcription failed", error);
    throw new AppError(
      "Falha ao transcrever o áudio.",
      "transcription_failed",
      502,
    );
  }
}
