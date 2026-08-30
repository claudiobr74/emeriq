"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AI_CONFIG,
  getAnalysisCadence,
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
import type { VitalField } from "@/lib/clinical/vitals";

type VitalSigns = ClinicalState["vitalSigns"];

/**
 * Aplica as edições manuais do médico (sinais vitais e achados observados) sobre
 * o estado clínico calculado pelo servidor. As edições manuais têm precedência e
 * são reenviadas ao modelo — sem mocks, tudo representa entrada real do médico.
 */
function applyManualOverlays(
  base: ClinicalState,
  manualVitals: Partial<VitalSigns>,
  findings: string[],
): ClinicalState {
  const observed = [...base.observedFindings];
  for (const finding of findings) {
    if (!observed.includes(finding)) observed.push(finding);
  }
  return {
    ...base,
    vitalSigns: { ...base.vitalSigns, ...manualVitals },
    observedFindings: observed,
  };
}

const SETTINGS_STORAGE_KEY = "emeriq.settings";

function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      transcription:
        parsed.transcription === "turbo" || parsed.transcription === "standard"
          ? parsed.transcription
          : DEFAULT_SETTINGS.transcription,
      showQuestions: parsed.showQuestions ?? DEFAULT_SETTINGS.showQuestions,
      showHypotheses: parsed.showHypotheses ?? DEFAULT_SETTINGS.showHypotheses,
      showAlerts: parsed.showAlerts ?? DEFAULT_SETTINGS.showAlerts,
      showTests: parsed.showTests ?? DEFAULT_SETTINGS.showTests,
      showTreatments: parsed.showTreatments ?? DEFAULT_SETTINGS.showTreatments,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(next: AppSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

const settingsListeners = new Set<() => void>();
let settingsCache: AppSettings | null = null;

function getSettingsSnapshot(): AppSettings {
  if (!settingsCache) settingsCache = loadSettings();
  return settingsCache;
}

function subscribeSettings(onStoreChange: () => void) {
  settingsListeners.add(onStoreChange);
  return () => {
    settingsListeners.delete(onStoreChange);
  };
}

function writeSettings(next: AppSettings): void {
  settingsCache = next;
  persistSettings(next);
  settingsListeners.forEach((listener) => listener());
}

export function useClinicalSession() {
  const [phase, setPhase] = useState<SessionPhase>("idle");
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    () => DEFAULT_SETTINGS,
  );
  const [clinicalState, setClinicalState] = useState<ClinicalState>(
    createEmptyClinicalState,
  );
  const [report, setReport] = useState<FinalClinicalReport | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [clinicalError, setClinicalError] = useState<string | null>(null);
  const [finalizeWarning, setFinalizeWarning] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const clinicalStateRef = useRef(clinicalState);
  const settingsRef = useRef(settings);
  const lastAnalyzedRef = useRef("");
  const lastAnalyzedAtRef = useRef(0);
  const sequenceRef = useRef(0);
  const appliedSequenceRef = useRef(0);
  const manualVitalsRef = useRef<Partial<VitalSigns>>({});
  const physicianFindingsRef = useRef<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const elapsedOriginRef = useRef<number | null>(null);
  const elapsedOffsetRef = useRef(0);

  useEffect(() => {
    clinicalStateRef.current = clinicalState;
    settingsRef.current = settings;
  });

  const setSettings = useCallback((next: AppSettings) => {
    writeSettings(next);
  }, []);

  const getModel = useCallback((): TranscriptionModelId => {
    return settingsRef.current.transcription === "turbo"
      ? AI_CONFIG.transcriptionModelTurbo
      : AI_CONFIG.transcriptionModel;
  }, []);

  const {
    confirmedTranscript,
    partialTranscript,
    status: transcriptionStatus,
    isTranscribing,
    isDegraded,
    hasFailedSegments,
    error: transcriptionError,
    start: startTranscription,
    pushPcm,
    enqueue,
    pause: pauseTranscription,
    resume: resumeTranscription,
    flushAndSettle,
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
    onPcmFrame: pushPcm,
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

    const thresholds = getAnalysisCadence();
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
    const timeout = window.setTimeout(
      () => controller.abort(),
      AI_CONFIG.timeouts.clinicalUpdateMs,
    );
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
      const merged = applyManualOverlays(
        data.state,
        manualVitalsRef.current,
        physicianFindingsRef.current,
      );
      clinicalStateRef.current = merged;
      setClinicalState(merged);
      lastAnalyzedRef.current = confirmed;
      lastAnalyzedAtRef.current = Date.now();
      setClinicalError(null);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (
          sequenceRef.current === sequence &&
          Date.now() - startedAt > AI_CONFIG.timeouts.clinicalUpdateMs - 3_000
        ) {
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
    if (transcriptionStatus === "reconnecting") return "reconnecting";
    if (phase === "listening" && isTranscribing) return "transcribing";
    if (phase === "listening") return "listening";
    if (phase === "finalizing") return "processing";
    return phase;
  }, [phase, isTranscribing, transcriptionStatus]);

  const start = useCallback(async () => {
    setSessionError(null);
    setClinicalError(null);
    setFinalizeWarning(null);
    setReport(null);
    const empty = createEmptyClinicalState();
    clinicalStateRef.current = empty;
    setClinicalState(empty);
    lastAnalyzedRef.current = "";
    lastAnalyzedAtRef.current = 0;
    sequenceRef.current = 0;
    appliedSequenceRef.current = 0;
    manualVitalsRef.current = {};
    physicianFindingsRef.current = [];
    elapsedOffsetRef.current = 0;
    setElapsedMs(0);
    setPhase("starting");
    try {
      await startTranscription();
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
  }, [startRecorder, startTranscription]);

  const pause = useCallback(() => {
    pauseRecorder();
    pauseTranscription();
    if (elapsedOriginRef.current != null) {
      elapsedOffsetRef.current += Date.now() - elapsedOriginRef.current;
      elapsedOriginRef.current = null;
    }
    setPhase("paused");
  }, [pauseRecorder, pauseTranscription]);

  const resume = useCallback(async () => {
    resumeTranscription();
    await resumeRecorder();
    elapsedOriginRef.current = Date.now();
    setPhase("listening");
  }, [resumeRecorder, resumeTranscription]);

  const finalize = useCallback(async () => {
    setPhase("finalizing");
    setSessionError(null);
    if (elapsedOriginRef.current != null) {
      elapsedOffsetRef.current += Date.now() - elapsedOriginRef.current;
      elapsedOriginRef.current = null;
    }
    abortRef.current?.abort();
    await stopRecorder();
    // Finalização transacional: aguarda o áudio pendente virar texto (confirmed
    // ou failed) antes de gerar o SOAP, para o último trecho não se perder.
    const flush = await flushAndSettle();
    if (flush.timedOut && flush.pendingCount > 0) {
      setFinalizeWarning(
        "A transcrição do último trecho não confirmou a tempo. O SOAP usa o texto já confirmado.",
      );
    }
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
  }, [getConfirmed, runClinicalUpdate, stopRecorder, flushAndSettle]);

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
    setFinalizeWarning(null);
    setIsUpdating(false);
    inFlightRef.current = false;
    lastAnalyzedRef.current = "";
    lastAnalyzedAtRef.current = 0;
    sequenceRef.current = 0;
    appliedSequenceRef.current = 0;
    manualVitalsRef.current = {};
    physicianFindingsRef.current = [];
    elapsedOriginRef.current = null;
    elapsedOffsetRef.current = 0;
    setElapsedMs(0);
    setPhase("idle");
  }, [resetTranscription, stopRecorder]);

  const setVital = useCallback(
    (field: VitalField, value: string | number | null) => {
      manualVitalsRef.current = { ...manualVitalsRef.current, [field]: value };
      const merged = applyManualOverlays(
        clinicalStateRef.current,
        manualVitalsRef.current,
        physicianFindingsRef.current,
      );
      clinicalStateRef.current = merged;
      setClinicalState(merged);
    },
    [],
  );

  const addPhysicianFinding = useCallback((finding: string) => {
    const trimmed = finding.trim();
    if (!trimmed) return;
    physicianFindingsRef.current = [...physicianFindingsRef.current, trimmed];
    const merged = applyManualOverlays(
      clinicalStateRef.current,
      manualVitalsRef.current,
      physicianFindingsRef.current,
    );
    clinicalStateRef.current = merged;
    setClinicalState(merged);
  }, []);

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
    finalizeWarning,
    transcriptionError,
    confirmedTranscript,
    partialTranscript,
    transcriptionStatus,
    isDegraded,
    hasFailedSegments,
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
    setVital,
    addPhysicianFinding,
  };
}
