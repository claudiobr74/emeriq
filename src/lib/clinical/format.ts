import type { FinalClinicalReport, SoapNote } from "@/lib/clinical/schemas";

export function formatSoap(soap: SoapNote): string {
  return [
    "S — Subjetivo",
    soap.subjective.trim() || "Não informado.",
    "",
    "O — Objetivo",
    soap.objective.trim() || "Não informado.",
    "",
    "A — Avaliação",
    soap.assessment.trim() || "Não informado.",
    "",
    "P — Plano",
    soap.plan.trim() || "Não informado.",
  ].join("\n");
}

function list(title: string, items: string[]): string {
  if (items.length === 0) return `${title}\nNenhum item.`;
  return `${title}\n${items.map((item) => `- ${item}`).join("\n")}`;
}

export function formatFullReport(report: FinalClinicalReport): string {
  return [
    "RESUMO DO ATENDIMENTO — EmerIQ",
    "",
    formatSoap(report.soap),
    "",
    list(
      "Hipóteses diagnósticas",
      report.hypotheses.map(
        (item) =>
          `${item.diagnosis} (${priorityLabel(item.priority)})${item.rationale ? ` — ${item.rationale}` : ""}`,
      ),
    ),
    "",
    list(
      "Diagnósticos graves a excluir",
      report.dangerousDifferentials.map(
        (item) =>
          `${item.diagnosis}${item.rationale ? ` — ${item.rationale}` : ""}`,
      ),
    ),
    "",
    list(
      "Exames a considerar",
      report.suggestedTests.map((item) => `${item.item} — ${item.rationale}`),
    ),
    "",
    list(
      "Condutas possíveis",
      report.possibleTreatments.map((item) => `${item.item} — ${item.rationale}`),
    ),
    "",
    list("Informações ainda não esclarecidas", report.unresolvedQuestions),
    "",
    list(
      "Alertas",
      report.alerts.map((item) => `${item.title}: ${item.message}`),
    ),
    "",
    "Ferramenta de apoio ao profissional médico. As sugestões devem ser avaliadas no contexto clínico.",
  ].join("\n");
}

export function priorityLabel(priority: "high" | "medium" | "low"): string {
  if (priority === "high") return "prioritária";
  if (priority === "medium") return "possível";
  return "menos provável";
}

export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
