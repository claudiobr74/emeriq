import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/openai/realtime-session", () => ({
  createRealtimeTranscriptionSession: vi.fn(
    async (_fetch: typeof fetch, model: string) => ({
      clientSecret: "ek_test",
      expiresAt: 1,
      model,
      sampleRate: 24_000,
    }),
  ),
}));

vi.mock("@/lib/appwrite/session", () => ({
  requireUser: vi.fn(async () => ({
    id: "user-a",
    name: "Ana",
    email: "ana@hospital.org",
  })),
}));

import { POST } from "@/app/api/realtime/session/route";
import { createRealtimeTranscriptionSession } from "@/lib/openai/realtime-session";

function req(init: {
  body?: string;
  headers?: Record<string, string>;
}): Request {
  return new Request("http://localhost/api/realtime/session", {
    method: "POST",
    headers: init.headers,
    body: init.body,
  });
}

describe("POST /api/realtime/session (hardened)", () => {
  it("mints an ephemeral session for a valid same-origin request", async () => {
    const res = await POST(
      req({
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({ model: "gpt-4o-mini-transcribe" }),
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { clientSecret: string; model: string };
    expect(json.clientSecret).toBe("ek_test");
    expect(json.model).toBe("gpt-4o-mini-transcribe");
    expect(createRealtimeTranscriptionSession).toHaveBeenCalled();
  });

  it("rejects cross-origin requests with 403", async () => {
    const res = await POST(
      req({
        headers: {
          "content-type": "application/json",
          origin: "http://evil.example",
          host: "localhost",
        },
        body: "{}",
      }),
    );
    expect(res.status).toBe(403);
  });

  it("rejects invalid model with 400", async () => {
    const res = await POST(
      req({
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({ model: "whisper-1" }),
      }),
    );
    expect(res.status).toBe(400);
  });
});
