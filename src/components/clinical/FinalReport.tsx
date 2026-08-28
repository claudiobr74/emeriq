"use client";

import { useState } from "react";
import {
  copyText,
  formatFullReport,
  formatSoap,
  priorityLabel,
} from "@/lib/clinical/format";
import type { FinalClinicalReport } from "@/types/clinical";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClinicalAlerts } from "@/components/clinical/ClinicalAlerts";

interface FinalReportProps {
  report: FinalClinicalReport;
  onNewConsultation: () => void;
}

export function FinalReport({ report, onNewConsultation }: FinalReportProps) {
  const [copied, setCopied] = useState<"soap" | "full" | null>(null);

  async function handleCopy(kind: "soap" | "full") {
    const text =
      kind === "soap" ? formatSoap(report.soap) : formatFullReport(report);
    const ok = await copyText(text);
    if (ok) {
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Resumo do atendimento
          </h1>
          <p className="text-sm text-slate-500">
            Documento de apoio. Não substitui o registro médico oficial.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void handleCopy("soap")}>
            {copied === "soap" ? "SOAP copiado" : "Copiar SOAP"}
          </Button>
          <Button variant="secondary" onClick={() => void handleCopy("full")}>
            {copied === "full" ? "Resumo copiado" : "Copiar resumo completo"}
          </Button>
          <Button onClick={onNewConsultation}>Novo atendimento</Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <SoapCard letter="S" title="Subjetivo" body={report.soap.subjective} />
        <SoapCard letter="O" title="Objetivo" body={report.soap.objective} />
        <SoapCard letter="A" title="Avaliação" body={report.soap.assessment} />
        <SoapCard letter="P" title="Plano" body={report.soap.plan} />
      </section>

      <ReportList
        title="Hipóteses diagnósticas"
        items={report.hypotheses.map(
          (item) =>
            `${item.diagnosis} — ${priorityLabel(item.priority)}${item.rationale ? `. ${item.rationale}` : ""}`,
        )}
      />
      <ReportList
        title="Diagnósticos graves a excluir"
        items={report.dangerousDifferentials.map(
          (item) =>
            `${item.diagnosis}${item.rationale ? ` — ${item.rationale}` : ""}`,
        )}
      />
      <ReportList
        title="Exames a considerar"
        items={report.suggestedTests.map(
          (item) => `${item.item} — ${item.rationale}`,
        )}
      />
      <ReportList
        title="Condutas possíveis"
        items={report.possibleTreatments.map(
          (item) => `${item.item} — ${item.rationale}`,
        )}
      />
      <ReportList
        title="Informações ainda não esclarecidas"
        items={report.unresolvedQuestions}
      />
      <ClinicalAlerts alerts={report.alerts} />
    </div>
  );
}

function SoapCard({
  letter,
  title,
  body,
}: {
  letter: string;
  title: string;
  body: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="mr-2 font-mono text-teal-800">{letter}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
          {body.trim() || "Não informado."}
        </p>
      </CardContent>
    </Card>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item} className="text-sm leading-6 text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
