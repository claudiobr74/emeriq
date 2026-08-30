import type { ClinicalState, FinalClinicalReport } from "@/lib/clinical/schemas";

export const CONSULTATION_STORAGE_KEY = "emeriq.consultationId";

export interface PersistedConsultation {
  id: string;
  status: "active" | "finalized";
  transcript: string;
  clinicalState: ClinicalState;
  soap: FinalClinicalReport | null;
  finalizeWarning: string | null;
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
  if (response.status === 503) return null;
  if (!response.ok) return null;
  const json = (await response.json()) as {
    id: string;
    status: "active" | "finalized";
    transcript: string;
    clinical_state: ClinicalState;
    soap: FinalClinicalReport | null;
    finalize_warning: string | null;
  };
  return {
    id: json.id,
    status: json.status,
    transcript: json.transcript,
    clinicalState: json.clinical_state,
    soap: json.soap,
    finalizeWarning: json.finalize_warning,
  };
}

export async function createConsultationRemote(): Promise<string | null> {
  try {
    const response = await fetch("/api/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    const row = await parseConsultation(response);
    return row?.id ?? null;
  } catch {
    return null;
  }
}

export async function saveConsultationRemote(
  id: string,
  payload: {
    transcript?: string;
    clinicalState?: ClinicalState;
    soap?: FinalClinicalReport | null;
    status?: "active" | "finalized";
    finalizeWarning?: string | null;
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
