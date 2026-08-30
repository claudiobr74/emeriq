"use client";

import { AI_CONFIG } from "@/config/ai";
import { downsample, floatToPcm16Base64 } from "@/lib/audio/wav";
import { logger } from "@/lib/logger";
import type { TranscriptionStatus } from "@/lib/transcription/reducer";

export interface RealtimeCallbacks {
  onStatus: (status: TranscriptionStatus) => void;
  onAudioAccepted: (id: string) => void;
  onDelta: (id: string, text: string) => void;
  onCompleted: (id: string, text: string) => void;
  onFailed: (id: string) => void;
  /** Falha irrecuperável — o consumidor deve cair para o modo degradado (REST). */
  onFatal: (message: string) => void;
}

// GA Realtime: a credencial efêmera já carrega a config da sessão (type
// "transcription"). Autenticação por subprotocolo (a chave é o ek_ efêmero).
const REALTIME_URL = "wss://api.openai.com/v1/realtime";

/**
 * Transcrição contínua via OpenAI Realtime (WebSocket) usando credencial
 * EFÊMERA obtida em /api/realtime/session. A chave permanente nunca chega aqui.
 * Áudio é enviado continuamente como PCM16 (24 kHz) e o servidor devolve deltas
 * (partial) e completed (confirmed) por item, com server VAD.
 */
export class RealtimeTranscriber {
  private ws: WebSocket | null = null;
  private paused = false;
  private closed = false;

  constructor(private readonly cb: RealtimeCallbacks) {}

  async connect(): Promise<void> {
    this.cb.onStatus("connecting");
    const res = await fetch("/api/realtime/session", { method: "POST" });
    if (!res.ok) throw new Error("realtime_session_failed");
    const session = (await res.json()) as { clientSecret: string };
    if (!session.clientSecret) throw new Error("realtime_session_failed");

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const ws = new WebSocket(REALTIME_URL, [
        "realtime",
        `openai-insecure-api-key.${session.clientSecret}`,
      ]);
      this.ws = ws;

      ws.onopen = () => {
        this.cb.onStatus("connected");
      };
      ws.onmessage = (event) => {
        if (!settled) {
          const type = this.peekType(event.data);
          if (type === "error") {
            settled = true;
            reject(new Error("realtime_session_rejected"));
            return;
          }
          if (type === "session.created" || type === "transcription_session.created") {
            settled = true;
            this.cb.onStatus("listening");
            resolve();
          }
        }
        this.handleMessage(event.data);
      };
      ws.onerror = () => {
        if (!settled) {
          settled = true;
          reject(new Error("realtime_ws_error"));
        }
      };
      ws.onclose = () => {
        if (!this.closed) this.cb.onFatal("Conexão de transcrição encerrada.");
      };

      window.setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error("realtime_ws_timeout"));
        }
      }, 8_000);
    });
  }

  private peekType(raw: unknown): string | null {
    if (typeof raw !== "string") return null;
    try {
      return (JSON.parse(raw) as { type?: string }).type ?? null;
    } catch {
      return null;
    }
  }

  private handleMessage(raw: unknown): void {
    if (typeof raw !== "string") return;
    let msg: { type?: string; item_id?: string; delta?: string; transcript?: string };
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    switch (msg.type) {
      case "input_audio_buffer.committed":
        if (msg.item_id) this.cb.onAudioAccepted(msg.item_id);
        break;
      case "conversation.item.input_audio_transcription.delta":
        if (msg.item_id) this.cb.onDelta(msg.item_id, msg.delta ?? "");
        break;
      case "conversation.item.input_audio_transcription.completed":
        if (msg.item_id) this.cb.onCompleted(msg.item_id, msg.transcript ?? "");
        break;
      case "conversation.item.input_audio_transcription.failed":
        if (msg.item_id) this.cb.onFailed(msg.item_id);
        break;
      case "error":
        logger.transcription("realtime error event", raw.slice(0, 200));
        break;
      default:
        break;
    }
  }

  private send(payload: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  /** Envia um frame PCM (Float32) — convertido para PCM16 24 kHz base64. */
  pushPcm(frame: Float32Array, sourceRate: number): void {
    if (this.paused || this.closed) return;
    const target = AI_CONFIG.realtime.sampleRate;
    const resampled = downsample(frame, sourceRate, target);
    this.send({
      type: "input_audio_buffer.append",
      audio: floatToPcm16Base64(resampled),
    });
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  /** Finaliza o buffer pendente (flush), garantindo que o último áudio seja transcrito. */
  commit(): void {
    this.send({ type: "input_audio_buffer.commit" });
  }

  close(): void {
    this.closed = true;
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    this.ws = null;
  }
}
