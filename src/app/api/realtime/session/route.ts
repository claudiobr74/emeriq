import { NextResponse } from "next/server";
import {
  AI_CONFIG,
  isAllowedTranscriptionModel,
  type TranscriptionModelId,
} from "@/config/ai";
import { createRealtimeTranscriptionSession } from "@/lib/openai/realtime-session";
import { AppError } from "@/lib/errors";
import { ensureSameOrigin, errorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

function resolveModel(body: unknown): TranscriptionModelId {
  if (!body || typeof body !== "object") return AI_CONFIG.transcriptionModel;
  const raw = (body as { model?: unknown }).model;
  if (raw == null || raw === "") return AI_CONFIG.transcriptionModel;
  if (typeof raw !== "string" || !isAllowedTranscriptionModel(raw)) {
    throw new AppError("Modelo de transcrição inválido.", "invalid_model", 400);
  }
  return raw;
}

export async function POST(request: Request) {
  try {
    ensureSameOrigin(request);
    let body: unknown = {};
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.toLowerCase().includes("application/json")) {
      const text = await request.text();
      if (text.trim()) {
        try {
          body = JSON.parse(text);
        } catch {
          throw new AppError("JSON inválido.", "invalid_json", 400);
        }
      }
    }
    const model = resolveModel(body);
    const session = await createRealtimeTranscriptionSession(fetch, model);
    return NextResponse.json({
      clientSecret: session.clientSecret,
      expiresAt: session.expiresAt,
      model: session.model,
      sampleRate: session.sampleRate,
    });
  } catch (error) {
    return errorResponse(error, {
      message: "Não foi possível iniciar a transcrição em tempo real.",
      code: "realtime_session_failed",
    });
  }
}
