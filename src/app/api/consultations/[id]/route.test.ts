import { describe, expect, it, vi, beforeEach } from "vitest";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";

const getConsultation = vi.fn();
const updateConsultation = vi.fn();
const supabaseReady = vi.fn();

vi.mock("@/lib/supabase/consultations", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase/consultations")>();
  return {
    ...actual,
    getConsultation: (...args: unknown[]) => getConsultation(...args),
    updateConsultation: (...args: unknown[]) => updateConsultation(...args),
    supabaseReady: () => supabaseReady(),
  };
});

import { GET, PATCH } from "@/app/api/consultations/[id]/route";

const row = {
  id: "11111111-1111-4111-8111-111111111111",
  created_at: "2026-08-30T00:00:00.000Z",
  updated_at: "2026-08-30T00:00:00.000Z",
  status: "active" as const,
  transcript: "dor no peito",
  clinical_state: createEmptyClinicalState(),
  soap: null,
  finalize_warning: null,
};

const params = { params: Promise.resolve({ id: row.id }) };

describe("GET/PATCH /api/consultations/[id]", () => {
  beforeEach(() => {
    getConsultation.mockReset();
    updateConsultation.mockReset();
    supabaseReady.mockReset();
    supabaseReady.mockReturnValue(true);
    getConsultation.mockResolvedValue(row);
    updateConsultation.mockResolvedValue({ ...row, status: "finalized" });
  });

  it("reads a consultation by id", async () => {
    const res = await GET(
      new Request("http://localhost/api/consultations/" + row.id, {
        headers: { origin: "http://localhost", host: "localhost" },
      }),
      params,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { transcript: string };
    expect(json.transcript).toBe("dor no peito");
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

  it("patches a consultation", async () => {
    const res = await PATCH(
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
    expect(res.status).toBe(200);
    const json = (await res.json()) as { status: string };
    expect(json.status).toBe("finalized");
  });
});
