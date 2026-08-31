import { describe, expect, it, vi } from "vitest";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";

vi.mock("@/lib/openai/clinical", () => ({
  clinicalAIProvider: {
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

vi.mock("@/lib/appwrite/session", () => ({
  requireUser: vi.fn(async () => ({
    id: "user-a",
    name: "Ana",
    email: "ana@hospital.org",
  })),
}));

import { POST } from "@/app/api/clinical/finalize/route";

const validBody = {
  transcript: "paciente com dor",
  state: createEmptyClinicalState(),
};

function req(init: {
  body?: string;
  headers?: Record<string, string>;
}): Request {
  return new Request("http://localhost/api/clinical/finalize", {
    method: "POST",
    headers: init.headers,
    body: init.body,
  });
}

describe("POST /api/clinical/finalize (hardened)", () => {
  it("returns 200 with report for a valid same-origin request", async () => {
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
    const json = (await res.json()) as { report: { soap: { subjective: string } } };
    expect(json.report.soap.subjective).toBe("S");
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
