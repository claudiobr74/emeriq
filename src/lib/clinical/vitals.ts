import { SAFETY_THRESHOLDS } from "@/lib/clinical/safety/thresholds";
import { parseSystolic } from "@/lib/clinical/safety/rules";
import type { ClinicalState } from "@/lib/clinical/schemas";

export type VitalNumericField =
  | "heartRate"
  | "respiratoryRate"
  | "oxygenSaturation"
  | "temperature"
  | "glucose";

export type VitalField = "bloodPressure" | VitalNumericField;

export interface VitalDescriptor {
  field: VitalField;
  label: string;
  unit: string;
}

/**
 * Ordem e rótulos dos cartões de sinais vitais (Figma consultation 5:82).
 * O 6º slot do Figma ("Glasgow") é mapeado para Glicemia, o dado realmente
 * rastreado pelo pipeline clínico e usado pela Safety Layer (hipoglicemia);
 * não exibimos um campo sem efeito no runtime (zero mocks).
 */
export const VITAL_DESCRIPTORS: VitalDescriptor[] = [
  { field: "bloodPressure", label: "PA", unit: "mmHg" },
  { field: "heartRate", label: "FC", unit: "bpm" },
  { field: "oxygenSaturation", label: "SpO₂", unit: "%" },
  { field: "respiratoryRate", label: "FR", unit: "irpm" },
  { field: "temperature", label: "Temp", unit: "°C" },
  { field: "glucose", label: "Glicemia", unit: "mg/dL" },
];

/**
 * Marca um sinal vital como crítico reutilizando os limiares centralizados da
 * Safety Layer (não duplicar lógica clínica na UI — seção 31). Só há limiares
 * numéricos para PA (hipotensão/emergência hipertensiva), SpO₂ (hipoxemia) e
 * glicemia (hipoglicemia); os demais não são destacados por não existir regra.
 */
export function isVitalCritical(
  field: VitalField,
  vitals: ClinicalState["vitalSigns"],
): boolean {
  switch (field) {
    case "bloodPressure": {
      const systolic = parseSystolic(vitals.bloodPressure);
      if (systolic == null) return false;
      return (
        systolic < SAFETY_THRESHOLDS.hypotensionSystolicMmHg ||
        systolic >= SAFETY_THRESHOLDS.hypertensiveEmergencySystolicMmHg
      );
    }
    case "oxygenSaturation":
      return (
        vitals.oxygenSaturation != null &&
        vitals.oxygenSaturation < SAFETY_THRESHOLDS.hypoxemiaSpO2Percent
      );
    case "glucose":
      return (
        vitals.glucose != null &&
        vitals.glucose < SAFETY_THRESHOLDS.hypoglycemiaMgDl
      );
    default:
      return false;
  }
}

export function formatVitalValue(
  field: VitalField,
  vitals: ClinicalState["vitalSigns"],
): string {
  const value = vitals[field];
  if (value == null || value === "") return "—";
  return String(value);
}

/** Converte a entrada manual para o tipo do campo do ClinicalState. */
export function parseVitalInput(
  field: VitalField,
  raw: string,
): string | number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (field === "bloodPressure") return trimmed;
  const numeric = Number(trimmed.replace(",", "."));
  return Number.isFinite(numeric) ? numeric : null;
}
