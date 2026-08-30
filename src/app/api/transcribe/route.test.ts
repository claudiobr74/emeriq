import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/openai/transcription", () => ({
  transcribeAudio: vi.fn(async () => "texto transcrito"),
}));

import { POST } from "@/app/api/transcribe/route";

function formRequest(init: {
  audio?: Blob | null;
  model?: string;
  headers?: Record<string, string>;
  audioSize?: number;
}): Request {
  const form = new FormData();
  if (init.audio !== null) {
    const blob =
      init.audio ?? new Blob([new Uint8Array(32)], { type: "audio/wav" });
    form.append("audio", blob, "chunk.wav");
  }
  form.append("model", init.model ?? "gpt-4o-transcribe");
  return new Request("http://localhost/api/transcribe", {
    method: "POST",
    headers: {
      origin: "http://localhost",
      host: "localhost",
      ...init.headers,
    },
    body: form,
  });
}

describe("POST /api/transcribe (hardened)", () => {
  it("returns 200 with text for a valid same-origin request", async () => {
    const res = await POST(formRequest({}));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { text: string };
    expect(json.text).toBe("texto transcrito");
  });

  it("rejects cross-origin requests with 403", async () => {
    const res = await POST(
      formRequest({
        headers: { origin: "http://evil.example", host: "localhost" },
      }),
    );
    expect(res.status).toBe(403);
  });

  it("rejects missing audio with 400", async () => {
    const res = await POST(formRequest({ audio: null }));
    expect(res.status).toBe(400);
  });

  it("rejects invalid model with 400", async () => {
    const res = await POST(formRequest({ model: "whisper-1" }));
    expect(res.status).toBe(400);
  });
});
