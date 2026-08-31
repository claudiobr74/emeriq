import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { BLIND_V14_CASES } from "./v1.4";
import type { BlindRunReport } from "./runner";

const FIRST = path.join(process.cwd(), "evaluation/blind/results/FIRST_RUN.json");
const OUT = path.join(process.cwd(), "evaluation/blind/HUMAN_REVIEW_PACK.md");

function pick(severity: string, n: number, preferFail: boolean, used: Set<string>) {
  const pool = BLIND_V14_CASES.filter((item) => item.severity === severity && !used.has(item.id));
  const report: BlindRunReport | null = existsSync(FIRST)
    ? (JSON.parse(readFileSync(FIRST, "utf8")) as BlindRunReport)
    : null;
  const failIds = new Set(
    (report?.cases ?? []).filter((item) => item.status === "FAIL").map((item) => item.id.split("#")[0]),
  );
  const ordered = [...pool].sort((a, b) => {
    const af = failIds.has(a.id) ? 0 : 1;
    const bf = failIds.has(b.id) ? 0 : 1;
    return preferFail ? af - bf : a.id.localeCompare(b.id);
  });
  const chosen = ordered.slice(0, n);
  for (const item of chosen) used.add(item.id);
  return chosen;
}

const used = new Set<string>();
const selected = [
  ...pick("critical", 5, true, used),
  ...pick("atypical", 5, true, used),
  ...pick("benign", 5, true, used),
  ...pick("adversarial", 5, true, used),
];

const report: BlindRunReport | null = existsSync(FIRST)
  ? (JSON.parse(readFileSync(FIRST, "utf8")) as BlindRunReport)
  : null;

const blocks = selected.map((item) => {
  const scored = report?.cases.find((row) => row.id === item.id);
  return [
    `## ${item.id} — ${item.title}`,
    "",
    `Bucket: ${item.severity} · Categoria: ${item.category}`,
    "",
    "Transcript:",
    ...item.transcriptSegments.map((seg, i) => `${i + 1}. ${seg}`),
    "",
    "EmerIQ output (se FIRST_RUN existir):",
    scored
      ? [
          `- Status: ${scored.status} score ${scored.score}`,
          `- Hipóteses: ${scored.trace.hypotheses.map((h) => h.diagnosis).join("; ") || "—"}`,
          `- Diferenciais perigosos: ${scored.trace.dangerousDifferentials.map((h) => h.diagnosis).join("; ") || "—"}`,
          `- Perguntas: ${scored.trace.questions.map((q) => q.text).join("; ") || "—"}`,
          `- Exames: ${scored.trace.tests.map((t) => t.item).join("; ") || "—"}`,
          `- SOAP A: ${(scored.trace.soap.assessment || "").slice(0, 400)}`,
        ].join("\n")
      : "_FIRST_RUN ainda não disponível._",
    "",
    "1. Diagnóstico crítico omitido?  Sim / Não",
    "2. Algum fato inventado?  Sim / Não",
    "3. Perguntas relevantes?  1–5",
    "4. Exames pertinentes?  1–5",
    "5. Conduta potencialmente insegura?  Sim / Não",
    "6. Excesso de diagnósticos?  1–5",
    "7. Utilidade global?  1–5",
    "",
    "Comentários:",
    "",
    "---",
    "",
  ].join("\n");
});

writeFileSync(
  OUT,
  [
    "# Human review pack — blind v1.4",
    "",
    "Isto é **expert review** / clinical review de casos sintéticos. **Não** é validação clínica formal.",
    "",
    `Casos: ${selected.map((item) => item.id).join(", ")}`,
    "",
    ...blocks,
  ].join("\n"),
);
console.log(`Escrito ${OUT} (${selected.length} casos)`);
