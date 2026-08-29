import { describe, expect, it } from "vitest";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";
import { evaluateSafety } from "@/lib/clinical/safety";
import { SAFETY_THRESHOLDS } from "@/lib/clinical/safety/thresholds";

describe("safety rules", () => {
  it("does not mark isolated chest pain as critical", () => {
    const triggers = evaluateSafety({
      transcript: "Paciente com dor no peito há duas horas, estável.",
    });
    const chest = triggers.find((item) => item.trigger === "chest_pain_isolated");
    const high = triggers.find((item) => item.trigger === "high_risk_chest_pain");
    expect(chest?.priority).toBe("watch");
    expect(high).toBeUndefined();
  });

  it("marks chest pain plus hypotension as critical", () => {
    const triggers = evaluateSafety({
      transcript: "Dor no peito. Pressão 75 por 40.",
    });
    expect(triggers.some((item) => item.trigger === "high_risk_chest_pain" && item.priority === "critical")).toBe(
      true,
    );
  });

  it("uses centralized hypotension threshold as borderline", () => {
    const justBelow = evaluateSafety({
      transcript: `Dor torácica. PA ${SAFETY_THRESHOLDS.hypotensionSystolicMmHg - 1}/50.`,
    });
    const atThreshold = evaluateSafety({
      transcript: `Dor torácica. PA ${SAFETY_THRESHOLDS.hypotensionSystolicMmHg}/60.`,
    });
    expect(justBelow.some((item) => item.trigger === "high_risk_chest_pain")).toBe(true);
    expect(atThreshold.some((item) => item.trigger === "high_risk_chest_pain")).toBe(false);
  });

  it("requires explicit SpO2 for hypoxemia", () => {
    const without = evaluateSafety({ transcript: "Está com falta de ar." });
    const withValue = evaluateSafety({ transcript: "Saturação 82 por cento." });
    expect(without.some((item) => item.trigger === "hypoxemia")).toBe(false);
    expect(withValue.some((item) => item.trigger === "hypoxemia")).toBe(true);
  });

  it("detects acute neuro deficit", () => {
    const triggers = evaluateSafety({
      transcript: "Fraqueza de um lado e desvio de rima desde há 20 minutos.",
    });
    expect(triggers.some((item) => item.trigger === "acute_neuro_deficit")).toBe(true);
  });

  it("does not fire anaphylaxis on isolated rash", () => {
    const triggers = evaluateSafety({ transcript: "Apareceu uma urticária leve no braço." });
    expect(triggers.some((item) => item.trigger === "anaphylaxis")).toBe(false);
  });

  it("fails closed if evaluator throws internally", () => {
    expect(evaluateSafety({ transcript: "" })).toEqual([]);
  });

  it("reads vitals from clinical state", () => {
    const state = createEmptyClinicalState();
    state.vitalSigns.bloodPressure = "80/40";
    const triggers = evaluateSafety({
      transcript: "Dor no peito.",
      vitalSigns: state.vitalSigns,
    });
    expect(triggers.some((item) => item.trigger === "high_risk_chest_pain")).toBe(true);
  });

  it("marks tearing chest pain radiating to the back as critical", () => {
    const triggers = evaluateSafety({
      transcript:
        "Homem de 61 anos, dor torácica súbita em rasgo irradiando para as costas.",
    });
    expect(
      triggers.some((item) => item.trigger === "high_risk_chest_pain" && item.priority === "critical"),
    ).toBe(true);
  });

  it("marks thunderclap headache as high, not a diagnosis", () => {
    const triggers = evaluateSafety({
      transcript: "Pior dor de cabeça da vida, começou em um segundo.",
    });
    const thunder = triggers.find((item) => item.trigger === "thunderclap_headache");
    expect(thunder?.priority).toBe("high");
    expect(triggers.some((item) => item.trigger === "anaphylaxis")).toBe(false);
  });

  it("detects anaphylaxis after antibiotic plus respiratory and cutaneous signs", () => {
    const triggers = evaluateSafety({
      transcript: "Tomou antibiótico e minutos depois urticária, chiado e falta de ar. Pressão 82 por 50.",
    });
    expect(triggers.some((item) => item.trigger === "anaphylaxis" && item.priority === "critical")).toBe(
      true,
    );
  });
});
