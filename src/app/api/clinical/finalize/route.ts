import { NextResponse } from "next/server";
import { clinicalFinalizeRequestSchema } from "@/lib/clinical/schemas";
import { clinicalAIProvider } from "@/lib/openai/clinical";
import {
  BODY_LIMITS,
  ensureJsonContentType,
  ensureSameOrigin,
  errorResponse,
  readJsonLimited,
} from "@/lib/http";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/appwrite/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Coerente com AI_CONFIG.timeouts.clinicalFinalizeMs (ver DEPLOYMENT.md).
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    ensureSameOrigin(request);
    await requireUser();
    ensureJsonContentType(request);
    const body = await readJsonLimited(request);
    const parsed = clinicalFinalizeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload de finalização inválido.", code: "invalid_payload" },
        { status: 400 },
      );
    }

    if (parsed.data.transcript.length > BODY_LIMITS.transcriptChars) {
      throw new AppError("Transcrição grande demais.", "payload_too_large", 413);
    }

    const report = await clinicalAIProvider.finalize({
      transcript: parsed.data.transcript,
      state: parsed.data.state,
    });

    return NextResponse.json({ report });
  } catch (error) {
    return errorResponse(error, {
      message: "Falha ao gerar o relatório final.",
      code: "clinical_finalize_failed",
    });
  }
}
