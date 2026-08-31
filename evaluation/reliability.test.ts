import { describe, expect, it } from "vitest";
import { CLINICAL_CASES } from "./cases";
import { applyReliabilityLayer } from "@/lib/clinical/reliability";
import { extractKeyPresence } from "@/lib/clinical/presence";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";
import { evaluateSafety } from "@/lib/clinical/safety";
import { selectRelevantProtocols } from "@/clinical-knowledge/router";
import { mandatoryConsiderationsFromTriggers } from "@/lib/clinical/safety/considerations";

function transcriptOf(id: string): string {
  const testCase = CLINICAL_CASES.find((item) => item.id === id);
  if (!testCase) throw new Error(id);
  return testCase.transcriptSegments.join(" ");
}

describe("v1.3 safety + routing from FAIL autopsy", () => {
  it("fires GI bleeding on coffee-ground emesis", () => {
    const transcript = transcriptOf("gi-bleed-01");
    const triggers = evaluateSafety({ transcript });
    expect(triggers.some((item) => item.trigger === "gi_bleeding")).toBe(true);
    const protocols = selectRelevantProtocols(createEmptyClinicalState(), transcript, triggers, 2);
    expect(protocols.some((item) => item.id === "abdominal-pain")).toBe(true);
    const labels = mandatoryConsiderationsFromTriggers(triggers).map((item) => item.label);
    expect(labels.some((item) => /hemorragia digestiva/i.test(item))).toBe(true);
  });

  it("fires head trauma high risk on fall + LOC + anticoagulant", () => {
    const transcript = transcriptOf("tbi-01");
    const triggers = evaluateSafety({ transcript });
    expect(triggers.some((item) => item.trigger === "head_trauma_high_risk")).toBe(true);
    const protocols = selectRelevantProtocols(createEmptyClinicalState(), transcript, triggers, 2);
    expect(protocols.some((item) => item.id === "trauma")).toBe(true);
    expect(protocols.some((item) => item.id === "chest-pain")).toBe(false);
  });

  it("does not route queda de escada as SCA via substring", () => {
    const docs = selectRelevantProtocols(
      createEmptyClinicalState(),
      "Queda de escada, bateu a cabeça.",
      [],
    );
    expect(docs.some((item) => item.id === "chest-pain")).toBe(false);
  });

  it("fires chest trauma respiratory on motorcycle accident with decreased breath sounds", () => {
    const transcript = transcriptOf("chest-trauma-01");
    const triggers = evaluateSafety({ transcript });
    expect(triggers.some((item) => item.trigger === "chest_trauma_respiratory")).toBe(true);
    const labels = mandatoryConsiderationsFromTriggers(triggers).map((item) => item.label);
    expect(labels.some((item) => /pneumot/i.test(item))).toBe(true);
  });

  it("fires intoxication on unknown substance and miosis", () => {
    const transcript = transcriptOf("tox-unknown-01");
    const triggers = evaluateSafety({ transcript });
    expect(triggers.some((item) => item.trigger === "intoxication")).toBe(true);
  });

  it("injects mustNotMiss labels into dangerousDifferentials", () => {
    const transcript = transcriptOf("gi-bleed-01");
    const triggers = evaluateSafety({ transcript });
    const next = applyReliabilityLayer(createEmptyClinicalState(), transcript, triggers);
    const blob = next.dangerousDifferentials.map((item) => item.diagnosis).join(" ");
    expect(blob.toLocaleLowerCase("pt-BR")).toMatch(/hemorragia digestiva/);
  });
});

describe("tri-state presence", () => {
  it("keeps dyspnea unknown when not mentioned", () => {
    const presence = extractKeyPresence("Paciente refere dor torácica.");
    expect(presence.dyspnea).toBe("unknown");
    expect(presence.syncope).toBe("unknown");
  });

  it("marks explicit negation only", () => {
    const presence = extractKeyPresence("Dor no peito. Nega dispneia. Nega febre.");
    expect(presence.dyspnea).toBe("negative_explicit");
    expect(presence.fever).toBe("negative_explicit");
    expect(presence.syncope).toBe("unknown");
  });

  it("marks coffee-ground as positive bleeding", () => {
    const presence = extractKeyPresence("Vômito com sangue em borra de café.");
    expect(presence.bleeding).toBe("positive");
  });
});
