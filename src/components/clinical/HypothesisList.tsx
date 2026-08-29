"use client";

import { priorityLabel } from "@/lib/clinical/format";
import type { ClinicalHypothesis } from "@/types/clinical";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HypothesisListProps {
  hypotheses: ClinicalHypothesis[];
  dangerousDifferentials: ClinicalHypothesis[];
}

export function HypothesisList({
  hypotheses,
  dangerousDifferentials,
}: HypothesisListProps) {
  if (hypotheses.length === 0 && dangerousDifferentials.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {hypotheses.length > 0 ? (
        <div className="space-y-2">
          {hypotheses.slice(0, 5).map((item) => (
            <HypothesisItem key={item.diagnosis} item={item} />
          ))}
        </div>
      ) : null}

      {dangerousDifferentials.length > 0 ? (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-800">
            Grave a excluir
          </p>
          {dangerousDifferentials.slice(0, 3).map((item) => (
            <HypothesisItem key={`d-${item.diagnosis}`} item={item} dangerous />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function HypothesisItem({
  item,
  dangerous = false,
}: {
  item: ClinicalHypothesis;
  dangerous?: boolean;
}) {
  return (
    <div
      className={
        dangerous
          ? "rounded-lg border border-red-100 bg-red-50/60 p-3"
          : "rounded-lg border border-slate-100 p-3"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-slate-900">{item.diagnosis}</p>
        <Badge className="border-slate-200 bg-slate-50 text-slate-700">
          {dangerous ? "grave a excluir" : priorityLabel(item.priority)}
        </Badge>
      </div>
      {item.rationale ? (
        <p className="mt-1 text-sm leading-6 text-slate-600">{item.rationale}</p>
      ) : null}
    </div>
  );
}

export function EvaluationSections({
  hypotheses,
  dangerousDifferentials,
  tests,
  treatments,
}: {
  hypotheses: ClinicalHypothesis[];
  dangerousDifferentials: ClinicalHypothesis[];
  tests: { item: string; rationale: string }[];
  treatments: { item: string; rationale: string }[];
}) {
  const hasAny =
    hypotheses.length +
      dangerousDifferentials.length +
      tests.length +
      treatments.length >
    0;
  if (!hasAny) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avaliação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <details className="rounded-lg border border-slate-100 p-3" open>
          <summary className="cursor-pointer text-sm font-medium text-slate-800">
            Hipóteses
          </summary>
          <div className="mt-3">
            <HypothesisList
              hypotheses={hypotheses}
              dangerousDifferentials={dangerousDifferentials}
            />
          </div>
        </details>
        {tests.length > 0 ? (
          <details className="rounded-lg border border-slate-100 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-800">
              Exames a considerar
            </summary>
            <ul className="mt-3 space-y-2">
              {tests.map((test) => (
                <li key={test.item} className="text-sm leading-6 text-slate-700">
                  <span className="font-medium">{test.item}</span>
                  {test.rationale ? ` — ${test.rationale}` : ""}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        {treatments.length > 0 ? (
          <details className="rounded-lg border border-slate-100 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-800">
              Tratamentos possíveis
            </summary>
            <ul className="mt-3 space-y-2">
              {treatments.map((item) => (
                <li key={item.item} className="text-sm leading-6 text-slate-700">
                  <span className="font-medium">{item.item}</span>
                  {item.rationale ? ` — ${item.rationale}` : ""}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
