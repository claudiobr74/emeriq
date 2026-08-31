import { describe, expect, it, vi } from "vitest";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";

vi.mock("@/lib/openai/clinical", () => ({
  clinicalAIProvider: {
    update: vi.fn(async ({ currentState }) => currentState),
  },
}));

vi.mock("@/lib/appwrite/session", () => ({
  requireUser: vi.fn(async () => ({
    id: "user-a",
    name: "Ana",
    email: "ana@hospital.org",
  })),
}));

import { POST } from "@/app/api/clinical/update/route";

const validBody = {
  currentState: createEmptyClinicalState(),
  confirmedTranscript: "paciente com dor",
  newSegment: "dor",
  sequence: 1,
};

function req(init: {
  body?: string;
  headers?: Record<string, string>;
}): Request {
  return new Request("http://localhost/api/clinical/update", {
    method: "POST",
    headers: init.headers,
    body: init.body,
  });
}

describe("POST /api/clinical/update (hardened)", () => {
  it("returns 200 with state + sequence for a valid same-origin request", async () => {
    const res = await POST(
      req({
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify(validBody),
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { sequence: number; state: unknown };
    expect(json.sequence).toBe(1);
    expect(json.state).toBeTruthy();
  });

  it("accepts a state-only update with empty transcript", async () => {
    const res = await POST(
      req({
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          currentState: createEmptyClinicalState(),
          confirmedTranscript: "",
          newSegment: "",
          sequence: 2,
          stateChanged: true,
        }),
      }),
    );
    expect(res.status).toBe(200);
  });

  it("rejects non-JSON content type with 415", async () => {
    const res = await POST(
      req({
        headers: { "content-type": "text/plain", host: "localhost" },
        body: "hello",
      }),
    );
    expect(res.status).toBe(415);
  });

  it("rejects cross-origin requests with 403", async () => {
    const res = await POST(
      req({
        headers: {
          "content-type": "application/json",
          origin: "http://evil.example",
          host: "localhost",
        },
        body: JSON.stringify(validBody),
      }),
    );
    expect(res.status).toBe(403);
  });

  it("rejects invalid payload with 400", async () => {
    const res = await POST(
      req({
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({ nonsense: true }),
      }),
    );
    expect(res.status).toBe(400);
  });
});
