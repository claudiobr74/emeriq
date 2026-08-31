import { createHash } from "node:crypto";
import type { ComplexVignetteCase } from "./types";

export function canonicalComplexPayload(cases: ComplexVignetteCase[]): string {
  const ordered = [...cases].sort((a, b) => a.id.localeCompare(b.id));
  const slim = ordered.map((item) => ({
    id: item.id,
    title: item.title,
    domain: item.domain,
    subcategory: item.subcategory,
    difficulty: item.difficulty,
    criticality: item.criticality,
    complexityScore: item.complexityScore,
    segments: item.segments,
    medications: item.medications,
    comorbidities: item.comorbidities,
    distractors: item.distractors,
    lateReveals: item.lateReveals,
    corrections: item.corrections,
    mustConsider: item.mustConsider,
    mustNotMiss: item.mustNotMiss,
    shouldAsk: item.shouldAsk,
    shouldTest: item.shouldTest,
    shouldTreatConceptually: item.shouldTreatConceptually,
    mustNotDo: item.mustNotDo,
    expectedDispositionConcept: item.expectedDispositionConcept,
    clinicallyPlausibleAlternatives: item.clinicallyPlausibleAlternatives,
    forbiddenFabrications: item.forbiddenFabrications,
    decisionPoints: item.decisionPoints,
    flags: item.flags,
    vitalsTimeline: item.vitalsTimeline,
    labs: item.labs,
    imaging: item.imaging,
  }));
  return JSON.stringify(slim);
}

export function hashComplexCases(cases: ComplexVignetteCase[]): string {
  return createHash("sha256").update(canonicalComplexPayload(cases)).digest("hex");
}
