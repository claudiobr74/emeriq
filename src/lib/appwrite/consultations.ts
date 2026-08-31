import { Permission, Query, Role } from "node-appwrite";
import { AppError, ForbiddenError, UnauthorizedError } from "@/lib/errors";
import {
  getAppwriteDatabaseId,
  getAppwriteEndpoint,
  getAppwriteProjectId,
  getAppwriteTableId,
  isAppwriteConfigured,
} from "@/lib/env";
import { getSessionSecret } from "@/lib/appwrite/session";
import { createEmptyClinicalState, migrateClinicalState } from "@/lib/clinical/clinical-state";
import {
  clinicalStateSchema,
  finalClinicalReportSchema,
  type ClinicalState,
  type FinalClinicalReport,
} from "@/lib/clinical/schemas";
import { logger } from "@/lib/logger";
import { z } from "zod";

export const consultationStatusSchema = z.enum([
  "active",
  "finalizing",
  "finalized",
  "discarded",
]);

export const transcriptionIntegritySchema = z.enum(["complete", "partial"]);

export const consultationRowSchema = z.object({
  id: z.string().min(1),
  owner_user_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  started_at: z.string().nullable(),
  finalized_at: z.string().nullable(),
  status: consultationStatusSchema,
  transcript: z.string(),
  clinical_state: clinicalStateSchema,
  soap: finalClinicalReportSchema.nullable(),
  finalize_warning: z.string().nullable(),
  transcription_integrity: transcriptionIntegritySchema.nullable(),
});

export type ConsultationRow = z.infer<typeof consultationRowSchema>;
export type ConsultationStatus = z.infer<typeof consultationStatusSchema>;

export interface ConsultationWrite {
  transcript?: string;
  clinicalState?: ClinicalState;
  soap?: FinalClinicalReport | null;
  status?: ConsultationStatus;
  finalizeWarning?: string | null;
  transcriptionIntegrity?: z.infer<typeof transcriptionIntegritySchema> | null;
  startedAt?: string | null;
  finalizedAt?: string | null;
}

function ids() {
  const endpoint = getAppwriteEndpoint();
  const projectId = getAppwriteProjectId();
  if (!endpoint || !projectId) {
    throw new AppError("Appwrite não configurado.", "appwrite_not_configured", 503);
  }
  return {
    endpoint: endpoint.replace(/\/$/, ""),
    projectId,
    databaseId: getAppwriteDatabaseId(),
    tableId: getAppwriteTableId(),
  };
}

async function sessionHeaders(): Promise<Record<string, string>> {
  const secret = await getSessionSecret();
  if (!secret) throw new UnauthorizedError();
  const { projectId } = ids();
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Appwrite-Project": projectId,
    "X-Appwrite-Session": secret,
  };
}

function ownerPermissions(userId: string): string[] {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}

async function appwrite<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const { endpoint } = ids();
  const headers = await sessionHeaders();
  const response = await fetch(`${endpoint}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401) {
    throw new UnauthorizedError();
  }
  if (response.status === 404 || response.status === 403) {
    throw new ForbiddenError();
  }
  if (!response.ok) {
    logger.error("appwrite request failed", { method, path, status: response.status });
    throw new AppError(
      "Falha ao persistir o atendimento.",
      "appwrite_request_failed",
      502,
    );
  }
  if (response.status === 204) return undefined as T;
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
  if (payload.transcriptionIntegrity !== undefined) {
    data.transcription_integrity = payload.transcriptionIntegrity ?? "";
  }
  if (payload.startedAt !== undefined) {
    data.started_at = payload.startedAt ?? "";
  }
  if (payload.finalizedAt !== undefined) {
    data.finalized_at = payload.finalizedAt ?? "";
  }
  return data;
}

function emptyToNull(value: unknown): string | null {
  if (value == null || value === "") return null;
  return String(value);
}

function normalizeStatus(raw: unknown): ConsultationStatus {
  const parsed = consultationStatusSchema.safeParse(raw);
  return parsed.success ? parsed.data : "active";
}

function fromRow(raw: Record<string, unknown>): ConsultationRow {
  const integrityRaw = emptyToNull(raw.transcription_integrity);
  const parsed = consultationRowSchema.safeParse({
    id: raw.$id ?? raw.id,
    owner_user_id: emptyToNull(raw.owner_user_id),
    created_at: raw.$createdAt ?? raw.created_at,
    updated_at: raw.$updatedAt ?? raw.updated_at,
    started_at: emptyToNull(raw.started_at) ?? String(raw.$createdAt ?? ""),
    finalized_at: emptyToNull(raw.finalized_at),
    status: normalizeStatus(raw.status),
    transcript: raw.transcript ?? "",
    clinical_state: parseJson(raw.clinical_state, createEmptyClinicalState()),
    soap: parseJson(raw.soap, null),
    finalize_warning: emptyToNull(raw.finalize_warning),
    transcription_integrity:
      integrityRaw === "partial" || integrityRaw === "complete"
        ? integrityRaw
        : null,
  });
  if (!parsed.success) {
    logger.error("appwrite invalid row");
    throw new AppError(
      "Não foi possível carregar o atendimento.",
      "appwrite_invalid_row",
      502,
    );
  }
  return {
    ...parsed.data,
    clinical_state: migrateClinicalState(parsed.data.clinical_state),
  };
}

function assertOwner(row: ConsultationRow, userId: string): ConsultationRow {
  if (!row.owner_user_id || row.owner_user_id !== userId) {
    throw new ForbiddenError();
  }
  return row;
}

export function appwriteReady(): boolean {
  return isAppwriteConfigured();
}

export async function createConsultationForUser(
  userId: string,
  payload: ConsultationWrite = {},
): Promise<ConsultationRow> {
  const active = await findActiveConsultationForUser(userId);
  if (active) {
    throw new AppError(
      "Já existe um atendimento em andamento.",
      "active_consultation_exists",
      409,
    );
  }

  const { databaseId, tableId } = ids();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const raw = await appwrite<Record<string, unknown>>(
    "POST",
    `/tablesdb/${databaseId}/tables/${tableId}/rows`,
    {
      rowId: id,
      permissions: ownerPermissions(userId),
      data: {
        owner_user_id: userId,
        ...toData({
          status: payload.status ?? "active",
          transcript: payload.transcript ?? "",
          clinicalState: payload.clinicalState ?? createEmptyClinicalState(),
          soap: payload.soap ?? null,
          finalizeWarning: payload.finalizeWarning ?? null,
          transcriptionIntegrity: payload.transcriptionIntegrity ?? null,
          startedAt: payload.startedAt ?? now,
          finalizedAt: payload.finalizedAt ?? null,
        }),
      },
    },
  );
  return assertOwner(fromRow(raw), userId);
}

export async function getConsultationForUser(
  consultationId: string,
  userId: string,
): Promise<ConsultationRow> {
  const { databaseId, tableId } = ids();
  const raw = await appwrite<Record<string, unknown>>(
    "GET",
    `/tablesdb/${databaseId}/tables/${tableId}/rows/${encodeURIComponent(consultationId)}`,
  );
  return assertOwner(fromRow(raw), userId);
}

export async function updateConsultationForUser(
  consultationId: string,
  userId: string,
  payload: ConsultationWrite,
): Promise<ConsultationRow> {
  await getConsultationForUser(consultationId, userId);
  const { databaseId, tableId } = ids();
  const raw = await appwrite<Record<string, unknown>>(
    "PATCH",
    `/tablesdb/${databaseId}/tables/${tableId}/rows/${encodeURIComponent(consultationId)}`,
    { data: toData(payload) },
  );
  return assertOwner(fromRow(raw), userId);
}

export async function discardConsultationForUser(
  consultationId: string,
  userId: string,
): Promise<ConsultationRow> {
  return updateConsultationForUser(consultationId, userId, {
    status: "discarded",
    finalizedAt: new Date().toISOString(),
  });
}

export async function findActiveConsultationForUser(
  userId: string,
): Promise<ConsultationRow | null> {
  const { databaseId, tableId } = ids();
  const queries = [
    Query.equal("owner_user_id", userId),
    Query.equal("status", "active"),
    Query.limit(1),
    Query.orderDesc("$updatedAt"),
  ];
  const search = queries
    .map((query) => `queries[]=${encodeURIComponent(query)}`)
    .join("&");
  const list = await appwrite<{ rows?: Record<string, unknown>[] }>(
    "GET",
    `/tablesdb/${databaseId}/tables/${tableId}/rows?${search}`,
  );
  const first = list.rows?.[0];
  if (!first) return null;
  try {
    return assertOwner(fromRow(first), userId);
  } catch {
    return null;
  }
}
