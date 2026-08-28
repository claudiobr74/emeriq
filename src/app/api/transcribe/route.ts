import { NextResponse } from "next/server";
import {
  isAllowedTranscriptionModel,
  type TranscriptionModelId,
} from "@/config/ai";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { transcribeAudio } from "@/lib/groq/transcription";
import { transcriptTail } from "@/lib/clinical/transcript-reconciler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 26;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const audio = form.get("audio");
    const modelValue = String(form.get("model") ?? "");
    const promptTail = String(form.get("promptTail") ?? "");

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { error: "Arquivo de áudio ausente.", code: "missing_audio" },
        { status: 400 },
      );
    }

    if (!isAllowedTranscriptionModel(modelValue)) {
      return NextResponse.json(
        { error: "Modelo de transcrição inválido.", code: "invalid_model" },
        { status: 400 },
      );
    }

    const model: TranscriptionModelId = modelValue;
    const filename = audio.name || "chunk.wav";

    const text = await transcribeAudio({
      audio,
      filename,
      model,
      promptTail: transcriptTail(promptTail),
    });

    return NextResponse.json({ text });
  } catch (error) {
    logger.error("transcribe route", error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Falha ao transcrever o áudio.", code: "transcription_failed" },
      { status: 502 },
    );
  }
}
