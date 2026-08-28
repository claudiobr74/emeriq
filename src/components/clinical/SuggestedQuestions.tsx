"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SuggestedQuestionsProps {
  questions: string[];
}

export function SuggestedQuestions({ questions }: SuggestedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perguntar</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {questions.slice(0, 5).map((question) => (
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
