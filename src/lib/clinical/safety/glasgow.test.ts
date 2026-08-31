import { describe, expect, it } from "vitest";
import { evaluateSafety } from "@/lib/clinical/safety";
import { applySafetyToClinicalState } from "@/lib/clinical/safety/apply";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";
import { SAFETY_THRESHOLDS } from "@/lib/clinical/safety/thresholds";

describe("Glasgow in Safety Layer", () => {
  it("GCS <= 8 is a critical altered consciousness trigger, not a diagnosis", () => {
    const state = createEmptyClinicalState();
    state.vitalSigns.glasgow = 8;
    const triggers = evaluateSafety({
      transcript: "",
      vitalSigns: state.vitalSigns,
    });
    const hit = triggers.find((item) => item.trigger === "altered_level_of_consciousness");
    expect(hit?.priority).toBe("critical");
    expect(triggers.some((item) => item.trigger.toLowerCase().includes("coma"))).toBe(false);
  });

  it("GCS 9–12 is significant, not diagnostic", () => {
    const triggers = evaluateSafety({
      transcript: "",
      vitalSigns: {
        ...createEmptyClinicalState().vitalSigns,
        glasgow: 10,
      },
    });
    const hit = triggers.find((item) => item.trigger === "altered_level_of_consciousness");
    expect(hit?.priority).toBe("high");
  });

  it("GCS 15 does not fire the consciousness trigger", () => {
    const triggers = evaluateSafety({
      transcript: "",
      vitalSigns: {
        ...createEmptyClinicalState().vitalSigns,
        glasgow: 15,
      },
    });
    expect(triggers.some((item) => item.trigger === "altered_level_of_consciousness")).toBe(
      false,
    );
  });

  it("manual hypotension updates alerts immediately without new transcript", () => {
    const state = createEmptyClinicalState();
    state.vitalSigns.bloodPressure = "70/40";
    const next = applySafetyToClinicalState(state, "");
    expect(next.systemSafetyTriggers.some((item) => item.trigger === "hemodynamic_instability")).toBe(
      true,
    );
    expect(next.alerts.length).toBeGreaterThan(0);
    expect(next.alerts[0]?.title.toLowerCase()).not.toContain("diagnóstico");
  });

  it("uses centralized GCS threshold", () => {
    expect(SAFETY_THRESHOLDS.glasgowCriticalMax).toBe(8);
    expect(SAFETY_THRESHOLDS.glasgowSignificantMax).toBe(12);
  });
});
