import { describe, expect, it, vi, beforeEach } from "vitest";
import { UnauthorizedError } from "@/lib/errors";

const requireUser = vi.fn();

vi.mock("@/lib/appwrite/session", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/openai/clinical", () => ({
  clinicalAIProvider: {
    update: vi.fn(async ({ currentState }) => currentState),
    finalize: vi.fn(async () => ({
      soap: {
        subjective: "S",
        objective: "O",
        assessment: "A",
        plan: "P",
      },
      hypotheses: [],
      dangerousDifferentials: [],
      suggestedTests: [],
      possibleTreatments: [],
      unresolvedQuestions: [],
      alerts: [],
    })),
  },
}));

vi.mock("@/lib/openai/transcription", () => ({
  transcribeAudio: vi.fn(async () => "texto transcrito"),
}));

vi.mock("@/lib/openai/realtime-session", () => ({
  createRealtimeTranscriptionSession: vi.fn(async () => ({
    clientSecret: "ek_test",
    expiresAt: 1,
    model: "gpt-4o-transcribe",
    sampleRate: 24_000,
  })),
}));

import { POST as clinicalUpdate } from "@/app/api/clinical/update/route";
import { POST as clinicalFinalize } from "@/app/api/clinical/finalize/route";
import { POST as transcribe } from "@/app/api/transcribe/route";
import { POST as realtimeSession } from "@/app/api/realtime/session/route";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";

const user = { id: "user-a", name: "Ana", email: "ana@hospital.org" };

function jsonReq(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      host: "localhost",
    },
    body: JSON.stringify(body),
  });
}

describe("clinical APIs require a session", () => {
  beforeEach(() => {
    requireUser.mockReset();
    requireUser.mockResolvedValue(user);
  });

  it("returns 401 when the session is missing", async () => {
    requireUser.mockRejectedValue(new UnauthorizedError());
    const res = await clinicalUpdate(
      jsonReq("http://localhost/api/clinical/update", {
        currentState: createEmptyClinicalState(),
        confirmedTranscript: "dor",
        newSegment: "dor",
        sequence: 1,
      }),
    );
    expect(res.status).toBe(401);
  });

  it("allows an authenticated state-only clinical update", async () => {
    const res = await clinicalUpdate(
      jsonReq("http://localhost/api/clinical/update", {
        currentState: createEmptyClinicalState(),
        confirmedTranscript: "",
        newSegment: "",
        sequence: 1,
        stateChanged: true,
      }),
    );
    expect(res.status).toBe(200);
  });

  it("protects finalize, transcribe and realtime session", async () => {
    requireUser.mockRejectedValue(new UnauthorizedError());
    const fin = await clinicalFinalize(
      jsonReq("http://localhost/api/clinical/finalize", {
        transcript: "dor",
        state: createEmptyClinicalState(),
      }),
    );
    expect(fin.status).toBe(401);

    const form = new FormData();
    form.append("audio", new Blob([new Uint8Array(8)]), "chunk.wav");
    form.append("model", "gpt-4o-transcribe");
    const tr = await transcribe(
      new Request("http://localhost/api/transcribe", {
        method: "POST",
        headers: { origin: "http://localhost", host: "localhost" },
        body: form,
      }),
    );
    expect(tr.status).toBe(401);

    const rt = await realtimeSession(
      jsonReq("http://localhost/api/realtime/session", {}),
    );
    expect(rt.status).toBe(401);
  });
});
