import { NextResponse } from "next/server";
import { z } from "zod";
import { clinicalStateSchema, finalClinicalReportSchema } from "@/lib/clinical/schemas";
import {
  consultationStatusSchema,
  getConsultation,
  supabaseReady,
  updateConsultation,
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

const idSchema = z.string().uuid();

const patchBodySchema = z.object({
  transcript: z.string().optional(),
  clinicalState: clinicalStateSchema.optional(),
  soap: finalClinicalReportSchema.nullable().optional(),
  status: consultationStatusSchema.optional(),
  finalizeWarning: z.string().nullable().optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    ensureSameOrigin(request);
    if (!supabaseReady()) {
      throw new AppError("Supabase não configurado.", "supabase_not_configured", 503);
    }
    const { id } = await context.params;
    if (!idSchema.safeParse(id).success) {
      return NextResponse.json(
        { error: "Identificador inválido.", code: "invalid_id" },
        { status: 400 },
      );
    }
    const row = await getConsultation(id);
    return NextResponse.json(row);
  } catch (error) {
    return errorResponse(error, {
      message: "Falha ao ler o atendimento.",
      code: "consultation_read_failed",
    });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    ensureSameOrigin(request);
    ensureJsonContentType(request);
    if (!supabaseReady()) {
      throw new AppError("Supabase não configurado.", "supabase_not_configured", 503);
    }
    const { id } = await context.params;
    if (!idSchema.safeParse(id).success) {
      return NextResponse.json(
        { error: "Identificador inválido.", code: "invalid_id" },
        { status: 400 },
      );
    }
    const body = await readJsonLimited(request);
    const parsed = patchBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload de atendimento inválido.", code: "invalid_payload" },
        { status: 400 },
      );
    }
    const row = await updateConsultation(id, parsed.data);
    return NextResponse.json(row);
  } catch (error) {
    return errorResponse(error, {
      message: "Falha ao atualizar o atendimento.",
      code: "consultation_update_failed",
    });
  }
}
