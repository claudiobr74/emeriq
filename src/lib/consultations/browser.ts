import type { ClinicalState, FinalClinicalReport } from "@/lib/clinical/schemas";
import { hardRedirectToLogin } from "@/lib/auth/hard-redirect";

export const CONSULTATION_STORAGE_KEY = "emeriq.consultationId";

export interface PersistedConsultation {
  id: string;
  status: "active" | "finalizing" | "finalized" | "discarded";
  transcript: string;
  clinicalState: ClinicalState;
  soap: FinalClinicalReport | null;
  finalizeWarning: string | null;
  transcriptionIntegrity?: "complete" | "partial" | null;
}

export function readConsultationId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(CONSULTATION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeConsultationId(id: string): void {
  try {
    window.sessionStorage.setItem(CONSULTATION_STORAGE_KEY, id);
  } catch {
    /* private mode */
  }
}

export function clearConsultationId(): void {
  try {
    window.sessionStorage.removeItem(CONSULTATION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

async function parseConsultation(response: Response): Promise<PersistedConsultation | null> {
  if (response.status === 401) {
    hardRedirectToLogin();
    return null;
  }
  if (response.status === 503) return null;
  if (!response.ok) return null;
  const json = (await response.json()) as {
    id: string;
    status: PersistedConsultation["status"];
    transcript: string;
    clinical_state: ClinicalState;
    soap: FinalClinicalReport | null;
    finalize_warning: string | null;
    transcription_integrity?: "complete" | "partial" | null;
  };
  return {
    id: json.id,
    status: json.status,
    transcript: json.transcript,
    clinicalState: json.clinical_state,
    soap: json.soap,
    finalizeWarning: json.finalize_warning,
    transcriptionIntegrity: json.transcription_integrity ?? null,
  };
}

export async function fetchActiveConsultation(): Promise<PersistedConsultation | null> {
  try {
    const response = await fetch("/api/consultations/active", { method: "GET" });
    if (response.status === 401) {
      hardRedirectToLogin();
      return null;
    }
    if (!response.ok) return null;
    const json = (await response.json()) as {
      consultation: {
        id: string;
        status: PersistedConsultation["status"];
        transcript: string;
        clinical_state: ClinicalState;
        soap: FinalClinicalReport | null;
        finalize_warning: string | null;
        transcription_integrity?: "complete" | "partial" | null;
      } | null;
    };
    if (!json.consultation || json.consultation.status !== "active") return null;
    const row = json.consultation;
    return {
      id: row.id,
      status: row.status,
      transcript: row.transcript,
      clinicalState: row.clinical_state,
      soap: row.soap,
      finalizeWarning: row.finalize_warning,
      transcriptionIntegrity: row.transcription_integrity ?? null,
    };
  } catch {
    return null;
  }
}

export async function createConsultationRemote(): Promise<{
  id: string | null;
  status: "created" | "active_exists" | "failed";
  consultation?: PersistedConsultation;
}> {
  try {
    const response = await fetch("/api/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    if (response.status === 409) {
      const active = await fetchActiveConsultation();
      return { id: active?.id ?? null, status: "active_exists", consultation: active ?? undefined };
    }
    const row = await parseConsultation(response);
    return { id: row?.id ?? null, status: row ? "created" : "failed" };
  } catch {
    return { id: null, status: "failed" };
  }
}

export async function saveConsultationRemote(
  id: string,
  payload: {
    transcript?: string;
    clinicalState?: ClinicalState;
    soap?: FinalClinicalReport | null;
    status?: PersistedConsultation["status"];
    finalizeWarning?: string | null;
    transcriptionIntegrity?: "complete" | "partial" | null;
  },
): Promise<void> {
  try {
    await fetch(`/api/consultations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: payload.transcript,
        clinicalState: payload.clinicalState,
        soap: payload.soap,
        status: payload.status,
        finalizeWarning: payload.finalizeWarning,
        transcriptionIntegrity: payload.transcriptionIntegrity,
      }),
    });
  } catch {
    /* persistência é best-effort */
  }
}

export async function loadConsultationRemote(
  id: string,
): Promise<PersistedConsultation | null> {
  try {
    const response = await fetch(`/api/consultations/${id}`, { method: "GET" });
    return await parseConsultation(response);
  } catch {
    return null;
  }
}

export async function discardConsultationRemote(id: string): Promise<void> {
  try {
    await fetch(`/api/consultations/${id}`, { method: "DELETE" });
  } catch {
    /* best-effort */
  }
}
