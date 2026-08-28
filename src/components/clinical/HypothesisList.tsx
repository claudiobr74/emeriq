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
    <Card>
      <CardHeader>
        <CardTitle>Hipóteses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hypotheses.slice(0, 5).map((item) => (
          <HypothesisItem key={item.diagnosis} item={item} />
        ))}

        {dangerousDifferentials.length > 0 ? (
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-800">
              Precisa ser excluída
            </p>
            {dangerousDifferentials.slice(0, 4).map((item) => (
              <HypothesisItem key={`d-${item.diagnosis}`} item={item} dangerous />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
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
          {priorityLabel(item.priority)}
        </Badge>
      </div>
      {item.rationale ? (
        <p className="mt-1 text-sm leading-6 text-slate-600">{item.rationale}</p>
      ) : null}
    </div>
  );
}
