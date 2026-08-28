"use client";

import type { ClinicalSuggestion } from "@/types/clinical";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PossibleTreatmentsProps {
  treatments: ClinicalSuggestion[];
}

export function PossibleTreatments({ treatments }: PossibleTreatmentsProps) {
  if (treatments.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tratamentos possíveis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {treatments.map((item) => (
          <div key={item.item}>
            <p className="text-sm font-medium text-slate-900">{item.item}</p>
            <p className="text-sm leading-6 text-slate-600">{item.rationale}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
