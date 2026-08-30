import { reconcileTranscript } from "@/lib/clinical/transcript-reconciler";

export type TranscriptionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "listening"
  | "reconnecting"
  | "degraded"
  | "disconnected"
  | "error";

export type SegmentStatus = "pending" | "confirmed" | "failed";

export interface AudioSegment {
  id: string;
  status: SegmentStatus;
}

export interface TranscriptionState {
  status: TranscriptionStatus;
  confirmed: string;
  partial: string;
  segments: AudioSegment[];
  error: string | null;
}

export type TranscriptionAction =
  | { type: "status"; status: TranscriptionStatus }
  /** Áudio aceito antes/da transcrição — vira segmento pendente. */
  | { type: "audioAccepted"; id: string }
  /** Delta provisório do item corrente (partial transcript transitório). */
  | { type: "delta"; id: string; text: string }
  /** Item finalizado: consolida no confirmed e remove o partial. */
  | { type: "completed"; id: string; text: string }
  /** Item falhou na transcrição (registrado, não ignorado). */
  | { type: "failed"; id: string }
  | { type: "reset" };

export function initialTranscriptionState(): TranscriptionState {
  return {
    status: "idle",
    confirmed: "",
    partial: "",
    segments: [],
    error: null,
  };
}

function upsertSegment(
  segments: AudioSegment[],
  id: string,
  status: SegmentStatus,
): AudioSegment[] {
  const existing = segments.find((s) => s.id === id);
  if (!existing) return [...segments, { id, status }];
  return segments.map((s) => (s.id === id ? { ...s, status } : s));
}

export function transcriptionReducer(
  state: TranscriptionState,
  action: TranscriptionAction,
): TranscriptionState {
  switch (action.type) {
    case "status":
      return { ...state, status: action.status };

    case "audioAccepted":
      return {
        ...state,
        segments: upsertSegment(state.segments, action.id, "pending"),
      };

    case "delta":
      // Partial é transitório: reflete o texto provisório do item atual.
      return { ...state, partial: action.text.trim() };

    case "completed": {
      const text = action.text.trim();
      // Consolida no confirmed sem duplicar (reconciliador cuida de overlaps),
      // e limpa o partial (nunca incorporado duas vezes).
      const confirmed = text
        ? reconcileTranscript(state.confirmed, text)
        : state.confirmed;
      return {
        ...state,
        confirmed,
        partial: "",
        segments: upsertSegment(state.segments, action.id, "confirmed"),
        error: null,
      };
    }

    case "failed":
      return {
        ...state,
        partial: "",
        segments: upsertSegment(state.segments, action.id, "failed"),
      };

    case "reset":
      return initialTranscriptionState();

    default:
      return state;
  }
}

/** Segmentos ainda pendentes (não confirmados nem falhos). */
export function pendingSegments(state: TranscriptionState): AudioSegment[] {
  return state.segments.filter((s) => s.status === "pending");
}

/** Todos os segmentos aceitos alcançaram estado terminal (confirmed|failed). */
export function allSegmentsSettled(state: TranscriptionState): boolean {
  return state.segments.every((s) => s.status !== "pending");
}

/** Houve ao menos uma falha de transcrição (para aviso na UI). */
export function hasFailedSegments(state: TranscriptionState): boolean {
  return state.segments.some((s) => s.status === "failed");
}
