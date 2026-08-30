import { NextResponse } from "next/server";
import { clinicalUpdateRequestSchema } from "@/lib/clinical/schemas";
import { clinicalAIProvider } from "@/lib/openai/clinical";
import {
  BODY_LIMITS,
  ensureJsonContentType,
  ensureSameOrigin,
  errorResponse,
  readJsonLimited,
} from "@/lib/http";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Coerente com AI_CONFIG.timeouts.clinicalUpdateMs (ver DEPLOYMENT.md).
export const maxDuration = 45;

export async function POST(request: Request) {
  try {
    ensureSameOrigin(request);
    ensureJsonContentType(request);
    const body = await readJsonLimited(request);
    const parsed = clinicalUpdateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload clínico inválido.", code: "invalid_payload" },
        { status: 400 },
      );
    }

    if (
      parsed.data.confirmedTranscript.length > BODY_LIMITS.transcriptChars ||
      parsed.data.newSegment.length > BODY_LIMITS.newSegmentChars
    ) {
      throw new AppError("Texto clínico grande demais.", "payload_too_large", 413);
    }

    const state = await clinicalAIProvider.update({
      currentState: parsed.data.currentState,
      confirmedTranscript: parsed.data.confirmedTranscript,
      newSegment: parsed.data.newSegment,
    });

    return NextResponse.json({ state, sequence: parsed.data.sequence });
  } catch (error) {
    return errorResponse(error, {
      message: "Falha na atualização clínica.",
      code: "clinical_update_failed",
    });
  }
}
