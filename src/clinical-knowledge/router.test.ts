import { describe, expect, it } from "vitest";
import { selectRelevantProtocols } from "@/clinical-knowledge/router";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";

describe("protocol router", () => {
  it("selects chest-pain for chest pain plus dyspnea", () => {
    const docs = selectRelevantProtocols(
      createEmptyClinicalState(),
      "dor torácica e dispneia",
      [{ trigger: "high_risk_chest_pain", priority: "critical", matchedTerms: [] }],
    );
    expect(docs.some((item) => item.id === "chest-pain")).toBe(true);
    expect(docs.length).toBeLessThanOrEqual(3);
  });

  it("does not load all protocols", () => {
    const docs = selectRelevantProtocols(
      createEmptyClinicalState(),
      "dor torácica, síncope e déficit neurológico",
      [
        { trigger: "high_risk_chest_pain", priority: "critical", matchedTerms: [] },
        { trigger: "acute_neuro_deficit", priority: "critical", matchedTerms: [] },
      ],
    );
    expect(docs.length).toBeGreaterThan(0);
    expect(docs.length).toBeLessThanOrEqual(3);
  });

  it("returns empty when nothing matches", () => {
    const docs = selectRelevantProtocols(createEmptyClinicalState(), "consulta de rotina sem queixa", []);
    expect(docs).toEqual([]);
  });
});
