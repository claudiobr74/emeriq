import { describe, expect, it } from "vitest";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";

describe("reset de sessão", () => {
  it("empty state has no prior consultation residue", () => {
    const dirty = createEmptyClinicalState();
    dirty.chiefComplaint = "dor torácica";
    dirty.medications = ["varfarina"];
    dirty.systemSafetyTriggers = [
      { trigger: "high_risk_chest_pain", priority: "critical", matchedTerms: [] },
    ];
    const next = createEmptyClinicalState();
    expect(next.chiefComplaint).toBeNull();
    expect(next.medications).toEqual([]);
    expect(next.systemSafetyTriggers).toEqual([]);
    expect(next.hypotheses).toEqual([]);
  });
});
