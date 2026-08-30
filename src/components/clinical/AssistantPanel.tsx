"use client";

import { hasLiveClinicalContent } from "@/lib/clinical/clinical-state";
import type { AppSettings, ClinicalState } from "@/types/clinical";
import { ClinicalAlerts } from "@/components/clinical/ClinicalAlerts";
import { SuggestedQuestions } from "@/components/clinical/SuggestedQuestions";
import { EvaluationBlock } from "@/components/clinical/EvaluationBlock";

interface AssistantPanelProps {
  state: ClinicalState;
  settings: AppSettings;
  isUpdating?: boolean;
  className?: string;
}

function missingChecks(state: ClinicalState): string[] {
  const items: string[] = [];
  if (!state.vitalSigns.bloodPressure) items.push("Verificar pressão arterial.");
  if (state.vitalSigns.heartRate == null)
    items.push("Verificar frequência cardíaca.");
  if (
    state.vitalSigns.oxygenSaturation == null &&
    /dispneia|falta de ar|peito/i.test(state.chiefComplaint ?? "")
  ) {
    items.push("Verificar saturação se houver dispneia.");
  }
  return [...items, ...state.missingInformation].slice(0, 3);
}

export function AssistantPanel({
  state,
  settings,
  isUpdating = false,
  className,
}: AssistantPanelProps) {
  const hasContent = hasLiveClinicalContent(state);

  return (
    <div className={`flex min-h-0 flex-col gap-4 ${className ?? ""}`}>
      {isUpdating ? (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary-dark">
          Analisando o caso… a transcrição continua.
        </div>
      ) : null}

      {!hasContent && !isUpdating ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-4 text-sm leading-6 text-text-secondary">
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
        <EvaluationBlock
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
