import { NextResponse } from "next/server";
import { z } from "zod";
import { clinicalStateSchema, finalClinicalReportSchema } from "@/lib/clinical/schemas";
import {
  consultationStatusSchema,
  getConsultationForUser,
  appwriteReady,
  updateConsultationForUser,
  discardConsultationForUser,
  transcriptionIntegritySchema,
} from "@/lib/appwrite/consultations";
import { requireUser } from "@/lib/appwrite/session";
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
  transcriptionIntegrity: transcriptionIntegritySchema.nullable().optional(),
  ownerUserId: z.string().optional(),
  owner_user_id: z.string().optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    ensureSameOrigin(request);
    const user = await requireUser();
    if (!appwriteReady()) {
      throw new AppError("Appwrite não configurado.", "appwrite_not_configured", 503);
    }
    const { id } = await context.params;
    if (!idSchema.safeParse(id).success) {
      return NextResponse.json(
        { error: "Identificador inválido.", code: "invalid_id" },
        { status: 400 },
      );
    }
    const row = await getConsultationForUser(id, user.id);
    return NextResponse.json(row);
  } catch (error) {
    return errorResponse(error, {
      message: "Não foi possível carregar o atendimento.",
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
    const user = await requireUser();
    if (!appwriteReady()) {
      throw new AppError("Appwrite não configurado.", "appwrite_not_configured", 503);
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
    const safe = {
      transcript: parsed.data.transcript,
      clinicalState: parsed.data.clinicalState,
      soap: parsed.data.soap,
      status: parsed.data.status,
      finalizeWarning: parsed.data.finalizeWarning,
      transcriptionIntegrity: parsed.data.transcriptionIntegrity,
    };
    const row = await updateConsultationForUser(id, user.id, safe);
    return NextResponse.json(row);
  } catch (error) {
    return errorResponse(error, {
      message: "Não foi possível atualizar o atendimento.",
      code: "consultation_update_failed",
    });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    ensureSameOrigin(request);
    const user = await requireUser();
    if (!appwriteReady()) {
      throw new AppError("Appwrite não configurado.", "appwrite_not_configured", 503);
    }
    const { id } = await context.params;
    if (!idSchema.safeParse(id).success) {
      return NextResponse.json(
        { error: "Identificador inválido.", code: "invalid_id" },
        { status: 400 },
      );
    }
    const row = await discardConsultationForUser(id, user.id);
    return NextResponse.json(row);
  } catch (error) {
    return errorResponse(error, {
      message: "Não foi possível encerrar o atendimento.",
      code: "consultation_delete_failed",
    });
  }
}
