import { AppError } from "@/lib/errors";
import {
  getAppwriteApiKey,
  getAppwriteDatabaseId,
  getAppwriteEndpoint,
  getAppwriteProjectId,
  getAppwriteTableId,
  isAppwriteConfigured,
} from "@/lib/env";
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
  const endpoint = getAppwriteEndpoint();
  const projectId = getAppwriteProjectId();
  const apiKey = getAppwriteApiKey();
  if (!endpoint || !projectId || !apiKey) {
    throw new AppError("Appwrite não configurado.", "appwrite_not_configured", 503);
  }
  return {
    endpoint: endpoint.replace(/\/$/, ""),
    projectId,
    apiKey,
    databaseId: getAppwriteDatabaseId(),
    tableId: getAppwriteTableId(),
  };
}

async function appwrite<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const { endpoint, projectId, apiKey } = config();
  const response = await fetch(`${endpoint}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 404) {
    throw new AppError("Atendimento não encontrado.", "consultation_not_found", 404);
  }
  if (!response.ok) {
    throw new AppError(
      "Falha ao persistir o atendimento.",
      "appwrite_request_failed",
      502,
    );
  }
  return (await response.json()) as T;
}

function stringifyJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function parseJson(raw: unknown, fallback: unknown): unknown {
  if (raw == null || raw === "") return fallback;
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function toData(payload: ConsultationWrite): Record<string, string> {
  const data: Record<string, string> = {};
  if (payload.status !== undefined) data.status = payload.status;
  if (payload.transcript !== undefined) data.transcript = payload.transcript;
  if (payload.clinicalState !== undefined) {
    data.clinical_state = stringifyJson(payload.clinicalState);
  }
  if (payload.soap !== undefined) data.soap = stringifyJson(payload.soap);
  if (payload.finalizeWarning !== undefined) {
    data.finalize_warning = payload.finalizeWarning ?? "";
  }
  return data;
}

function fromRow(raw: Record<string, unknown>): ConsultationRow {
  const parsed = consultationRowSchema.safeParse({
    id: raw.$id ?? raw.id,
    created_at: raw.$createdAt ?? raw.created_at,
    updated_at: raw.$updatedAt ?? raw.updated_at,
    status: raw.status,
    transcript: raw.transcript ?? "",
    clinical_state: parseJson(raw.clinical_state, createEmptyClinicalState()),
    soap: parseJson(raw.soap, null),
    finalize_warning:
      raw.finalize_warning === "" || raw.finalize_warning == null
        ? null
        : raw.finalize_warning,
  });
  if (!parsed.success) {
    throw new AppError("Resposta inválida do banco.", "appwrite_invalid_row", 502);
  }
  return parsed.data;
}

export function appwriteReady(): boolean {
  return isAppwriteConfigured();
}

export async function createConsultation(
  payload: ConsultationWrite = {},
): Promise<ConsultationRow> {
  const { databaseId, tableId } = config();
  const id = crypto.randomUUID();
  const raw = await appwrite<Record<string, unknown>>(
    "POST",
    `/tablesdb/${databaseId}/tables/${tableId}/rows`,
    {
      rowId: id,
      data: toData({
        status: payload.status ?? "active",
        transcript: payload.transcript ?? "",
        clinicalState: payload.clinicalState ?? createEmptyClinicalState(),
        soap: payload.soap ?? null,
        finalizeWarning: payload.finalizeWarning ?? null,
      }),
    },
  );
  return fromRow(raw);
}

export async function updateConsultation(
  id: string,
  payload: ConsultationWrite,
): Promise<ConsultationRow> {
  const { databaseId, tableId } = config();
  const raw = await appwrite<Record<string, unknown>>(
    "PATCH",
    `/tablesdb/${databaseId}/tables/${tableId}/rows/${encodeURIComponent(id)}`,
    { data: toData(payload) },
  );
  return fromRow(raw);
}

export async function getConsultation(id: string): Promise<ConsultationRow> {
  const { databaseId, tableId } = config();
  const raw = await appwrite<Record<string, unknown>>(
    "GET",
    `/tablesdb/${databaseId}/tables/${tableId}/rows/${encodeURIComponent(id)}`,
  );
  return fromRow(raw);
}
