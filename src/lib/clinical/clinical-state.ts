import type { ClinicalState } from "@/lib/clinical/schemas";

export function createEmptyClinicalState(): ClinicalState {
  return {
    patient: {
      age: null,
      sex: null,
    },
    chiefComplaint: null,
    historyPresentIllness: {
      onset: null,
      duration: null,
      location: null,
      character: null,
      radiation: null,
      intensity: null,
      aggravatingFactors: [],
      relievingFactors: [],
      associatedSymptoms: [],
    },
    pastMedicalHistory: [],
    medications: [],
    allergies: [],
    riskFactors: [],
    vitalSigns: {
      bloodPressure: null,
      heartRate: null,
      respiratoryRate: null,
      oxygenSaturation: null,
      temperature: null,
      glucose: null,
    },
    physicalExam: [],
    positiveFindings: [],
    negativeFindings: [],
    reportedFacts: [],
    observedFindings: [],
    inferences: [],
    hypotheses: [],
    dangerousDifferentials: [],
    missingInformation: [],
    suggestedQuestions: [],
    suggestedTests: [],
    possibleTreatments: [],
    alerts: [],
  };
}

export function hasLiveClinicalContent(state: ClinicalState): boolean {
  return (
    state.alerts.length > 0 ||
    state.suggestedQuestions.length > 0 ||
    state.hypotheses.length > 0 ||
    state.dangerousDifferentials.length > 0 ||
    state.suggestedTests.length > 0 ||
    state.possibleTreatments.length > 0
  );
}
