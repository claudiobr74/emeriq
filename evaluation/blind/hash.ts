import { createHash } from "node:crypto";
import type { BlindClinicalCase } from "./types";

export function canonicalCasePayload(cases: BlindClinicalCase[]): string {
  const ordered = [...cases].sort((a, b) => a.id.localeCompare(b.id));
  const slim = ordered.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    severity: item.severity,
    transcriptSegments: item.transcriptSegments,
    expected: item.expected,
    forbidden: item.forbidden,
  }));
  return JSON.stringify(slim);
}

export function hashBlindCases(cases: BlindClinicalCase[]): string {
  return createHash("sha256").update(canonicalCasePayload(cases)).digest("hex");
}
