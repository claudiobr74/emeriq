import { describe, expect, it, vi } from "vitest";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";

const createMock = vi.fn();

vi.mock("@/lib/openai/client", () => ({
  getOpenAiClient: () => ({
    chat: { completions: { create: createMock } },
  }),
}));

import { OpenAiClinicalProvider } from "@/lib/openai/clinical";

function respondWith(json: unknown) {
  createMock.mockResolvedValueOnce({
    choices: [{ message: { content: JSON.stringify(json) } }],
  });
}

describe("OpenAiClinicalProvider (mocked OpenAI)", () => {
  it("parses model JSON into ClinicalState and attaches safety triggers", async () => {
    const base = createEmptyClinicalState();
    respondWith({
      ...base,
      chiefComplaint: "dor torácica",
      hypotheses: [
        {
          diagnosis: "Síndrome Coronariana Aguda",
          priority: "high",
          supportingFindings: ["dor torácica"],
          opposingFindings: [],
          rationale: "clínica típica",
        },
      ],
    });

    const provider = new OpenAiClinicalProvider();
    const state = await provider.update({
      currentState: base,
      confirmedTranscript: "paciente com dor no peito e sudorese",
      newSegment: "dor no peito e sudorese",
    });

    expect(createMock).toHaveBeenCalledOnce();
    expect(state.hypotheses[0]?.diagnosis).toContain("Coronariana");
    // Glasgow não é inferido pelo modelo → permanece null.
    expect(state.vitalSigns.glasgow).toBeNull();
    // systemSafetyTriggers vem da Safety Layer determinística.
    expect(Array.isArray(state.systemSafetyTriggers)).toBe(true);
  });

  it("maps OpenAI 429 to a controlled clinical error", async () => {
    createMock.mockRejectedValueOnce(
      Object.assign(new Error("rate_limit"), { status: 429 }),
    );
    const provider = new OpenAiClinicalProvider();
    await expect(
      provider.update({
        currentState: createEmptyClinicalState(),
        confirmedTranscript: "texto",
        newSegment: "texto",
      }),
    ).rejects.toMatchObject({ code: "clinical_model_failed" });
  });
});
