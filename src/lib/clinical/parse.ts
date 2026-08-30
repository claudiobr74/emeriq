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

  const label = asProse(
    value.diagnosis ??
      value.diagnostico ??
      value.hipotese ??
      value.hypothesis ??
      value.finding ??
      value.achado ??
      value.exame ??
      value.exam ??
      value.sinal ??
      value.sign ??
      value.parameter ??
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
      value.observacao ??
      value.observation ??
      value.resultado ??
      value.result ??
      value.valor ??
      value.value ??
      value.measure ??
      value.measurement ??
      value.texto ??
      value.text ??
      value.content ??
      value.summary ??
      value.description,
    depth + 1,
  );
  const priority = priorityPhrase(value.priority);
  if (label && detail) {
    return priority ? `${label} (${priority}): ${detail}` : `${label}: ${detail}`;
  }
  if (label) {
    return priority ? `${label} (${priority}).` : label;
  }
  if (detail) return detail;

  const nestedList =
    value.hypotheses ??
    value.hipoteses ??
    value.findings ??
    value.achados ??
    value.vitals ??
    value.vitalSigns ??
    value.sinaisVitais ??
    value.physicalExam ??
    value.exameFisico;
  if (Array.isArray(nestedList) || isRecord(nestedList)) {
    const nested = asProse(nestedList, depth + 1);
    if (nested) return nested;
  }

  return labeledRecord(value, depth);
}

const FIELD_LABELS: Record<string, string> = {
  bloodPressure: "PA",
  pa: "PA",
  heartRate: "FC",
  fc: "FC",
  respiratoryRate: "FR",
  fr: "FR",
  oxygenSaturation: "SpO2",
  spo2: "SpO2",
  saturacao: "SpO2",
  temperature: "Temp",
  temperatura: "Temp",
  glucose: "Glicemia",
  glicemia: "Glicemia",
  finding: "Achado",
  achado: "Achado",
  exam: "Exame",
  exame: "Exame",
};

function labeledRecord(
  value: Record<string, unknown>,
  depth: number,
): string | null {
  const skip = new Set(["priority", "id", "type", "index"]);
  const parts: string[] = [];
  for (const [key, nested] of Object.entries(value)) {
    if (skip.has(key)) continue;
    const text = asProse(nested, depth + 1);
    if (!text) continue;
    const fieldLabel = FIELD_LABELS[key];
    parts.push(fieldLabel ? `${fieldLabel} ${text}` : text);
  }
  return parts.length > 0 ? parts.join("; ") : null;
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

function subjectiveFromState(state: ClinicalState): string | null {
  const hpi = state.historyPresentIllness;
  const parts = [
    state.chiefComplaint ? `Queixa: ${state.chiefComplaint}.` : null,
    hpi.onset ? `Início: ${hpi.onset}.` : null,
    hpi.duration ? `Duração: ${hpi.duration}.` : null,
    hpi.location ? `Local: ${hpi.location}.` : null,
    hpi.character ? `Caráter: ${hpi.character}.` : null,
    hpi.radiation ? `Irradiação: ${hpi.radiation}.` : null,
    hpi.intensity ? `Intensidade: ${hpi.intensity}.` : null,
    hpi.associatedSymptoms.length > 0
      ? `Sintomas associados: ${hpi.associatedSymptoms.join("; ")}.`
      : null,
    state.reportedFacts.length > 0 ? state.reportedFacts.join(" ") : null,
  ].filter((item): item is string => Boolean(item));
  return parts.length > 0 ? parts.join(" ") : null;
}

function objectiveFromState(state: ClinicalState): string | null {
  const v = state.vitalSigns;
  const vitals = [
    v.bloodPressure ? `PA ${v.bloodPressure}` : null,
    v.heartRate != null ? `FC ${v.heartRate} bpm` : null,
    v.respiratoryRate != null ? `FR ${v.respiratoryRate} irpm` : null,
    v.oxygenSaturation != null ? `SpO2 ${v.oxygenSaturation}%` : null,
    v.temperature != null ? `Temp ${v.temperature} °C` : null,
    v.glucose != null ? `Glicemia ${v.glucose} mg/dL` : null,
  ].filter((item): item is string => Boolean(item));
  const parts = [
    vitals.length > 0 ? `Sinais vitais: ${vitals.join("; ")}.` : null,
    state.physicalExam.length > 0
      ? `Exame físico: ${state.physicalExam.join("; ")}.`
      : null,
    state.observedFindings.length > 0
      ? `Achados observados: ${state.observedFindings.join("; ")}.`
      : null,
    state.positiveFindings.length > 0
      ? `Achados positivos: ${state.positiveFindings.join("; ")}.`
      : null,
    state.negativeFindings.length > 0
      ? `Achados negativos: ${state.negativeFindings.join("; ")}.`
      : null,
  ].filter((item): item is string => Boolean(item));
  return parts.length > 0 ? parts.join("\n") : null;
}

function planFromState(state: ClinicalState): string | null {
  const tests = state.suggestedTests.map((item) =>
    item.rationale ? `considerar ${item.item} (${item.rationale})` : `considerar ${item.item}`,
  );
  const treatments = state.possibleTreatments.map((item) =>
    item.rationale ? `avaliar ${item.item} (${item.rationale})` : `avaliar ${item.item}`,
  );
  const parts = [...tests, ...treatments];
  return parts.length > 0 ? parts.join(". ") + "." : null;
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
    .map((item) => asProse(item) ?? asNullableString(item))
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

function questionPriority(
  value: unknown,
): "critical" | "high_value" | "routine" {
  const text = String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  if (text.includes("crit") || text.includes("imediat")) return "critical";
  if (text.includes("routin") || text.includes("rotina")) return "routine";
  return "high_value";
}

function asQuestion(
  value: unknown,
): { text: string; priority: "critical" | "high_value" | "routine" } | null {
  if (typeof value === "string" && value.trim()) {
    return { text: value.trim(), priority: "high_value" };
  }
  if (!isRecord(value)) return null;
  const text = asNullableString(
    value.text ?? value.question ?? value.pergunta ?? value.item,
  );
  if (!text) return null;
  return { text, priority: questionPriority(value.priority) };
}

function asTestResult(
  value: unknown,
): { name: string; result: string } | null {
  if (typeof value === "string" && value.trim()) {
    return { name: value.trim(), result: "informado" };
  }
  if (!isRecord(value)) return null;
  const name = asNullableString(value.name ?? value.exame ?? value.test ?? value.item);
  const result = asNullableString(value.result ?? value.resultado ?? value.value);
  if (!name || !result) return null;
  return { name, result };
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
  const questionsSource = Array.isArray(obj.suggestedQuestions)
    ? obj.suggestedQuestions
    : Array.isArray(obj.perguntas)
      ? obj.perguntas
      : Array.isArray(obj.questions)
        ? obj.questions
        : [];
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
      glasgow: asNumber(vitals.glasgow),
      glucose: asNumber(vitals.glucose),
    },
    physicalExam: asStringArray(obj.physicalExam),
    positiveFindings: asStringArray(obj.positiveFindings),
    negativeFindings: asStringArray(obj.negativeFindings),
    reportedFacts: asStringArray(obj.reportedFacts),
    observedFindings: asStringArray(obj.observedFindings),
    inferences: asStringArray(obj.inferences),
    testResults: (Array.isArray(obj.testResults) ? obj.testResults : [])
      .map(asTestResult)
      .filter((item): item is { name: string; result: string } => Boolean(item))
      .slice(0, 8),
    hypotheses: hypothesesSource
      .map(asHypothesis)
      .filter((item): item is ClinicalHypothesis => Boolean(item))
      .slice(0, 5),
    dangerousDifferentials: (
      Array.isArray(obj.dangerousDifferentials) ? obj.dangerousDifferentials : []
    )
      .map(asHypothesis)
      .filter((item): item is ClinicalHypothesis => Boolean(item))
      .slice(0, 3),
    missingInformation: asStringArray(obj.missingInformation, 8),
    suggestedQuestions: questionsSource
      .map(asQuestion)
      .filter(
        (
          item,
        ): item is { text: string; priority: "critical" | "high_value" | "routine" } =>
          Boolean(item),
      )
      .slice(0, 5),
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
    systemSafetyTriggers: [],
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
        subjectiveFromState(stateLike) ??
        "Não informado.",
      objective:
        soapField(soap, obj, [
          "objective",
          "objetivo",
          "O",
          "vitalSigns",
          "sinaisVitais",
          "physicalExam",
          "exameFisico",
          "observedFindings",
        ]) ??
        objectiveFromState(stateLike) ??
        "Não informado.",
      assessment:
        soapField(soap, obj, ["assessment", "avaliacao", "avaliação", "A"]) ??
        assessmentFromHypotheses(stateLike.hypotheses) ??
        "Não informado.",
      plan:
        soapField(soap, obj, ["plan", "plano", "P"]) ??
        planFromState(stateLike) ??
        "Não informado.",
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
