"use client";

import { useState } from "react";
import { useClinicalSession } from "@/hooks/useClinicalSession";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/clinical/AppHeader";
import { StartScreen } from "@/components/clinical/StartScreen";
import { MicPermissionScreen } from "@/components/clinical/MicPermissionScreen";
import { ConsultationView } from "@/components/clinical/ConsultationView";
import { ProcessingScreen } from "@/components/clinical/ProcessingScreen";
import { SoapSummary } from "@/components/clinical/SoapSummary";
import { SettingsModal } from "@/components/clinical/SettingsModal";
import { FinalizeConfirmModal } from "@/components/clinical/FinalizeConfirmModal";

export function ConsultationApp() {
  const session = useClinicalSession();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);

  const showStart =
    session.phase === "idle" ||
    (session.phase === "error" &&
      !session.confirmedTranscript &&
      !session.report);

  const live = session.phase === "listening" || session.phase === "paused";
  const isFinalizeError =
    session.phase === "error" &&
    Boolean(session.confirmedTranscript || session.report);

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-text">
      <AppHeader
        status={session.displayStatus}
        elapsedMs={session.elapsedMs}
        showStatus={live}
        showTimer={live}
        onOpenSettings={live ? () => setSettingsOpen(true) : undefined}
      />

      {showStart ? (
        <StartScreen
          starting={session.phase === "starting"}
          error={session.sessionError}
          onStart={() => void session.start()}
        />
      ) : null}

      {session.phase === "starting" ? <MicPermissionScreen /> : null}

      {live ? (
        <ConsultationView
          phase={session.phase}
          state={session.clinicalState}
          settings={session.settings}
          confirmedTranscript={session.confirmedTranscript}
          partialTranscript={session.partialTranscript}
          isTranscribing={session.isTranscribing}
          isDegraded={session.isDegraded}
          hasFailedSegments={session.hasFailedSegments}
          isUpdating={session.isUpdating}
          transcriptionError={session.transcriptionError}
          clinicalError={session.clinicalError}
          onVitalChange={session.setVital}
          onPhysicianFinding={session.addPhysicianFinding}
          onPause={session.pause}
          onResume={() => void session.resume()}
          onFinalize={() => setFinalizeOpen(true)}
        />
      ) : null}

      {session.phase === "finalizing" ? <ProcessingScreen /> : null}

      {session.phase === "completed" && session.report ? (
        <SoapSummary
          report={session.report}
          onNewConsultation={() => void session.reset()}
        />
      ) : null}

      {isFinalizeError ? (
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
          <p className="text-sm text-critical">{session.sessionError}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => void session.retryFinalize()}>
              Tentar gerar SOAP novamente
            </Button>
            <Button onClick={() => void session.reset()}>Novo atendimento</Button>
          </div>
        </div>
      ) : null}

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={session.settings}
        onChange={session.setSettings}
      />

      <FinalizeConfirmModal
        open={finalizeOpen}
        onOpenChange={setFinalizeOpen}
        onConfirm={() => void session.finalize()}
      />
    </div>
  );
}
