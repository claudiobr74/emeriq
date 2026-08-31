import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getOpenAiApiKey: () => "sk-test-key",
  missingOpenAiKeyMessage: () => "OPENAI_API_KEY não encontrada.",
}));

import { createRealtimeTranscriptionSession } from "@/lib/openai/realtime-session";
import { AppError } from "@/lib/errors";

function fakeFetch(response: {
  ok: boolean;
  json?: () => Promise<unknown>;
}): typeof fetch {
  return (async () => response) as unknown as typeof fetch;
}

describe("createRealtimeTranscriptionSession", () => {
  it("returns an ephemeral client secret (never the permanent key)", async () => {
    const session = await createRealtimeTranscriptionSession(
      fakeFetch({
        ok: true,
        json: async () => ({ value: "ek_ephemeral_123", expires_at: 4242 }),
      }),
    );
    expect(session.clientSecret).toBe("ek_ephemeral_123");
    expect(session.clientSecret).not.toBe("sk-test-key");
    expect(session.expiresAt).toBe(4242);
    expect(session.sampleRate).toBeGreaterThan(0);
  });

  it("forwards the requested transcription model (Tempo real vs Alta precisão)", async () => {
    let capturedBody = "";
    const fetchImpl = (async (_url: string, init?: RequestInit) => {
      capturedBody = String(init?.body ?? "");
      return {
        ok: true,
        json: async () => ({ value: "ek_ephemeral_mini" }),
      };
    }) as unknown as typeof fetch;

    const session = await createRealtimeTranscriptionSession(
      fetchImpl,
      "gpt-4o-mini-transcribe",
    );
    expect(session.model).toBe("gpt-4o-mini-transcribe");
    expect(capturedBody).toContain("gpt-4o-mini-transcribe");
    expect(capturedBody).not.toContain("sk-test-key");
    expect(capturedBody).not.toContain("Termos frequentes");
    expect(capturedBody).not.toContain("WHISPER");
  });

  it("throws on non-ok response", async () => {
    await expect(
      createRealtimeTranscriptionSession(fakeFetch({ ok: false })),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("throws when client_secret is missing", async () => {
    await expect(
      createRealtimeTranscriptionSession(
        fakeFetch({ ok: true, json: async () => ({}) }),
      ),
    ).rejects.toBeInstanceOf(AppError);
  });
});
