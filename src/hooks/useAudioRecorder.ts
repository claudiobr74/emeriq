"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AI_CONFIG } from "@/config/ai";
import { downsample, encodeWav } from "@/lib/audio/wav";
import { microphoneErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";

type RecorderStatus = "idle" | "starting" | "recording" | "paused";

interface UseAudioRecorderOptions {
  chunkDurationMs?: number;
  overlapMs?: number;
  onChunk: (blob: Blob) => void;
  /** Frame PCM bruto (Float32) + taxa de origem — usado pelo transporte Realtime. */
  onPcmFrame?: (frame: Float32Array, sourceRate: number) => void;
  onError?: (message: string) => void;
}

function concatFloat32(a: Float32Array, b: Float32Array): Float32Array {
  const result = new Float32Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
}

export function useAudioRecorder({
  chunkDurationMs = AI_CONFIG.chunkDurationMs,
  overlapMs = AI_CONFIG.chunkOverlapMs,
  onChunk,
  onPcmFrame,
  onError,
}: UseAudioRecorderOptions) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const statusRef = useRef<RecorderStatus>("idle");
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const muteRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const pendingRef = useRef<Float32Array<ArrayBufferLike>>(new Float32Array(0));
  const hasEmittedRef = useRef(false);
  const sourceRateRef = useRef<number>(AI_CONFIG.sampleRate);
  const onChunkRef = useRef(onChunk);
  const onPcmFrameRef = useRef(onPcmFrame);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onChunkRef.current = onChunk;
    onPcmFrameRef.current = onPcmFrame;
    onErrorRef.current = onError;
  });

  const setRecorderStatus = (next: RecorderStatus) => {
    statusRef.current = next;
    setStatus(next);
  };

  const emitSlice = useCallback((samples: Float32Array, sourceRate: number) => {
    if (samples.length === 0) return;
    const downsampled = downsample(samples, sourceRate, AI_CONFIG.sampleRate);
    const blob = encodeWav(downsampled, AI_CONFIG.sampleRate);
    logger.audio("chunk emitted", {
      bytes: blob.size,
      samples: downsampled.length,
    });
    onChunkRef.current(blob);
  }, []);

  const handlePcm = useCallback(
    (input: Float32Array) => {
      if (statusRef.current !== "recording") return;

      const sourceRate = sourceRateRef.current;
      // Transporte Realtime: envia frames PCM contínuos.
      onPcmFrameRef.current?.(input, sourceRate);
      pendingRef.current = concatFloat32(pendingRef.current, input);

      const chunkSamples = Math.round((chunkDurationMs / 1000) * sourceRate);
      const overlapSamples = Math.round((overlapMs / 1000) * sourceRate);
      const needed =
        chunkSamples + (hasEmittedRef.current ? overlapSamples : 0);

      if (pendingRef.current.length >= needed) {
        emitSlice(pendingRef.current, sourceRate);
        pendingRef.current = pendingRef.current.slice(-overlapSamples);
        hasEmittedRef.current = true;
      }
    },
    [chunkDurationMs, overlapMs, emitSlice],
  );

  const teardownGraph = useCallback(() => {
    try {
      workletRef.current?.port.close();
    } catch {
      /* ignore */
    }
    workletRef.current?.disconnect();
    processorRef.current?.disconnect();
    muteRef.current?.disconnect();
    sourceRef.current?.disconnect();
    workletRef.current = null;
    processorRef.current = null;
    muteRef.current = null;
    sourceRef.current = null;
  }, []);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const flushRemaining = useCallback(() => {
    const sourceRate = sourceRateRef.current;
    const minSamples = Math.round(
      (AI_CONFIG.minFlushDurationMs / 1000) * sourceRate,
    );
    if (pendingRef.current.length >= minSamples) {
      emitSlice(pendingRef.current, sourceRate);
    }
    pendingRef.current = new Float32Array(0);
  }, [emitSlice]);

  const start = useCallback(async () => {
    if (statusRef.current === "recording" || statusRef.current === "starting") {
      return;
    }

    setRecorderStatus("starting");
    pendingRef.current = new Float32Array(0);
    hasEmittedRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const context = new AudioContextClass();
      if (context.state === "suspended") {
        await context.resume();
      }
      contextRef.current = context;
      sourceRateRef.current = context.sampleRate;

      const source = context.createMediaStreamSource(stream);
      sourceRef.current = source;
      const mute = context.createGain();
      mute.gain.value = 0;
      muteRef.current = mute;
      mute.connect(context.destination);

      try {
        await context.audioWorklet.addModule("/pcm-processor.js");
        const worklet = new AudioWorkletNode(context, "pcm-capture");
        worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
          handlePcm(new Float32Array(event.data));
        };
        source.connect(worklet);
        worklet.connect(mute);
        workletRef.current = worklet;
      } catch (workletError) {
        logger.audio("worklet unavailable, using ScriptProcessor", workletError);
        const processor = context.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (event) => {
          const data = event.inputBuffer.getChannelData(0);
          handlePcm(new Float32Array(data));
        };
        source.connect(processor);
        processor.connect(mute);
        processorRef.current = processor;
      }

      setRecorderStatus("recording");
      logger.audio("recording started", { sampleRate: context.sampleRate });
    } catch (error) {
      teardownGraph();
      stopTracks();
      await contextRef.current?.close().catch(() => undefined);
      contextRef.current = null;
      setRecorderStatus("idle");
      const message = microphoneErrorMessage(error);
      logger.error("microphone start failed", error);
      onErrorRef.current?.(message);
      throw new Error(message);
    }
  }, [handlePcm, stopTracks, teardownGraph]);

  const pause = useCallback(() => {
    if (statusRef.current !== "recording") return;
    setRecorderStatus("paused");
    logger.audio("paused");
  }, []);

  const resume = useCallback(async () => {
    if (statusRef.current !== "paused") return;
    if (contextRef.current?.state === "suspended") {
      await contextRef.current.resume();
    }
    setRecorderStatus("recording");
    logger.audio("resumed");
  }, []);

  const stop = useCallback(async () => {
    flushRemaining();
    teardownGraph();
    stopTracks();
    await contextRef.current?.close().catch(() => undefined);
    contextRef.current = null;
    setRecorderStatus("idle");
    logger.audio("stopped");
  }, [flushRemaining, stopTracks, teardownGraph]);

  return {
    status,
    start,
    pause,
    resume,
    stop,
  };
}
