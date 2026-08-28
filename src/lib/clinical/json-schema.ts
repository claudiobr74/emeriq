const nullableString = { type: ["string", "null"] as const };
const nullableNumber = { type: ["number", "null"] as const };
const stringArray = { type: "array" as const, items: { type: "string" as const } };

const hypothesisSchema = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    diagnosis: { type: "string" },
    priority: { type: "string", enum: ["high", "medium", "low"] },
    supportingFindings: stringArray,
    opposingFindings: stringArray,
    rationale: nullableString,
  },
  required: [
    "diagnosis",
    "priority",
    "supportingFindings",
    "opposingFindings",
    "rationale",
  ],
};

const suggestionSchema = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    item: { type: "string" },
    rationale: { type: "string" },
    priority: {
      type: ["string", "null"],
      enum: ["immediate", "urgent", "routine", null],
    },
  },
  required: ["item", "rationale", "priority"],
};

const alertSchema = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    severity: { type: "string", enum: ["critical", "warning", "info"] },
    title: { type: "string" },
    message: { type: "string" },
  },
  required: ["severity", "title", "message"],
};

export const clinicalStateJsonSchema = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    patient: {
      type: "object",
      additionalProperties: false,
      properties: {
        age: nullableNumber,
        sex: nullableString,
      },
      required: ["age", "sex"],
    },
    chiefComplaint: nullableString,
    historyPresentIllness: {
      type: "object",
      additionalProperties: false,
      properties: {
        onset: nullableString,
        duration: nullableString,
        location: nullableString,
        character: nullableString,
        radiation: nullableString,
        intensity: nullableString,
        aggravatingFactors: stringArray,
        relievingFactors: stringArray,
        associatedSymptoms: stringArray,
      },
      required: [
        "onset",
        "duration",
        "location",
        "character",
        "radiation",
        "intensity",
        "aggravatingFactors",
        "relievingFactors",
        "associatedSymptoms",
      ],
    },
    pastMedicalHistory: stringArray,
    medications: stringArray,
    allergies: stringArray,
    riskFactors: stringArray,
    vitalSigns: {
      type: "object",
      additionalProperties: false,
      properties: {
        bloodPressure: nullableString,
        heartRate: nullableNumber,
        respiratoryRate: nullableNumber,
        oxygenSaturation: nullableNumber,
        temperature: nullableNumber,
        glucose: nullableNumber,
      },
      required: [
        "bloodPressure",
        "heartRate",
        "respiratoryRate",
        "oxygenSaturation",
        "temperature",
        "glucose",
      ],
    },
    physicalExam: stringArray,
    positiveFindings: stringArray,
    negativeFindings: stringArray,
    reportedFacts: stringArray,
    observedFindings: stringArray,
    inferences: stringArray,
    hypotheses: { type: "array", items: hypothesisSchema, maxItems: 6 },
    dangerousDifferentials: {
      type: "array",
      items: hypothesisSchema,
      maxItems: 5,
    },
    missingInformation: { type: "array", items: { type: "string" }, maxItems: 8 },
    suggestedQuestions: { type: "array", items: { type: "string" }, maxItems: 5 },
    suggestedTests: { type: "array", items: suggestionSchema, maxItems: 6 },
    possibleTreatments: { type: "array", items: suggestionSchema, maxItems: 6 },
    alerts: { type: "array", items: alertSchema, maxItems: 5 },
  },
  required: [
    "patient",
    "chiefComplaint",
    "historyPresentIllness",
    "pastMedicalHistory",
    "medications",
    "allergies",
    "riskFactors",
    "vitalSigns",
    "physicalExam",
    "positiveFindings",
    "negativeFindings",
    "reportedFacts",
    "observedFindings",
    "inferences",
    "hypotheses",
    "dangerousDifferentials",
    "missingInformation",
    "suggestedQuestions",
    "suggestedTests",
    "possibleTreatments",
    "alerts",
  ],
};

export const finalReportJsonSchema = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    soap: {
      type: "object",
      additionalProperties: false,
      properties: {
        subjective: { type: "string" },
        objective: { type: "string" },
        assessment: { type: "string" },
        plan: { type: "string" },
      },
      required: ["subjective", "objective", "assessment", "plan"],
    },
    hypotheses: { type: "array", items: hypothesisSchema, maxItems: 6 },
    dangerousDifferentials: {
      type: "array",
      items: hypothesisSchema,
      maxItems: 5,
    },
    suggestedTests: { type: "array", items: suggestionSchema, maxItems: 6 },
    possibleTreatments: { type: "array", items: suggestionSchema, maxItems: 6 },
    unresolvedQuestions: {
      type: "array",
      items: { type: "string" },
      maxItems: 10,
    },
    alerts: { type: "array", items: alertSchema, maxItems: 5 },
  },
  required: [
    "soap",
    "hypotheses",
    "dangerousDifferentials",
    "suggestedTests",
    "possibleTreatments",
    "unresolvedQuestions",
    "alerts",
  ],
};
