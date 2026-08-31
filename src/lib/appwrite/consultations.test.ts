import { afterEach, describe, expect, it, vi } from "vitest";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";
import { ForbiddenError } from "@/lib/errors";

vi.mock("@/lib/env", () => ({
  getAppwriteEndpoint: () => "https://cloud.appwrite.io/v1",
  getAppwriteProjectId: () => "proj",
  getAppwriteApiKey: () => "key",
  getAppwriteAdminApiKey: () => "key",
  getAppwriteDatabaseId: () => "emeriq",
  getAppwriteTableId: () => "consultations",
  isAppwriteConfigured: () => true,
}));

vi.mock("@/lib/appwrite/session", () => ({
  getSessionSecret: async () => "sess",
}));

import {
  createConsultationForUser,
  getConsultationForUser,
} from "@/lib/appwrite/consultations";

const empty = createEmptyClinicalState();

function row(overrides: Record<string, unknown> = {}) {
  return {
    $id: "11111111-1111-4111-8111-111111111111",
    $createdAt: "2026-08-30T00:00:00.000Z",
    $updatedAt: "2026-08-30T00:00:00.000Z",
    owner_user_id: "user-a",
    status: "active",
    transcript: "",
    clinical_state: JSON.stringify(empty),
    soap: "",
    finalize_warning: "",
    started_at: "2026-08-30T00:00:00.000Z",
    finalized_at: "",
    transcription_integrity: "",
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Appwrite consultations ownership", () => {
  it("creates a row owned by the authenticated user", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<{
        ok: boolean;
        status: number;
        json: () => Promise<unknown>;
      }>
    >(async (input) => {
      const url = String(input);
      if (url.includes("queries")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ rows: [] }),
        };
      }
      return {
        ok: true,
        status: 201,
        json: async () => row(),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const created = await createConsultationForUser("user-a", { status: "active" });
    expect(created.owner_user_id).toBe("user-a");
    const post = fetchMock.mock.calls.find((call) => call[1]?.method === "POST");
    const body = JSON.parse(String(post?.[1]?.body));
    expect(body.data.owner_user_id).toBe("user-a");
  });

  it("rejects a second active consultation for the same user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("queries")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ rows: [row()] }),
          };
        }
        return {
          ok: true,
          status: 201,
          json: async () => row(),
        };
      }),
    );
    await expect(createConsultationForUser("user-a", { status: "active" })).rejects.toMatchObject({
      code: "active_consultation_exists",
      status: 409,
    });
  });

  it("refuses to return another physician's consultation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => row({ owner_user_id: "user-a" }),
      })),
    );
    await expect(
      getConsultationForUser("11111111-1111-4111-8111-111111111111", "user-b"),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("reads a stored consultation for the owner", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () =>
          row({
            status: "finalized",
            transcript: "dor no peito",
            clinical_state: JSON.stringify({ ...empty, chiefComplaint: "dor no peito" }),
            soap: JSON.stringify({
              soap: {
                subjective: "dor",
                objective: "",
                assessment: "SCA",
                plan: "ECG",
              },
              hypotheses: [],
              dangerousDifferentials: [],
              suggestedTests: [],
              possibleTreatments: [],
              unresolvedQuestions: [],
              alerts: [],
            }),
          }),
      })),
    );
    const loaded = await getConsultationForUser(
      "11111111-1111-4111-8111-111111111111",
      "user-a",
    );
    expect(loaded.status).toBe("finalized");
    expect(loaded.transcript).toBe("dor no peito");
    expect(loaded.soap?.soap.assessment).toBe("SCA");
  });
});
