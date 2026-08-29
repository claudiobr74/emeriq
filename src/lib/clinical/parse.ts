import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";
import type {
  ClinicalAlert,
  ClinicalHypothesis,
  ClinicalState,
  ClinicalSuggestion,
  FinalClinicalReport,
} from "@/lib/clinical/schemas";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrap(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const nested =
    value.state ??
    value.clinical_state ??
    value.clinicalState ??
    value.report ??
    value.data ??
    value.result;
  if (isRecord(nested) && !value.patient && !value.soap && !value.hypotheses) {
    return nested;
  }
  return value;
}

function nullish(value: unknown): boolean {
  return value == null || value === "" || value === "null" || value === "undefined";
}

function asNullableString(value: unknown): string | null {
  if (nullish(value)) return null;
  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    typeof value !== "boolean"
  ) {
    return null;
  }
  const text = String(value).trim();
  if (!text || text === "[object Object]") return null;
  return text;
}

function priorityPhrase(value: unknown): string | null {
  if (nullish(value)) return null;
  const priority = hypothesisPriority(value);
  if (priority === "high") return "mais provável";
  if (priority === "low") return "menos provável";
  return "possível";
}

function asProse(value: unknown, depth = 0): string | null {
  if (depth > 5 || nullish(value)) return null;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return asNullableString(value);
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => asProse(item, depth + 1))
      .filter((item): item is string => Boolean(item));
    return parts.length > 0 ? parts.join("\n") : null;
  }
  if (!isRecord(value)) return null;

  const diagnosis = asProse(
    value.diagnosis ??
      value.diagnostico ??
      value.hipotese ??
      value.hypothesis ??
      value.name ??
      value.item ??
      value.title,
    depth + 1,
  );
  const detail = asProse(
    value.rationale ??
      value.justificativa ??
      value.interpretacao ??
      value.interpretation ??
      value.texto ??
      value.text ??
      value.content ??
      value.summary ??
      value.description,
    depth + 1,
  );
  const priority = priorityPhrase(value.priority);
  if (diagnosis && detail) {
    return priority ? `${diagnosis} (${priority}): ${detail}` : `${diagnosis}: ${detail}`;
  }
  if (diagnosis) {
    return priority ? `${diagnosis} (${priority}).` : diagnosis;
  }
  if (detail) return detail;

  const nestedHypotheses = value.hypotheses ?? value.hipoteses;
  if (Array.isArray(nestedHypotheses)) {
    return asProse(nestedHypotheses, depth + 1);
  }

  const leftover = Object.entries(value)
    .filter(([key]) => !["priority", "id", "type", "index"].includes(key))
    .map(([, nested]) => asProse(nested, depth + 1))
    .filter((item): item is string => Boolean(item));
  return leftover.length > 0 ? leftover.join(". ") : null;
}

function soapField(
  soap: Record<string, unknown>,
  obj: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const text = asProse(soap[key] ?? obj[key]);
    if (text) return text;
  }
  return null;
}

function assessmentFromHypotheses(hypotheses: ClinicalHypothesis[]): string | null {
  if (hypotheses.length === 0) return null;
  return hypotheses
    .map((item) => {
      const priority = priorityPhrase(item.priority);
      const head = priority ? `${item.diagnosis} (${priority})` : item.diagnosis;
      return item.rationale ? `${head}: ${item.rationale}` : `${head}.`;
    })
    .join("\n");
}

function asNumber(value: unknown): number | null {
  if (nullish(value)) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function asStringArray(value: unknown, max = 12): string[] {
  if (!Array.isArray(value)) {
    const single = asNullableString(value);
    return single ? [single] : [];
  }
  return value
    .map((item) => asNullableString(item))
    .filter((item): item is string => Boolean(item))
    .slice(0, max);
}

function hypothesisPriority(value: unknown): "high" | "medium" | "low" {
  const text = String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  if (text.includes("high") || text.includes("alta") || text.includes("exclu")) {
    return "high";
  }
  if (text.includes("low") || text.includes("baixa") || text.includes("menos")) {
    return "low";
  }
  return "medium";
}

function suggestionPriority(
  value: unknown,
): "immediate" | "urgent" | "routine" | null {
  if (nullish(value)) return null;
  const text = String(value)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  if (text.includes("immediate") || text.includes("imediat")) return "immediate";
  if (text.includes("urgent") || text.includes("urgenc")) return "urgent";
  if (text.includes("routine") || text.includes("rotina")) return "routine";
  return null;
}

function alertSeverity(value: unknown): "critical" | "warning" | "info" {
  const text = String(value ?? "").toLowerCase();
  if (text.includes("crit") || text.includes("grave")) return "critical";
  if (text.includes("warn") || text.includes("aten")) return "warning";
  return "info";
}

function asHypothesis(value: unknown): ClinicalHypothesis | null {
  if (typeof value === "string" && value.trim()) {
    return {
      diagnosis: value.trim(),
      priority: "medium",
      supportingFindings: [],
      opposingFindings: [],
      rationale: null,
    };
  }
  if (!isRecord(value)) return null;
  const diagnosis = asNullableString(value.diagnosis ?? value.name ?? value.item);
  if (!diagnosis) return null;
  return {
    diagnosis,
    priority: hypothesisPriority(value.priority),
    supportingFindings: asStringArray(value.supportingFindings),
    opposingFindings: asStringArray(value.opposingFindings),
    rationale: asNullableString(value.rationale),
  };
}

function asSuggestion(value: unknown): ClinicalSuggestion | null {
  if (typeof value === "string" && value.trim()) {
    return { item: value.trim(), rationale: "", priority: null };
  }
  if (!isRecord(value)) return null;
  const item = asNullableString(value.item ?? value.name ?? value.test);
  if (!item) return null;
  return {
    item,
    rationale: asNullableString(value.rationale) ?? "",
    priority: suggestionPriority(value.priority),
  };
}

function asAlert(value: unknown): ClinicalAlert | null {
  if (!isRecord(value)) return null;
  const title = asNullableString(value.title);
  const message = asNullableString(value.message);
  if (!title || !message) return null;
  return {
    severity: alertSeverity(value.severity),
    title,
    message,
  };
}

export function salvageClinicalState(raw: unknown): ClinicalState {
  const obj = unwrap(raw);
  if (!obj) {
    throw new Error("clinical_state_not_object");
  }

  const empty = createEmptyClinicalState();
  const hpi = isRecord(obj.historyPresentIllness) ? obj.historyPresentIllness : {};
  const patient = isRecord(obj.patient) ? obj.patient : {};
  const vitals = isRecord(obj.vitalSigns) ? obj.vitalSigns : {};
  const age = asNumber(patient.age ?? obj.idade ?? obj.age);
  const sex = asNullableString(patient.sex ?? obj.sexo ?? obj.sex);
  const complaint = asNullableString(
    obj.chiefComplaint ?? obj.queixa ?? obj.queixaPrincipal,
  );
  const questions = asStringArray(
    obj.suggestedQuestions ?? obj.perguntas ?? obj.questions,
    5,
  );
  const hypothesesSource = Array.isArray(obj.hypotheses)
    ? obj.hypotheses
    : Array.isArray(obj.hipoteses)
      ? obj.hipoteses
      : [];
  const alertsSource = Array.isArray(obj.alerts)
    ? obj.alerts
    : Array.isArray(obj.alertas)
      ? obj.alertas
      : [];
  const symptoms = asStringArray(
    hpi.associatedSymptoms ?? obj.sintomas ?? obj.symptoms,
  );

  return {
    ...empty,
    patient: {
      age,
      sex,
    },
    chiefComplaint: complaint,
    historyPresentIllness: {
      onset: asNullableString(hpi.onset),
      duration: asNullableString(hpi.duration ?? obj.tempo_sintomas_minutos),
      location: asNullableString(hpi.location),
      character: asNullableString(hpi.character),
      radiation: asNullableString(hpi.radiation),
      intensity: asNullableString(hpi.intensity),
      aggravatingFactors: asStringArray(hpi.aggravatingFactors),
      relievingFactors: asStringArray(hpi.relievingFactors),
      associatedSymptoms: symptoms,
    },
    pastMedicalHistory: asStringArray(obj.pastMedicalHistory),
    medications: asStringArray(obj.medications),
    allergies: asStringArray(obj.allergies),
    riskFactors: asStringArray(obj.riskFactors),
    vitalSigns: {
      bloodPressure: asNullableString(vitals.bloodPressure),
      heartRate: asNumber(vitals.heartRate),
      respiratoryRate: asNumber(vitals.respiratoryRate),
      oxygenSaturation: asNumber(vitals.oxygenSaturation),
      temperature: asNumber(vitals.temperature),
      glucose: asNumber(vitals.glucose),
    },
    physicalExam: asStringArray(obj.physicalExam),
    positiveFindings: asStringArray(obj.positiveFindings),
    negativeFindings: asStringArray(obj.negativeFindings),
    reportedFacts: asStringArray(obj.reportedFacts),
    observedFindings: asStringArray(obj.observedFindings),
    inferences: asStringArray(obj.inferences),
    hypotheses: hypothesesSource
      .map(asHypothesis)
      .filter((item): item is ClinicalHypothesis => Boolean(item))
      .slice(0, 6),
    dangerousDifferentials: (
      Array.isArray(obj.dangerousDifferentials) ? obj.dangerousDifferentials : []
    )
      .map(asHypothesis)
      .filter((item): item is ClinicalHypothesis => Boolean(item))
      .slice(0, 5),
    missingInformation: asStringArray(obj.missingInformation, 8),
    suggestedQuestions: questions,
    suggestedTests: (Array.isArray(obj.suggestedTests) ? obj.suggestedTests : [])
      .map(asSuggestion)
      .filter((item): item is ClinicalSuggestion => Boolean(item))
      .slice(0, 6),
    possibleTreatments: (
      Array.isArray(obj.possibleTreatments) ? obj.possibleTreatments : []
    )
      .map(asSuggestion)
      .filter((item): item is ClinicalSuggestion => Boolean(item))
      .slice(0, 6),
    alerts: alertsSource
      .map(asAlert)
      .filter((item): item is ClinicalAlert => Boolean(item))
      .slice(0, 5),
  };
}

export function salvageFinalReport(raw: unknown): FinalClinicalReport {
  const obj = unwrap(raw);
  if (!obj) {
    throw new Error("final_report_not_object");
  }
  const soap = isRecord(obj.soap) ? obj.soap : {};
  const stateLike = salvageClinicalState(obj);
  return {
    soap: {
      subjective:
        soapField(soap, obj, ["subjective", "subjetivo", "S"]) ??
        "Não informado.",
      objective:
        soapField(soap, obj, ["objective", "objetivo", "O"]) ?? "Não informado.",
      assessment:
        soapField(soap, obj, ["assessment", "avaliacao", "avaliação", "A"]) ??
        assessmentFromHypotheses(stateLike.hypotheses) ??
        "Não informado.",
      plan: soapField(soap, obj, ["plan", "plano", "P"]) ?? "Não informado.",
    },
    hypotheses: stateLike.hypotheses,
    dangerousDifferentials: stateLike.dangerousDifferentials,
    suggestedTests: stateLike.suggestedTests,
    possibleTreatments: stateLike.possibleTreatments,
    unresolvedQuestions: asStringArray(
      obj.unresolvedQuestions ?? obj.missingInformation,
      10,
    ),
    alerts: stateLike.alerts,
  };
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("empty_model_content");
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced ? fenced[1] : trimmed).trim();
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
    throw new Error("invalid_json_payload");
  }
}
