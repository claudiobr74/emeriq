import { NextResponse } from "next/server";
import { createRealtimeTranscriptionSession } from "@/lib/openai/realtime-session";
import { ensureSameOrigin, errorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(request: Request) {
  try {
    ensureSameOrigin(request);
    const session = await createRealtimeTranscriptionSession();
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
