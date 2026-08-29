"use client";

import { hasLiveClinicalContent } from "@/lib/clinical/clinical-state";
import type { AppSettings, ClinicalState } from "@/types/clinical";
import { ClinicalAlerts } from "@/components/clinical/ClinicalAlerts";
import { EvaluationSections } from "@/components/clinical/HypothesisList";
import { SuggestedQuestions } from "@/components/clinical/SuggestedQuestions";

interface ClinicalAssistantPanelProps {
  state: ClinicalState;
  settings: AppSettings;
  isUpdating?: boolean;
}

function missingChecks(state: ClinicalState): string[] {
  const items: string[] = [];
  if (!state.vitalSigns.bloodPressure) items.push("Verificar pressão arterial.");
  if (state.vitalSigns.heartRate == null) items.push("Verificar frequência cardíaca.");
  if (state.vitalSigns.oxygenSaturation == null && /dispneia|falta de ar|peito/i.test(state.chiefComplaint ?? "")) {
    items.push("Verificar saturação se houver dispneia.");
  }
  return [...items, ...state.missingInformation].slice(0, 3);
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
        <SuggestedQuestions
          questions={state.suggestedQuestions}
          missingChecks={hasContent ? missingChecks(state) : []}
        />
      ) : null}
      {settings.showHypotheses || settings.showTests || settings.showTreatments ? (
        <EvaluationSections
          hypotheses={settings.showHypotheses ? state.hypotheses : []}
          dangerousDifferentials={
            settings.showHypotheses ? state.dangerousDifferentials : []
          }
          tests={settings.showTests ? state.suggestedTests : []}
          treatments={settings.showTreatments ? state.possibleTreatments : []}
        />
      ) : null}
    </div>
  );
}
