import { describe, expect, it, vi, beforeEach } from "vitest";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

const getConsultationForUser = vi.fn();
const updateConsultationForUser = vi.fn();
const discardConsultationForUser = vi.fn();
const appwriteReady = vi.fn();
const requireUser = vi.fn();

vi.mock("@/lib/appwrite/consultations", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/appwrite/consultations")>();
  return {
    ...actual,
    getConsultationForUser: (...args: unknown[]) => getConsultationForUser(...args),
    updateConsultationForUser: (...args: unknown[]) => updateConsultationForUser(...args),
    discardConsultationForUser: (...args: unknown[]) => discardConsultationForUser(...args),
    appwriteReady: () => appwriteReady(),
  };
});

vi.mock("@/lib/appwrite/session", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

import { DELETE, GET, PATCH } from "@/app/api/consultations/[id]/route";

const row = {
  id: "11111111-1111-4111-8111-111111111111",
  owner_user_id: "user-a",
  created_at: "2026-08-30T00:00:00.000Z",
  updated_at: "2026-08-30T00:00:00.000Z",
  started_at: "2026-08-30T00:00:00.000Z",
  finalized_at: null,
  status: "active" as const,
  transcript: "dor no peito",
  clinical_state: createEmptyClinicalState(),
  soap: null,
  finalize_warning: null,
  transcription_integrity: null,
};

const params = { params: Promise.resolve({ id: row.id }) };
const userA = { id: "user-a", name: "Ana", email: "ana@hospital.org" };
const userB = { id: "user-b", name: "Beto", email: "beto@hospital.org" };

describe("GET/PATCH/DELETE /api/consultations/[id]", () => {
  beforeEach(() => {
    getConsultationForUser.mockReset();
    updateConsultationForUser.mockReset();
    discardConsultationForUser.mockReset();
    appwriteReady.mockReset();
    requireUser.mockReset();
    appwriteReady.mockReturnValue(true);
    requireUser.mockResolvedValue(userA);
    getConsultationForUser.mockResolvedValue(row);
    updateConsultationForUser.mockResolvedValue({ ...row, status: "finalized" });
    discardConsultationForUser.mockResolvedValue({ ...row, status: "discarded" });
  });

  it("reads a consultation by id for the owner", async () => {
    const res = await GET(
      new Request("http://localhost/api/consultations/" + row.id, {
        headers: { origin: "http://localhost", host: "localhost" },
      }),
      params,
    );
    expect(res.status).toBe(200);
    expect(getConsultationForUser).toHaveBeenCalledWith(row.id, "user-a");
  });

  it("returns 404 when physician B requests physician A's consultation", async () => {
    requireUser.mockResolvedValue(userB);
    getConsultationForUser.mockRejectedValue(new ForbiddenError());
    const res = await GET(
      new Request("http://localhost/api/consultations/" + row.id, {
        headers: { origin: "http://localhost", host: "localhost" },
      }),
      params,
    );
    expect(res.status).toBe(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).not.toContain("user-a");
    expect(json.error).not.toContain("dor no peito");
  });

  it("returns 404 on PATCH/DELETE isolation", async () => {
    requireUser.mockResolvedValue(userB);
    updateConsultationForUser.mockRejectedValue(new ForbiddenError());
    discardConsultationForUser.mockRejectedValue(new ForbiddenError());
    const patch = await PATCH(
      new Request("http://localhost/api/consultations/" + row.id, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({ status: "finalized" }),
      }),
      params,
    );
    expect(patch.status).toBe(404);
    const del = await DELETE(
      new Request("http://localhost/api/consultations/" + row.id, {
        method: "DELETE",
        headers: { origin: "http://localhost", host: "localhost" },
      }),
      params,
    );
    expect(del.status).toBe(404);
  });

  it("returns 401 without a session", async () => {
    requireUser.mockRejectedValue(new UnauthorizedError());
    const res = await GET(
      new Request("http://localhost/api/consultations/" + row.id, {
        headers: { origin: "http://localhost", host: "localhost" },
      }),
      params,
    );
    expect(res.status).toBe(401);
  });

  it("rejects an invalid id", async () => {
    const res = await GET(
      new Request("http://localhost/api/consultations/not-a-uuid", {
        headers: { origin: "http://localhost", host: "localhost" },
      }),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );
    expect(res.status).toBe(400);
  });

  it("patches a consultation for the owner", async () => {
    const res = await PATCH(
      new Request("http://localhost/api/consultations/" + row.id, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({ status: "finalized", ownerUserId: "user-b" }),
      }),
      params,
    );
    expect(res.status).toBe(200);
    expect(updateConsultationForUser).toHaveBeenCalledWith(
      row.id,
      "user-a",
      expect.not.objectContaining({ ownerUserId: "user-b" }),
    );
  });
});
