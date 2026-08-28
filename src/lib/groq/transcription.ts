import { toFile } from "groq-sdk";
import { AI_CONFIG, type TranscriptionModelId } from "@/config/ai";
import { WHISPER_PROMPT } from "@/lib/clinical/prompts";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getGroqClient } from "@/lib/groq/client";

export async function transcribeAudio(input: {
  audio: File | Blob;
  filename: string;
  model: TranscriptionModelId;
  promptTail?: string;
}): Promise<string> {
  const groq = getGroqClient();
  const bytes = Buffer.from(await input.audio.arrayBuffer());

  if (bytes.length === 0) {
    return "";
  }

  const file = await toFile(bytes, input.filename);
  const prompt = [WHISPER_PROMPT, input.promptTail].filter(Boolean).join(" ");

  logger.transcription("sending chunk", {
    bytes: bytes.length,
    model: input.model,
  });

  try {
    const result = await groq.audio.transcriptions.create(
      {
        file,
        model: input.model,
        language: AI_CONFIG.whisperLanguage,
        temperature: 0,
        response_format: "json",
        prompt: prompt.slice(0, 800),
      },
      { timeout: AI_CONFIG.timeouts.transcriptionMs },
    );

    return (result.text ?? "").trim();
  } catch (error) {
    logger.error("transcription failed", error);
    throw new AppError(
      "Falha ao transcrever o áudio.",
      "transcription_failed",
      502,
    );
  }
}
