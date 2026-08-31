import { AI_CONFIG } from "@/config/ai";

export const REALTIME_RECONNECT_DELAYS_MS = AI_CONFIG.realtime.reconnect.delaysMs;

export function reconnectDelayMs(attemptIndex: number): number {
  const delays = REALTIME_RECONNECT_DELAYS_MS;
  return delays[Math.min(attemptIndex, delays.length - 1)] ?? delays[delays.length - 1]!;
}

export function maxReconnectAttempts(): number {
  return REALTIME_RECONNECT_DELAYS_MS.length;
}

export function shouldDegrade(attemptCount: number): boolean {
  return attemptCount >= maxReconnectAttempts();
}
