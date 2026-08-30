"use client";

import { useState } from "react";
import { Copy, FileText, Plus } from "lucide-react";
import {
  copyText,
  formatFullReport,
  formatSoap,
} from "@/lib/clinical/format";
import type { ClinicalHypothesis, FinalClinicalReport } from "@/types/clinical";
import { Button } from "@/components/ui/button";
import { StatusBadge, hypothesisVariant } from "@/components/ui/status-badge";
import { ClinicalAlerts } from "@/components/clinical/ClinicalAlerts";

interface SoapSummaryProps {
  report: FinalClinicalReport;
  warning?: string | null;
  onNewConsultation: () => void;
}

const SOAP_SECTIONS = [
  { letter: "S", title: "Subjetivo", key: "subjective" },
  { letter: "O", title: "Objetivo", key: "objective" },
  { letter: "A", title: "Avaliação", key: "assessment" },
  { letter: "P", title: "Plano", key: "plan" },
] as const;

export function SoapSummary({
  report,
  warning,
  onNewConsultation,
}: SoapSummaryProps) {
  const [copied, setCopied] = useState<"soap" | "full" | null>(null);

  async function handleCopy(kind: "soap" | "full") {
    const text =
      kind === "soap" ? formatSoap(report.soap) : formatFullReport(report);
    if (await copyText(text)) {
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8">
      {warning ? (
        <p
          role="status"
          className="rounded-lg border border-warning/40 bg-warning-bg px-4 py-3 text-[13px] leading-5 text-text-body"
        >
          {warning}
        </p>
      ) : null}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-heading">
            Resumo do Atendimento (SOAP)
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Estrutura clínica gerada de forma automatizada por inteligência
            artificial a partir da escuta contínua.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => void handleCopy("soap")}>
            <Copy className="h-4 w-4" />
            {copied === "soap" ? "SOAP copiado" : "Copiar SOAP"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void handleCopy("full")}>
            <FileText className="h-4 w-4" />
            {copied === "full" ? "Resumo copiado" : "Copiar resumo completo"}
          </Button>
          <Button size="sm" onClick={onNewConsultation}>
            <Plus className="h-4 w-4" />
            Novo atendimento
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4" data-testid="soap-card">
        {SOAP_SECTIONS.map((section) => (
          <div
            key={section.key}
            className="flex gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {section.letter}
            </span>
            <div>
              <h2 className="text-base font-bold text-heading">{section.title}</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-text-body">
                {report.soap[section.key].trim() || "Não informado."}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <HypothesesColumn
          hypotheses={report.hypotheses}
          dangerous={report.dangerousDifferentials}
        />
        <SuggestionColumn
          title="Condutas Possíveis"
          items={report.possibleTreatments}
        />
      </div>

      {report.suggestedTests.length > 0 ? (
        <SuggestionColumn title="Exames a Considerar" items={report.suggestedTests} />
      ) : null}

      {report.unresolvedQuestions.length > 0 ? (
        <TextColumn
          title="Informações ainda não esclarecidas"
          items={report.unresolvedQuestions}
        />
      ) : null}

      <ClinicalAlerts alerts={report.alerts} />
    </div>
  );
}

function ColumnCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold text-heading">{title}</h2>
      <ul className="flex flex-col gap-1.5">{children}</ul>
    </section>
  );
}

function HypothesesColumn({
  hypotheses,
  dangerous,
}: {
  hypotheses: ClinicalHypothesis[];
  dangerous: ClinicalHypothesis[];
}) {
  if (hypotheses.length === 0 && dangerous.length === 0) return null;
  return (
    <ColumnCard title="Hipóteses Diagnósticas">
      {hypotheses.map((h) => (
        <li
          key={h.diagnosis}
          className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5"
        >
          <span className="text-sm text-text">{h.diagnosis}</span>
          <StatusBadge variant={hypothesisVariant(h.priority)} />
        </li>
      ))}
      {dangerous.map((h) => (
        <li
          key={`d-${h.diagnosis}`}
          className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5"
        >
          <span className="text-sm text-text">{h.diagnosis}</span>
          <StatusBadge variant="grave" />
        </li>
      ))}
    </ColumnCard>
  );
}

function SuggestionColumn({
  title,
  items,
}: {
  title: string;
  items: { item: string; rationale: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <ColumnCard title={title}>
      {items.map((item) => (
        <li
          key={item.item}
          className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5"
        >
          <span className="text-sm text-text" title={item.rationale}>
            {item.item}
          </span>
          <StatusBadge variant="sugestao" />
        </li>
      ))}
    </ColumnCard>
  );
}

function TextColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <ColumnCard title={title}>
      {items.map((item) => (
        <li key={item} className="px-2 text-sm leading-6 text-text-body">
          {item}
        </li>
      ))}
    </ColumnCard>
  );
}
