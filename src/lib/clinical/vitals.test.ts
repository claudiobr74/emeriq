import { describe, expect, it } from "vitest";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";
import { clinicalStateSchema } from "@/lib/clinical/schemas";
import {
  VITAL_DESCRIPTORS,
  VITAL_GLUCOSE,
  isVitalCritical,
  parseVitalInput,
} from "@/lib/clinical/vitals";

describe("vital signs: Glasgow + Glicemia", () => {
  it("empty state has both glasgow and glucose (null)", () => {
    const vitals = createEmptyClinicalState().vitalSigns;
    expect(vitals.glasgow).toBeNull();
    expect(vitals.glucose).toBeNull();
  });

  it("Glasgow is one of the six main cards; Glicemia is complementary", () => {
    const fields = VITAL_DESCRIPTORS.map((d) => d.field);
    expect(fields).toContain("glasgow");
    expect(fields).not.toContain("glucose");
    expect(VITAL_GLUCOSE.field).toBe("glucose");
    expect(fields).toHaveLength(6);
  });

  it("glasgow and glucose are independent fields in ClinicalState", () => {
    const base = createEmptyClinicalState();
    const parsed = clinicalStateSchema.parse({
      ...base,
      vitalSigns: { ...base.vitalSigns, glasgow: 15, glucose: 92 },
    });
    expect(parsed.vitalSigns.glasgow).toBe(15);
    expect(parsed.vitalSigns.glucose).toBe(92);
  });

  it("glucose uses the hypoglycemia safety threshold; glasgow is not auto-flagged", () => {
    const base = createEmptyClinicalState().vitalSigns;
    expect(isVitalCritical("glucose", { ...base, glucose: 60 })).toBe(true);
    expect(isVitalCritical("glucose", { ...base, glucose: 92 })).toBe(false);
    // Sem regra numérica de GCS na Safety Layer → não inventamos destaque.
    expect(isVitalCritical("glasgow", { ...base, glasgow: 8 })).toBe(false);
  });

  it("parseVitalInput keeps blood pressure as text and others numeric", () => {
    expect(parseVitalInput("bloodPressure", "120/80")).toBe("120/80");
    expect(parseVitalInput("glasgow", "15")).toBe(15);
    expect(parseVitalInput("glucose", "92")).toBe(92);
    expect(parseVitalInput("glasgow", "")).toBeNull();
  });
});
