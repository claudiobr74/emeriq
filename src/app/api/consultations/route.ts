import { NextResponse } from "next/server";
import { z } from "zod";
import { clinicalStateSchema, finalClinicalReportSchema } from "@/lib/clinical/schemas";
import {
  createConsultation,
  consultationStatusSchema,
  supabaseReady,
} from "@/lib/supabase/consultations";
import {
  ensureJsonContentType,
  ensureSameOrigin,
  errorResponse,
  readJsonLimited,
} from "@/lib/http";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createBodySchema = z.object({
  transcript: z.string().optional(),
  clinicalState: clinicalStateSchema.optional(),
  soap: finalClinicalReportSchema.nullable().optional(),
  status: consultationStatusSchema.optional(),
  finalizeWarning: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    ensureSameOrigin(request);
    ensureJsonContentType(request);
    if (!supabaseReady()) {
      throw new AppError("Supabase não configurado.", "supabase_not_configured", 503);
    }
    const body = await readJsonLimited(request);
    const parsed = createBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload de atendimento inválido.", code: "invalid_payload" },
        { status: 400 },
      );
    }
    const row = await createConsultation(parsed.data);
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    return errorResponse(error, {
      message: "Falha ao criar o atendimento.",
      code: "consultation_create_failed",
    });
  }
}
