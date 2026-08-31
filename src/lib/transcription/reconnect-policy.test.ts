import { describe, expect, it } from "vitest";
import {
  maxReconnectAttempts,
  reconnectDelayMs,
  shouldDegrade,
} from "@/lib/transcription/reconnect-policy";
import { PcmRingBuffer } from "@/lib/audio/pcm-ring-buffer";

describe("realtime reconnect policy", () => {
  it("uses three finite delays then degrades", () => {
    expect(maxReconnectAttempts()).toBe(3);
    expect(reconnectDelayMs(0)).toBe(500);
    expect(reconnectDelayMs(1)).toBe(1_000);
    expect(reconnectDelayMs(2)).toBe(2_000);
    expect(shouldDegrade(0)).toBe(false);
    expect(shouldDegrade(3)).toBe(true);
  });
});

describe("PCM ring buffer", () => {
  it("keeps only the most recent samples", () => {
    const ring = new PcmRingBuffer(4);
    ring.push(new Float32Array([1, 2, 3]), 16_000);
    ring.push(new Float32Array([4, 5]), 16_000);
    const drained = ring.drain();
    expect(Array.from(drained.samples)).toEqual([2, 3, 4, 5]);
    expect(ring.length).toBe(0);
  });
});
