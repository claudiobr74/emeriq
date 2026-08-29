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
    testResults: [],
    hypotheses: [],
    dangerousDifferentials: [],
    missingInformation: [],
    suggestedQuestions: [],
    suggestedTests: [],
    possibleTreatments: [],
    alerts: [],
    systemSafetyTriggers: [],
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

export function compactClinicalState(state: ClinicalState): Record<string, unknown> {
  return {
    patient: state.patient,
    chiefComplaint: state.chiefComplaint,
    historyPresentIllness: state.historyPresentIllness,
    pastMedicalHistory: state.pastMedicalHistory,
    medications: state.medications,
    allergies: state.allergies,
    riskFactors: state.riskFactors,
    vitalSigns: state.vitalSigns,
    physicalExam: state.physicalExam,
    positiveFindings: state.positiveFindings,
    negativeFindings: state.negativeFindings,
    reportedFacts: state.reportedFacts,
    observedFindings: state.observedFindings,
    inferences: state.inferences,
    testResults: state.testResults,
    hypotheses: state.hypotheses,
    dangerousDifferentials: state.dangerousDifferentials,
    missingInformation: state.missingInformation,
    suggestedQuestions: state.suggestedQuestions,
    suggestedTests: state.suggestedTests,
    possibleTreatments: state.possibleTreatments,
    alerts: state.alerts,
  };
}
