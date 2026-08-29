"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AI_CONFIG,
  getAnalysisThresholds,
  type TranscriptionModelId,
} from "@/config/ai";
import { createEmptyClinicalState } from "@/lib/clinical/clinical-state";
import { hasClinicalTrigger } from "@/lib/clinical/triggers";
import { shouldApplySequence } from "@/lib/clinical/sequence";
import { apiErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useTranscription } from "@/hooks/useTranscription";
import type {
  AppSettings,
  ClinicalState,
  DisplayStatus,
  FinalClinicalReport,
  SessionPhase,
} from "@/types/clinical";
import { DEFAULT_SETTINGS } from "@/types/clinical";

export function useClinicalSession() {
  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [clinicalState, setClinicalState] = useState<ClinicalState>(
    createEmptyClinicalState,
  );
  const [report, setReport] = useState<FinalClinicalReport | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [clinicalError, setClinicalError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const clinicalStateRef = useRef(clinicalState);
  const settingsRef = useRef(settings);
  const lastAnalyzedRef = useRef("");
  const lastAnalyzedAtRef = useRef(0);
  const sequenceRef = useRef(0);
  const appliedSequenceRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const elapsedOriginRef = useRef<number | null>(null);
  const elapsedOffsetRef = useRef(0);

  useEffect(() => {
    clinicalStateRef.current = clinicalState;
    settingsRef.current = settings;
  });

  const getModel = useCallback((): TranscriptionModelId => {
    return settingsRef.current.transcription === "turbo"
      ? AI_CONFIG.transcriptionModelTurbo
      : AI_CONFIG.transcriptionModel;
  }, []);

  const {
    confirmedTranscript,
    latestTranscriptSegment,
    isTranscribing,
    error: transcriptionError,
    enqueue,
    waitForIdle,
    getConfirmed,
    reset: resetTranscription,
  } = useTranscription({ getModel });

  const {
    start: startRecorder,
    pause: pauseRecorder,
    resume: resumeRecorder,
    stop: stopRecorder,
  } = useAudioRecorder({
    onChunk: enqueue,
    onError: (message) => {
      setSessionError(message);
      setPhase("error");
    },
  });

  useEffect(() => {
    if (phase !== "listening") return;
    const id = window.setInterval(() => {
      if (elapsedOriginRef.current == null) return;
      setElapsedMs(
        elapsedOffsetRef.current + (Date.now() - elapsedOriginRef.current),
      );
    }, 250);
    return () => window.clearInterval(id);
  }, [phase]);

  const runClinicalUpdate = useCallback(async (force: boolean) => {
    const confirmed = getConfirmed();
    const previous = lastAnalyzedRef.current;
    const newSegment =
      confirmed.startsWith(previous) && previous.length > 0
        ? confirmed.slice(previous.length).trim()
        : confirmed.trim();

    if (!confirmed.trim()) return;
    if (!force && !newSegment) return;

    const thresholds = getAnalysisThresholds(settingsRef.current.analysisPace);
    const elapsed = Date.now() - lastAnalyzedAtRef.current;
    const triggered = hasClinicalTrigger(newSegment, clinicalStateRef.current);
    const enoughText = newSegment.length >= thresholds.minNewChars;
    const enoughTime =
      elapsed >= thresholds.intervalMs || lastAnalyzedAtRef.current === 0;

    if (!force && !triggered && !(enoughText && enoughTime)) {
      return;
    }

    if (!force && inFlightRef.current) {
      logger.clinicalUpdate("skip, already in flight");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 65_000);
    const startedAt = Date.now();
    const sequence = sequenceRef.current + 1;
    sequenceRef.current = sequence;
    inFlightRef.current = true;
    setIsUpdating(true);

    logger.clinicalUpdate("dispatch", {
      sequence,
      force,
      triggered,
      newChars: newSegment.length,
    });

    try {
      const response = await fetch("/api/clinical/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          currentState: clinicalStateRef.current,
          confirmedTranscript: confirmed,
          newSegment,
          sequence,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          payload?.error ??
            apiErrorMessage(response.status, "Falha na análise clínica."),
        );
      }

      const data = (await response.json()) as {
        state: ClinicalState;
        sequence: number;
      };

      if (!shouldApplySequence(data.sequence, appliedSequenceRef.current)) {
        logger.clinicalUpdate("ignored stale response", data.sequence);
        return;
      }

      appliedSequenceRef.current = data.sequence;
      clinicalStateRef.current = data.state;
      setClinicalState(data.state);
      lastAnalyzedRef.current = confirmed;
      lastAnalyzedAtRef.current = Date.now();
      setClinicalError(null);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (sequenceRef.current === sequence && Date.now() - startedAt > 60_000) {
          lastAnalyzedAtRef.current = Date.now();
          setClinicalError(
            "A análise clínica demorou demais. A gravação continua; nova tentativa em instantes.",
          );
        }
        return;
      }
      logger.clinicalUpdate("clinical update failed", error);
      lastAnalyzedAtRef.current = Date.now();
      setClinicalError(
        error instanceof Error
          ? `${error.message} A gravação continua.`
          : "Falha na análise clínica. A gravação continua.",
      );
    } finally {
      window.clearTimeout(timeout);
      if (sequenceRef.current === sequence) {
        inFlightRef.current = false;
        setIsUpdating(false);
      }
    }
  }, [getConfirmed]);

  useEffect(() => {
    if (phase !== "listening" && phase !== "paused") return;
    void runClinicalUpdate(false);
  }, [phase, confirmedTranscript, runClinicalUpdate]);

  useEffect(() => {
    if (phase !== "listening") return;
    const id = window.setInterval(() => {
      void runClinicalUpdate(false);
    }, 2000);
    return () => window.clearInterval(id);
  }, [phase, runClinicalUpdate]);

  const displayStatus: DisplayStatus = useMemo(() => {
    if (phase === "listening" && isTranscribing) return "transcribing";
    if (phase === "listening") return "listening";
    if (phase === "finalizing") return "processing";
    return phase;
  }, [phase, isTranscribing]);

  const start = useCallback(async () => {
    setSessionError(null);
    setClinicalError(null);
    setReport(null);
    const empty = createEmptyClinicalState();
    clinicalStateRef.current = empty;
    setClinicalState(empty);
    lastAnalyzedRef.current = "";
    lastAnalyzedAtRef.current = 0;
    sequenceRef.current = 0;
    appliedSequenceRef.current = 0;
    elapsedOffsetRef.current = 0;
    setElapsedMs(0);
    setPhase("starting");
    try {
      await startRecorder();
      elapsedOriginRef.current = Date.now();
      setPhase("listening");
    } catch (error) {
      setSessionError(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o atendimento.",
      );
      setPhase("error");
    }
  }, [startRecorder]);

  const pause = useCallback(() => {
    pauseRecorder();
    if (elapsedOriginRef.current != null) {
      elapsedOffsetRef.current += Date.now() - elapsedOriginRef.current;
      elapsedOriginRef.current = null;
    }
    setPhase("paused");
  }, [pauseRecorder]);

  const resume = useCallback(async () => {
    await resumeRecorder();
    elapsedOriginRef.current = Date.now();
    setPhase("listening");
  }, [resumeRecorder]);

  const finalize = useCallback(async () => {
    setPhase("finalizing");
    setSessionError(null);
    if (elapsedOriginRef.current != null) {
      elapsedOffsetRef.current += Date.now() - elapsedOriginRef.current;
      elapsedOriginRef.current = null;
    }
    abortRef.current?.abort();
    await stopRecorder();
    await waitForIdle();
    await runClinicalUpdate(true);

    try {
      const response = await fetch("/api/clinical/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: getConfirmed(),
          state: clinicalStateRef.current,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          payload?.error ??
            apiErrorMessage(response.status, "Falha ao gerar o SOAP."),
        );
      }

      const data = (await response.json()) as { report: FinalClinicalReport };
      setReport(data.report);
      setPhase("completed");
    } catch (error) {
      logger.error("finalize failed", error);
      setSessionError(
        error instanceof Error
          ? error.message
          : "Falha ao gerar o relatório final.",
      );
      setPhase("error");
    }
  }, [getConfirmed, runClinicalUpdate, stopRecorder, waitForIdle]);

  const retryFinalize = useCallback(async () => {
    setSessionError(null);
    setPhase("finalizing");
    try {
      const response = await fetch("/api/clinical/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: getConfirmed(),
          state: clinicalStateRef.current,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          payload?.error ??
            apiErrorMessage(response.status, "Falha ao gerar o SOAP."),
        );
      }
      const data = (await response.json()) as { report: FinalClinicalReport };
      setReport(data.report);
      setPhase("completed");
    } catch (error) {
      setSessionError(
        error instanceof Error
          ? error.message
          : "Falha ao gerar o relatório final.",
      );
      setPhase("error");
    }
  }, [getConfirmed]);

  const reset = useCallback(async () => {
    abortRef.current?.abort();
    await stopRecorder();
    resetTranscription();
    const empty = createEmptyClinicalState();
    clinicalStateRef.current = empty;
    setClinicalState(empty);
    setReport(null);
    setSessionError(null);
    setClinicalError(null);
    setIsUpdating(false);
    inFlightRef.current = false;
    lastAnalyzedRef.current = "";
    lastAnalyzedAtRef.current = 0;
    sequenceRef.current = 0;
    appliedSequenceRef.current = 0;
    elapsedOriginRef.current = null;
    elapsedOffsetRef.current = 0;
    setElapsedMs(0);
    setPhase("idle");
  }, [resetTranscription, stopRecorder]);

  const retryStart = useCallback(async () => {
    await reset();
  }, [reset]);

  return {
    phase,
    displayStatus,
    settings,
    setSettings,
    clinicalState,
    report,
    sessionError,
    clinicalError,
    transcriptionError,
    confirmedTranscript,
    latestTranscriptSegment,
    isTranscribing,
    isUpdating,
    elapsedMs,
    start,
    pause,
    resume,
    finalize,
    retryFinalize,
    reset,
    retryStart,
  };
}
