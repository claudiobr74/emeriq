import { describe, expect, it } from "vitest";
import { AI_CONFIG, getAnalysisCadence } from "@/config/ai";
import { DEFAULT_SETTINGS } from "@/types/clinical";

describe("settings: no misleading depth option", () => {
  it("AppSettings does not expose an analysis-depth selector", () => {
    expect("analysisPace" in DEFAULT_SETTINGS).toBe(false);
  });

  it("analysis is a cadence (frequency), defaulting to balanced", () => {
    // 'balanced' é o único comportamento exposto; não há 'Profunda'→economical.
    expect(AI_CONFIG.defaultCadence).toBe("balanced");
    expect(getAnalysisCadence()).toEqual(AI_CONFIG.analysisCadence.balanced);
  });

  it("cadence presets represent update frequency, not reasoning depth", () => {
    expect(AI_CONFIG.analysisCadence.fast.intervalMs).toBeLessThan(
      AI_CONFIG.analysisCadence.economical.intervalMs,
    );
  });
});
