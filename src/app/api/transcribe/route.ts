import { NextResponse } from "next/server";
import {
  isAllowedTranscriptionModel,
  type TranscriptionModelId,
} from "@/config/ai";
import { logger } from "@/lib/logger";
import { transcribeAudio } from "@/lib/openai/transcription";
import { transcriptTail } from "@/lib/clinical/transcript-reconciler";
import { BODY_LIMITS, ensureSameOrigin, errorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Coerente com AI_CONFIG.timeouts.transcriptionMs (ver DEPLOYMENT.md).
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    ensureSameOrigin(request);
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

    if (audio.size > BODY_LIMITS.audioBytes) {
      return NextResponse.json(
        { error: "Áudio grande demais.", code: "payload_too_large" },
        { status: 413 },
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
    return errorResponse(error, {
      message: "Falha ao transcrever o áudio.",
      code: "transcription_failed",
    });
  }
}
