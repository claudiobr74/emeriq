import { describe, expect, it, vi, beforeEach } from "vitest";

const createConsultationForUser = vi.fn();
const appwriteReady = vi.fn();
const requireUser = vi.fn();

vi.mock("@/lib/appwrite/consultations", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/appwrite/consultations")>();
  return {
    ...actual,
    createConsultationForUser: (...args: unknown[]) => createConsultationForUser(...args),
    appwriteReady: () => appwriteReady(),
  };
});

vi.mock("@/lib/appwrite/session", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

import { POST } from "@/app/api/consultations/route";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";
import { AppError, UnauthorizedError } from "@/lib/errors";

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

const userA = { id: "user-a", name: "Ana", email: "ana@hospital.org" };

describe("POST /api/consultations", () => {
  beforeEach(() => {
    createConsultationForUser.mockReset();
    appwriteReady.mockReset();
    requireUser.mockReset();
    appwriteReady.mockReturnValue(true);
    requireUser.mockResolvedValue(userA);
    createConsultationForUser.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      owner_user_id: userA.id,
      created_at: "2026-08-30T00:00:00.000Z",
      updated_at: "2026-08-30T00:00:00.000Z",
      started_at: "2026-08-30T00:00:00.000Z",
      finalized_at: null,
      status: "active",
      transcript: "",
      clinical_state: createEmptyClinicalState(),
      soap: null,
      finalize_warning: null,
      transcription_integrity: null,
    });
  });

  it("creates a consultation owned by the authenticated user", async () => {
    const res = await POST(
      req({
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({ status: "active", ownerUserId: "user-b" }),
      }),
    );
    expect(res.status).toBe(201);
    expect(createConsultationForUser).toHaveBeenCalledWith(
      "user-a",
      expect.objectContaining({ status: "active" }),
    );
    const [, payload] = createConsultationForUser.mock.calls[0] as [string, Record<string, unknown>];
    expect(payload).not.toHaveProperty("ownerUserId");
  });

  it("returns 409 when the physician already has an active consultation", async () => {
    createConsultationForUser.mockRejectedValue(
      new AppError(
        "Já existe um atendimento em andamento.",
        "active_consultation_exists",
        409,
      ),
    );
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
    expect(res.status).toBe(409);
    const json = (await res.json()) as { error: string; code: string };
    expect(json.code).toBe("active_consultation_exists");
  });

  it("returns 401 without a session", async () => {
    requireUser.mockRejectedValue(new UnauthorizedError());
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
    expect(res.status).toBe(401);
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
