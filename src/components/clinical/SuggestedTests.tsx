"use client";

import type { ClinicalSuggestion } from "@/types/clinical";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SuggestedTestsProps {
  tests: ClinicalSuggestion[];
}

export function SuggestedTests({ tests }: SuggestedTestsProps) {
  if (tests.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exames a considerar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tests.map((test) => (
          <div key={test.item}>
            <p className="text-sm font-medium text-slate-900">{test.item}</p>
            <p className="text-sm leading-6 text-slate-600">{test.rationale}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
