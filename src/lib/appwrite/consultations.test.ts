import { afterEach, describe, expect, it, vi } from "vitest";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";

vi.mock("@/lib/env", () => ({
  getAppwriteEndpoint: () => "https://cloud.appwrite.io/v1",
  getAppwriteProjectId: () => "proj",
  getAppwriteApiKey: () => "key",
  getAppwriteDatabaseId: () => "emeriq",
  getAppwriteTableId: () => "consultations",
  isAppwriteConfigured: () => true,
}));

import { createConsultation, getConsultation } from "@/lib/appwrite/consultations";

const empty = createEmptyClinicalState();

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Appwrite consultations", () => {
  it("creates a row and maps $id / JSON columns", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 201,
        json: async () => ({
          $id: "11111111-1111-4111-8111-111111111111",
          $createdAt: "2026-08-30T00:00:00.000Z",
          $updatedAt: "2026-08-30T00:00:00.000Z",
          status: "active",
          transcript: "",
          clinical_state: JSON.stringify(empty),
          soap: "",
          finalize_warning: "",
        }),
      })),
    );
    const row = await createConsultation({ status: "active" });
    expect(row.id).toBe("11111111-1111-4111-8111-111111111111");
    expect(row.soap).toBeNull();
    expect(row.clinical_state.chiefComplaint).toBeNull();
  });

  it("reads a stored consultation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          $id: "11111111-1111-4111-8111-111111111111",
          $createdAt: "2026-08-30T00:00:00.000Z",
          $updatedAt: "2026-08-30T00:00:01.000Z",
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
          finalize_warning: "",
        }),
      })),
    );
    const row = await getConsultation("11111111-1111-4111-8111-111111111111");
    expect(row.status).toBe("finalized");
    expect(row.transcript).toBe("dor no peito");
    expect(row.soap?.soap.assessment).toBe("SCA");
  });
});
