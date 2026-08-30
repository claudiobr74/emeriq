import { NextResponse } from "next/server";
import { clinicalUpdateRequestSchema } from "@/lib/clinical/schemas";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { clinicalAIProvider } from "@/lib/openai/clinical";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = clinicalUpdateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload clínico inválido.", code: "invalid_payload" },
        { status: 400 },
      );
    }

    const state = await clinicalAIProvider.update({
      currentState: parsed.data.currentState,
      confirmedTranscript: parsed.data.confirmedTranscript,
      newSegment: parsed.data.newSegment,
    });

    return NextResponse.json({
      state,
      sequence: parsed.data.sequence,
    });
  } catch (error) {
    logger.error("clinical update route", error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json(
      {
        error: "Falha na atualização clínica.",
        code: "clinical_update_failed",
      },
      { status: 502 },
    );
  }
}
