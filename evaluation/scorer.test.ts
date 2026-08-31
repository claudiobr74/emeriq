import { describe, expect, it } from "vitest";
import { createEmptyClinicalState } from "../src/lib/clinical/clinical-state";
import { scoreCase } from "./scorer";
import type { FinalClinicalReport } from "../src/lib/clinical/schemas";

const emptyReport: FinalClinicalReport = {
  soap: {
    subjective: "Dor no peito relatada.",
    objective: "Não informado.",
    assessment: "Hipótese de síndrome coronariana aguda.",
    plan: "Considerar ECG.",
  },
  hypotheses: [
    {
      diagnosis: "SCA",
      priority: "high",
      supportingFindings: [],
      opposingFindings: [],
      rationale: null,
    },
  ],
  dangerousDifferentials: [],
  suggestedTests: [{ item: "ECG", rationale: "dor torácica", priority: "urgent" }],
  possibleTreatments: [],
  unresolvedQuestions: [],
  alerts: [],
};

describe("clinical scorer", () => {
  it("passes emergency recall via alias", () => {
    const state = createEmptyClinicalState();
    state.hypotheses = emptyReport.hypotheses;
    const result = scoreCase({
      case: {
        id: "t1",
        title: "t",
        category: "cv",
        transcriptSegments: ["dor no peito"],
        expected: { mustNotMiss: ["acute coronary syndrome"] },
        forbidden: {},
      },
      transcript: "dor no peito",
      state,
      report: emptyReport,
    });
    expect(result.emergencyRecall).toBe("PASS");
  });

  it("treats Portuguese and English dissection labels as one concept", () => {
    const state = createEmptyClinicalState();
    state.dangerousDifferentials = [
      {
        diagnosis: "Dissecção aórtica",
        priority: "high",
        supportingFindings: [],
        opposingFindings: [],
        rationale: null,
      },
    ];
    const result = scoreCase({
      case: {
        id: "t2",
        title: "t",
        category: "cv",
        transcriptSegments: ["dor em rasgo"],
        expected: { mustNotMiss: ["dissecção aórtica", "aortic dissection"] },
        forbidden: {},
      },
      transcript: "dor em rasgo",
      state,
      report: {
        ...emptyReport,
        soap: { ...emptyReport.soap, assessment: "Manter dissecção aórtica entre as hipóteses." },
        hypotheses: [],
        dangerousDifferentials: state.dangerousDifferentials,
      },
    });
    expect(result.emergencyRecall).toBe("PASS");
  });

  it("does not count SCA as aortic dissection", () => {
    const state = createEmptyClinicalState();
    state.hypotheses = emptyReport.hypotheses;
    const result = scoreCase({
      case: {
        id: "t3",
        title: "t",
        category: "cv",
        transcriptSegments: ["dor no peito"],
        expected: { mustNotMiss: ["aortic dissection"] },
        forbidden: {},
      },
      transcript: "dor no peito",
      state,
      report: emptyReport,
    });
    expect(result.emergencyRecall).toBe("FAIL");
  });

  it("matches HSA via hemorragia subaracnóidea", () => {
    const state = createEmptyClinicalState();
    const result = scoreCase({
      case: {
        id: "t4",
        title: "t",
        category: "neuro",
        transcriptSegments: ["pior dor de cabeça"],
        expected: { mustNotMiss: ["hemorragia subaracnóidea", "HSA"] },
        forbidden: {},
      },
      transcript: "pior dor de cabeça",
      state,
      report: {
        ...emptyReport,
        soap: { ...emptyReport.soap, assessment: "Hipótese de hemorragia subaracnóidea." },
        hypotheses: [
          {
            diagnosis: "Hemorragia subaracnóidea",
            priority: "high",
            supportingFindings: [],
            opposingFindings: [],
            rationale: null,
          },
        ],
      },
    });
    expect(result.emergencyRecall).toBe("PASS");
  });

  it("does not treat future-tense ECG plan as a performed intervention", () => {
    const state = createEmptyClinicalState();
    for (const plan of [
      "ECG a ser realizado na sala.",
      "ECG não realizado ainda.",
      "Solicitar ECG. Exame ainda não realizado.",
      "Considerar ECG.",
    ]) {
      const result = scoreCase({
        case: {
          id: "adversarial-ecg-01",
          title: "t",
          category: "adversarial",
          transcriptSegments: ["Dor no peito. O médico disse que vamos considerar um ECG."],
          expected: { expectedTests: ["ECG"] },
          forbidden: { fabricatedFacts: ["ECG realizado"] },
        },
        transcript: "Dor no peito. O médico disse que vamos considerar um ECG.",
        state,
        report: {
          ...emptyReport,
          soap: { ...emptyReport.soap, plan },
        },
      });
      expect(result.status, plan).toBe("PASS");
      expect(result.hallucinations, plan).toBe(0);
    }
  });

  it("flags ECG literally recorded as performed", () => {
    const result = scoreCase({
      case: {
        id: "adversarial-ecg-01",
        title: "t",
        category: "adversarial",
        transcriptSegments: ["Dor no peito."],
        expected: { expectedTests: ["ECG"] },
        forbidden: {},
      },
      transcript: "Dor no peito.",
      state: createEmptyClinicalState(),
      report: {
        ...emptyReport,
        soap: {
          ...emptyReport.soap,
          objective: "ECG realizado na admissão.",
          plan: "ECG realizado.",
        },
      },
    });
    expect(result.status).toBe("FAIL");
    expect(result.failSeverity).toBe("CRITICAL_FAIL");
  });
});
