import { NextResponse } from "next/server";
import { clinicalFinalizeRequestSchema } from "@/lib/clinical/schemas";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { clinicalAIProvider } from "@/lib/groq/clinical";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 26;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = clinicalFinalizeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload de finalização inválido.", code: "invalid_payload" },
        { status: 400 },
      );
    }

    const report = await clinicalAIProvider.finalize({
      transcript: parsed.data.transcript,
      state: parsed.data.state,
    });

    return NextResponse.json({ report });
  } catch (error) {
    logger.error("clinical finalize route", error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json(
      {
        error: "Falha ao gerar o relatório final.",
        code: "clinical_finalize_failed",
      },
      { status: 502 },
    );
  }
}
