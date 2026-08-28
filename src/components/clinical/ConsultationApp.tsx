"use client";

import { useState } from "react";
import { useClinicalSession } from "@/hooks/useClinicalSession";
import { Button } from "@/components/ui/button";
import { ClinicalAssistantPanel } from "@/components/clinical/ClinicalAssistantPanel";
import { ConsultationControls } from "@/components/clinical/ConsultationControls";
import { ConsultationHeader } from "@/components/clinical/ConsultationHeader";
import { FinalReport } from "@/components/clinical/FinalReport";
import { IdleScreen } from "@/components/clinical/IdleScreen";
import { SettingsDialog } from "@/components/clinical/SettingsDialog";
import { TranscriptPanel } from "@/components/clinical/TranscriptPanel";

export function ConsultationApp() {
  const session = useClinicalSession();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const showIdle =
    session.phase === "idle" ||
    session.phase === "starting" ||
    (session.phase === "error" &&
      !session.confirmedTranscript &&
      !session.report);

  const live =
    session.phase === "listening" ||
    session.phase === "paused" ||
    session.phase === "finalizing";

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100 text-slate-900">
      <ConsultationHeader
        status={session.displayStatus}
        elapsedMs={session.elapsedMs}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {showIdle ? (
        <IdleScreen
          starting={session.phase === "starting"}
          error={session.sessionError}
          onStart={() => void session.start()}
        />
      ) : null}

      {session.phase === "completed" && session.report ? (
        <FinalReport
          report={session.report}
          onNewConsultation={() => void session.reset()}
        />
      ) : null}

      {session.phase === "error" && (session.confirmedTranscript || session.report) ? (
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
          <p className="text-sm text-red-700">{session.sessionError}</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void session.retryFinalize()}>
              Tentar gerar SOAP novamente
            </Button>
            <Button onClick={() => void session.reset()}>Novo atendimento</Button>
          </div>
        </div>
      ) : null}

      {live ? (
        <>
          {(session.transcriptionError || session.clinicalError) && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950">
              {session.transcriptionError || session.clinicalError}
            </div>
          )}
          <main className="mx-auto grid min-h-0 w-full max-w-[1400px] flex-1 grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
            <TranscriptPanel
              transcript={session.confirmedTranscript}
              isTranscribing={session.isTranscribing}
            />
            <ClinicalAssistantPanel
              state={session.clinicalState}
              settings={session.settings}
              isUpdating={session.isUpdating}
            />
          </main>
          <ConsultationControls
            phase={session.phase}
            onPause={session.pause}
            onResume={() => void session.resume()}
            onFinalize={() => void session.finalize()}
          />
        </>
      ) : null}

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={session.settings}
        onChange={session.setSettings}
      />
    </div>
  );
}
