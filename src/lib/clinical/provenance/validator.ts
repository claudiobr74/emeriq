import { foldPt, includesFolded } from "@/lib/clinical/text";
import type { ClinicalState, FinalClinicalReport } from "@/lib/clinical/schemas";

export type ProvenanceFlagCode =
  | "vital_not_in_source"
  | "exam_not_in_source"
  | "medication_not_in_source"
  | "diagnosis_as_confirmed"
  | "intervention_as_performed";

export interface ProvenanceFlag {
  code: ProvenanceFlagCode;
  detail: string;
}

const PERFORMED_PATTERNS = [
  /\becg\s+realizado\b/gi,
  /\beletrocardiograma\s+realizado\b/gi,
  /\btrombolise\s+realizada\b/gi,
  /\bintubad[oa]\b/gi,
  /\badrenalina\s+administrada\b/gi,
];

const CONFIRMED_DX = [
  /\bdiagnostico\s+confirmado\b/gi,
  /\bpaciente\s+com\s+diagnostico\s+de\b/gi,
  /\bconfirmado\s+infarto\b/gi,
  /\bdiagnosticad[oa]\s+com\b/gi,
];

function sourceBlob(transcript: string, state: ClinicalState): string {
  return [
    transcript,
    state.chiefComplaint ?? "",
    ...state.reportedFacts,
    ...state.observedFindings,
    ...state.physicalExam,
    ...state.positiveFindings,
    ...state.testResults.map((item) => `${item.name} ${item.result}`),
    state.vitalSigns.bloodPressure ?? "",
    state.vitalSigns.heartRate != null ? String(state.vitalSigns.heartRate) : "",
    state.vitalSigns.oxygenSaturation != null
      ? String(state.vitalSigns.oxygenSaturation)
      : "",
    ...state.medications,
  ].join(" ");
}

function replaceAll(text: string, regex: RegExp, replacement: string): string {
  return text.replace(regex, replacement);
}

export function validateAndSanitizeSoap(
  report: FinalClinicalReport,
  input: { transcript: string; state: ClinicalState },
): { report: FinalClinicalReport; flags: ProvenanceFlag[] } {
  const flags: ProvenanceFlag[] = [];
  const source = sourceBlob(input.transcript, input.state);
  let objective = report.soap.objective;
  let assessment = report.soap.assessment;
  let plan = report.soap.plan;
  let subjective = report.soap.subjective;

  const spo2InSoap = objective.match(/spo2|satura[cç][aã]o/i);
  const spo2Value = objective.match(/(\d{2,3})\s*%/);
  if (spo2InSoap && spo2Value && !includesFolded(source, spo2Value[1] ?? "")) {
    flags.push({
      code: "vital_not_in_source",
      detail: `SpO2 ${spo2Value[1]} não aparece na transcrição nem no estado.`,
    });
    objective = objective.replace(/\b(?:spo2|satura[cç][aã]o)[^\n.]*\.?/gi, "Saturação não informada. ");
  }

  const bpInSoap = /pa\s*\d{2,3}/i.test(objective) || /\d{2,3}\s*(?:x|\/)\s*\d{2,3}/.test(objective);
  const bpInSource =
    /\d{2,3}\s*(?:x|\/|por)\s*\d{2,3}/i.test(source) || Boolean(input.state.vitalSigns.bloodPressure);
  if (bpInSoap && !bpInSource) {
    flags.push({
      code: "vital_not_in_source",
      detail: "Pressão arterial no Objetivo sem suporte na fonte.",
    });
    objective = objective.replace(/\bpa[^\n.]*\.?/gi, "Pressão arterial não informada. ");
  }

  for (const pattern of PERFORMED_PATTERNS) {
    if (pattern.test(objective) || pattern.test(plan) || pattern.test(assessment)) {
      flags.push({
        code: "intervention_as_performed",
        detail: "Intervenção descrita como realizada.",
      });
      objective = replaceAll(objective, pattern, "exame/conduta a considerar");
      plan = replaceAll(plan, pattern, "considerar a conduta (não registrada como realizada)");
      assessment = replaceAll(assessment, pattern, "conduta apenas considerada");
    }
  }

  for (const pattern of CONFIRMED_DX) {
    if (pattern.test(subjective) || pattern.test(objective) || pattern.test(assessment)) {
      flags.push({
        code: "diagnosis_as_confirmed",
        detail: "Diagnóstico escrito como confirmado.",
      });
      subjective = replaceAll(subjective, pattern, "hipótese em avaliação");
      objective = replaceAll(objective, pattern, "hipótese em avaliação");
      assessment = replaceAll(
        assessment,
        pattern,
        "permanece como hipótese, não como diagnóstico confirmado",
      );
    }
  }

  const leakedDx = [
    "sindrome coronariana aguda",
    "infarto",
    "disseccao aortica",
    "tep",
  ];
  for (const dx of leakedDx) {
    if (includesFolded(subjective, dx) || includesFolded(objective, dx)) {
      flags.push({
        code: "diagnosis_as_confirmed",
        detail: `Hipótese "${dx}" vazou para S ou O.`,
      });
    }
  }

  return {
    flags,
    report: {
      ...report,
      soap: {
        subjective,
        objective,
        assessment,
        plan,
      },
    },
  };
}

export function soapLooksObjectiveOnly(text: string): boolean {
  const folded = foldPt(text);
  return !folded.includes("considerar sindrome") && !folded.includes("hipotese de");
}
