"use client";

import { HelpCircle } from "lucide-react";
import type { SuggestedQuestion } from "@/types/clinical";

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
  ].slice(0, 4);

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <HelpCircle className="h-[18px] w-[18px] text-warning" aria-hidden />
        <h3 className="text-sm font-bold text-heading">Pergunte / Verifique</h3>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((question) => (
          <li
            key={question}
            className="flex items-center gap-2.5 rounded-md bg-warning-bg p-2.5"
          >
            <span
              className="h-4 w-1 shrink-0 rounded-sm bg-warning"
              aria-hidden
            />
            <span className="text-[13px] font-medium leading-5 text-text">
              {question}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
