import { AppError } from "@/lib/errors";
import { getSupabaseServerKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/env";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";
import {
  clinicalStateSchema,
  finalClinicalReportSchema,
  type ClinicalState,
  type FinalClinicalReport,
} from "@/lib/clinical/schemas";
import { z } from "zod";

export const consultationStatusSchema = z.enum(["active", "finalized"]);

export const consultationRowSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  status: consultationStatusSchema,
  transcript: z.string(),
  clinical_state: clinicalStateSchema,
  soap: finalClinicalReportSchema.nullable(),
  finalize_warning: z.string().nullable(),
});

export type ConsultationRow = z.infer<typeof consultationRowSchema>;

export interface ConsultationWrite {
  transcript?: string;
  clinicalState?: ClinicalState;
  soap?: FinalClinicalReport | null;
  status?: z.infer<typeof consultationStatusSchema>;
  finalizeWarning?: string | null;
}

function config() {
  const url = getSupabaseUrl();
  const key = getSupabaseServerKey();
  if (!url || !key) {
    throw new AppError("Supabase não configurado.", "supabase_not_configured", 503);
  }
  return { url, key };
}

async function rest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new AppError(
      "Falha ao persistir o atendimento.",
      "supabase_request_failed",
      502,
    );
  }

  return (await response.json()) as T;
}

function toRow(payload: ConsultationWrite, id?: string) {
  const now = new Date().toISOString();
  return {
    ...(id ? { id } : {}),
    updated_at: now,
    ...(payload.status !== undefined ? { status: payload.status } : {}),
    ...(payload.transcript !== undefined ? { transcript: payload.transcript } : {}),
    ...(payload.clinicalState !== undefined
      ? { clinical_state: payload.clinicalState }
      : {}),
    ...(payload.soap !== undefined ? { soap: payload.soap } : {}),
    ...(payload.finalizeWarning !== undefined
      ? { finalize_warning: payload.finalizeWarning }
      : {}),
  };
}

export function supabaseReady(): boolean {
  return isSupabaseConfigured();
}

export async function createConsultation(
  payload: ConsultationWrite = {},
): Promise<ConsultationRow> {
  const inserted = await rest<unknown[]>(
    "POST",
    "consultations",
    toRow({
      status: payload.status ?? "active",
      transcript: payload.transcript ?? "",
      clinicalState: payload.clinicalState ?? createEmptyClinicalState(),
      soap: payload.soap ?? null,
      finalizeWarning: payload.finalizeWarning ?? null,
    }),
  );
  const parsed = consultationRowSchema.safeParse(inserted[0]);
  if (!parsed.success) {
    throw new AppError("Resposta inválida do banco.", "supabase_invalid_row", 502);
  }
  return parsed.data;
}

export async function updateConsultation(
  id: string,
  payload: ConsultationWrite,
): Promise<ConsultationRow> {
  const updated = await rest<unknown[]>(
    "PATCH",
    `consultations?id=eq.${encodeURIComponent(id)}`,
    toRow(payload, id),
  );
  const parsed = consultationRowSchema.safeParse(updated[0]);
  if (!parsed.success) {
    throw new AppError("Atendimento não encontrado.", "consultation_not_found", 404);
  }
  return parsed.data;
}

export async function getConsultation(id: string): Promise<ConsultationRow> {
  const rows = await rest<unknown[]>(
    "GET",
    `consultations?id=eq.${encodeURIComponent(id)}&select=*`,
  );
  const parsed = consultationRowSchema.safeParse(rows[0]);
  if (!parsed.success) {
    throw new AppError("Atendimento não encontrado.", "consultation_not_found", 404);
  }
  return parsed.data;
}
