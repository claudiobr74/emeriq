"use client";

import type { SuggestedQuestion } from "@/types/clinical";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SuggestedQuestionsProps {
  questions: SuggestedQuestion[];
  missingChecks?: string[];
}

function sortQuestions(questions: SuggestedQuestion[]): SuggestedQuestion[] {
  const rank = { critical: 0, high_value: 1, routine: 2 };
  return [...questions].sort((a, b) => rank[a.priority] - rank[b.priority]);
}

export function SuggestedQuestions({
  questions,
  missingChecks = [],
}: SuggestedQuestionsProps) {
  const items = [
    ...sortQuestions(questions).map((item) => item.text),
    ...missingChecks,
  ].slice(0, 3);

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pergunte / verifique</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((question) => (
            <li
              key={question}
              className="rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-800"
            >
              {question}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
