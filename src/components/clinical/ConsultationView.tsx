"use client";

import { useState } from "react";
import type { AppSettings, ClinicalState, SessionPhase } from "@/types/clinical";
import type { VitalField } from "@/lib/clinical/vitals";
import { TranscriptPanel } from "@/components/clinical/TranscriptPanel";
import { AssistantPanel } from "@/components/clinical/AssistantPanel";
import { VitalsBar } from "@/components/clinical/VitalsBar";
import { PhysicianInput } from "@/components/clinical/PhysicianInput";
import { ConsultationFooter } from "@/components/clinical/ConsultationFooter";
import { ErrorBanner } from "@/components/clinical/ErrorBanner";
import { MobileTabs, type MobileTab } from "@/components/clinical/MobileTabs";

interface ConsultationViewProps {
  phase: SessionPhase;
  state: ClinicalState;
  settings: AppSettings;
  confirmedTranscript: string;
  isTranscribing: boolean;
  isUpdating: boolean;
  transcriptionError: string | null;
  clinicalError: string | null;
  onVitalChange: (field: VitalField, value: string | number | null) => void;
  onPhysicianFinding: (finding: string) => void;
  onPause: () => void;
  onResume: () => void;
  onFinalize: () => void;
}

export function ConsultationView(props: ConsultationViewProps) {
  const {
    phase,
    state,
    settings,
    confirmedTranscript,
    isTranscribing,
    isUpdating,
    transcriptionError,
    clinicalError,
    onVitalChange,
    onPhysicianFinding,
    onPause,
    onResume,
    onFinalize,
  } = props;
  const [mobileTab, setMobileTab] = useState<MobileTab>("consulta");

  const banners = (
    <>
      {transcriptionError ? (
        <ErrorBanner kind="transcription" message={transcriptionError} />
      ) : null}
      {clinicalError ? <ErrorBanner kind="clinical" message={clinicalError} /> : null}
    </>
  );

  const vitalsAndInput = (
    <div className="flex flex-col gap-3">
      <VitalsBar vitals={state.vitalSigns} onChange={onVitalChange} />
      <PhysicianInput onSubmit={onPhysicianFinding} />
    </div>
  );

  const footer = (
    <ConsultationFooter
      phase={phase}
      onPause={onPause}
      onResume={onResume}
      onFinalize={onFinalize}
    />
  );

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      {banners}

      {/* Desktop / tablet: workspace de duas colunas + vitais + footer */}
      <div className="hidden min-h-0 flex-1 flex-col md:flex">
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-6 p-6">
          <TranscriptPanel
            transcript={confirmedTranscript}
            isTranscribing={isTranscribing}
            className="min-h-0"
          />
          <div className="min-h-0 overflow-y-auto pr-1">
            <AssistantPanel
              state={state}
              settings={settings}
              isUpdating={isUpdating}
            />
          </div>
        </div>
        <div className="border-y border-border bg-surface px-6 py-4">
          {vitalsAndInput}
        </div>
        {footer}
      </div>

      {/* Mobile: segmented control Consulta | Assistente */}
      <div className="flex min-h-0 flex-1 flex-col md:hidden">
        <div className="p-4 pb-0">
          <MobileTabs value={mobileTab} onChange={setMobileTab} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          {mobileTab === "consulta" ? (
            <>
              <TranscriptPanel
                transcript={confirmedTranscript}
                isTranscribing={isTranscribing}
              />
              {vitalsAndInput}
            </>
          ) : (
            <AssistantPanel
              state={state}
              settings={settings}
              isUpdating={isUpdating}
            />
          )}
        </div>
        {footer}
      </div>
    </main>
  );
}
