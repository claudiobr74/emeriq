"use client";

import { hasLiveClinicalContent } from "@/lib/clinical/clinical-state";
import type { AppSettings, ClinicalState } from "@/types/clinical";
import { ClinicalAlerts } from "@/components/clinical/ClinicalAlerts";
import { HypothesisList } from "@/components/clinical/HypothesisList";
import { PossibleTreatments } from "@/components/clinical/PossibleTreatments";
import { SuggestedQuestions } from "@/components/clinical/SuggestedQuestions";
import { SuggestedTests } from "@/components/clinical/SuggestedTests";

interface ClinicalAssistantPanelProps {
  state: ClinicalState;
  settings: AppSettings;
  isUpdating?: boolean;
}

export function ClinicalAssistantPanel({
  state,
  settings,
  isUpdating = false,
}: ClinicalAssistantPanelProps) {
  const hasContent = hasLiveClinicalContent(state);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      {isUpdating ? (
        <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          Analisando o caso… a transcrição continua.
        </div>
      ) : null}

      {!hasContent && !isUpdating ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm leading-6 text-slate-500">
          A análise clínica inicia após os primeiros trechos da conversa.
        </div>
      ) : null}

      {settings.showAlerts ? <ClinicalAlerts alerts={state.alerts} /> : null}
      {settings.showQuestions ? (
        <SuggestedQuestions questions={state.suggestedQuestions} />
      ) : null}
      {settings.showHypotheses ? (
        <HypothesisList
          hypotheses={state.hypotheses}
          dangerousDifferentials={state.dangerousDifferentials}
        />
      ) : null}
      {settings.showTests ? (
        <SuggestedTests tests={state.suggestedTests} />
      ) : null}
      {settings.showTreatments ? (
        <PossibleTreatments treatments={state.possibleTreatments} />
      ) : null}
    </div>
  );
}
