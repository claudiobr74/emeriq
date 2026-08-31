import { describe, expect, it, vi, beforeEach } from "vitest";

const createConsultation = vi.fn();
const appwriteReady = vi.fn();

vi.mock("@/lib/appwrite/consultations", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/appwrite/consultations")>();
  return {
    ...actual,
    createConsultation: (...args: unknown[]) => createConsultation(...args),
    appwriteReady: () => appwriteReady(),
  };
});

import { POST } from "@/app/api/consultations/route";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";

function req(init: {
  body?: string;
  headers?: Record<string, string>;
}): Request {
  return new Request("http://localhost/api/consultations", {
    method: "POST",
    headers: init.headers,
    body: init.body,
  });
}

describe("POST /api/consultations", () => {
  beforeEach(() => {
    createConsultation.mockReset();
    appwriteReady.mockReset();
    appwriteReady.mockReturnValue(true);
    createConsultation.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      created_at: "2026-08-30T00:00:00.000Z",
      updated_at: "2026-08-30T00:00:00.000Z",
      status: "active",
      transcript: "",
      clinical_state: createEmptyClinicalState(),
      soap: null,
      finalize_warning: null,
    });
  });

  it("creates a consultation on a valid same-origin request", async () => {
    const res = await POST(
      req({
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({ status: "active" }),
      }),
    );
    expect(res.status).toBe(201);
    const json = (await res.json()) as { id: string; status: string };
    expect(json.status).toBe("active");
    expect(json.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("returns 503 when Appwrite is not configured", async () => {
    appwriteReady.mockReturnValue(false);
    const res = await POST(
      req({
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({ status: "active" }),
      }),
    );
    expect(res.status).toBe(503);
  });

  it("rejects cross-origin requests with 403", async () => {
    const res = await POST(
      req({
        headers: {
          "content-type": "application/json",
          origin: "http://evil.example",
          host: "localhost",
        },
        body: JSON.stringify({ status: "active" }),
      }),
    );
    expect(res.status).toBe(403);
  });
});
