import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";
import { UnauthorizedError } from "@/lib/errors";

const findActiveConsultationForUser = vi.fn();
const appwriteReady = vi.fn();
const requireUser = vi.fn();

vi.mock("@/lib/appwrite/consultations", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/appwrite/consultations")>();
  return {
    ...actual,
    findActiveConsultationForUser: (...args: unknown[]) =>
      findActiveConsultationForUser(...args),
    appwriteReady: () => appwriteReady(),
  };
});

vi.mock("@/lib/appwrite/session", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

import { GET } from "@/app/api/consultations/active/route";

const userA = { id: "user-a", name: "Ana", email: "ana@hospital.org" };
const row = {
  id: "11111111-1111-4111-8111-111111111111",
  owner_user_id: userA.id,
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

describe("GET /api/consultations/active", () => {
  beforeEach(() => {
    findActiveConsultationForUser.mockReset();
    appwriteReady.mockReset();
    requireUser.mockReset();
    appwriteReady.mockReturnValue(true);
    requireUser.mockResolvedValue(userA);
  });

  it("returns the authenticated user's active consultation", async () => {
    findActiveConsultationForUser.mockResolvedValue(row);
    const res = await GET(
      new Request("http://localhost/api/consultations/active", {
        headers: { origin: "http://localhost", host: "localhost" },
      }),
    );
    expect(res.status).toBe(200);
    expect(findActiveConsultationForUser).toHaveBeenCalledWith("user-a");
    const json = (await res.json()) as { consultation: { owner_user_id: string } };
    expect(json.consultation.owner_user_id).toBe("user-a");
  });

  it("returns 401 without a session", async () => {
    requireUser.mockRejectedValue(new UnauthorizedError());
    const res = await GET(
      new Request("http://localhost/api/consultations/active", {
        headers: { origin: "http://localhost", host: "localhost" },
      }),
    );
    expect(res.status).toBe(401);
  });
});
