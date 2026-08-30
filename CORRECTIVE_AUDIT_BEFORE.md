> **HISTORICAL SNAPSHOT — FASE 1.** Estado do repositório *antes* da rodada corretiva. Não é a arquitetura vigente. Ver `ARCHITECTURE.md` e `EMERIQ_CORRECTIVE_REPORT.md`.

# CORRECTIVE_AUDIT_BEFORE

Estado do repositório **antes** da rodada corretiva (FASE 1). Base para as
correções P0/P1/P2.

## Provider e modelos (estado atual)

- **Transcrição:** OpenAI (já migrado de Groq). Provider REST em
  `src/lib/openai/transcription.ts` via `openai.audio.transcriptions`.
- **Modelo de transcrição:** `gpt-4o-transcribe` ("Alta precisão") e
  `gpt-4o-mini-transcribe` ("Tempo real") — `src/config/ai.ts`.
- **Provider clínico:** OpenAI — `src/lib/openai/clinical.ts` (`OpenAiClinicalProvider`).
- **Modelo clínico:** `gpt-4o-mini` (chat.completions, `response_format: json_object`).
- **Credencial:** `OPENAI_API_KEY` (server-side, `src/lib/env.ts`).

## Arquivos citando Groq (a tratar)

Nenhum arquivo de código cita Groq. Restam menções em documentos:
`FIGMA_IMPLEMENTATION_AUDIT.md`, `FIGMA_IMPLEMENTATION_REPORT.md` (em contexto de
migração) e `MVP_1_1_IMPLEMENTATION_REPORT.md` (histórico, cita `gpt-oss` via Groq).
`package.json`/lock já não têm `groq-sdk`; `.env.example` já usa `OPENAI_API_KEY`.

## Captura / transcrição atual

- `src/hooks/useAudioRecorder.ts`: captura PCM via AudioWorklet (16 kHz), emite
  **chunks WAV de ~6 s** (`AI_CONFIG.chunkDurationMs`) com 1,5 s de overlap.
- `src/hooks/useTranscription.ts`: fila de blobs → `POST /api/transcribe` →
  `reconcileTranscript` → `confirmedTranscript`. **Não há partial transcript real.**
- `latestTranscriptSegment` é exposto pelo hook mas **não é usado na UI**
  (`TranscriptPanel` só mostra `confirmedTranscript` + indicador "Transcrevendo").
- Reconciliador robusto em `src/lib/clinical/transcript-reconciler.ts` (overlap/boundary).

## Breakpoints atuais

- `ConsultationView` usa `md` (768px) como fronteira mobile/desktop
  (`hidden md:flex` / `md:hidden`). VitalsBar: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`.
- Divergente do Figma (Mobile <640, Tablet 640–1023, Desktop ≥1024).

## Sinais vitais atuais

- `ClinicalState.vitalSigns`: `bloodPressure, heartRate, respiratoryRate,
  oxygenSaturation, temperature, glucose`. **Não há `glasgow`.**
- UI (`VitalsBar`) mostra 6 cards: PA, FC, SpO₂, FR, Temp, **Glicemia** (Glasgow do
  Figma foi mapeado para Glicemia). A corrigir: restaurar Glasgow + manter Glicemia.

## Settings atual

- `AppSettings`: `transcription (standard|turbo)`, `analysisPace (fast|balanced|economical)`
  + toggles de exibição. UI expõe "Rápida/Equilibrada/**Profunda**", com
  **Profunda → economical** (rótulo semanticamente incorreto). Frequência de análise
  (intervalos/min chars) está nomeada como "pace"/"análise" — é **cadência**, não profundidade.

## Logo atual

- `Logo` usa apenas o ícone SVG + wordmark "EmerIQ" como **texto HTML**
  (`src/components/brand/Logo.tsx`), apesar de existir `public/brand/emeriq-logo-header.svg`
  (asset oficial `EmerIQ/Logo/Header`, node 10:250).

## Theme toggle atual

- `ThemeToggle` (sol/lua) está **no header** (`AppHeader`) — posição não prevista no
  Figma principal. Dark mode via classe `.dark` + `localStorage`/`prefers-color-scheme`.

## Timeouts das APIs

- Rotas `maxDuration = 10` (`/api/transcribe`, `/api/clinical/update`,
  `/api/clinical/finalize`), **em conflito** com timeouts do cliente (35 s transcrição,
  45–65 s clínico). `netlify.toml` presente → plataforma Netlify.

## Fluxo de finalize

- `useClinicalSession.finalize()`: para o recorder → `waitForIdle()` (espera fila,
  **timeout de 40 s**) → `runClinicalUpdate(true)` → `POST /api/clinical/finalize`.
  Não há garantia transacional de que o último áudio virou texto (risco: SOAP sem o
  último trecho). Sem `acceptedAudioSequence`.

## Testes existentes

37 testes (Vitest): `errors`, `safety/evaluator`, `schemas`, `scorer`,
`provenance`, `router`, `sequence`, `transcript-reconciler`, `session-reset`.
**Faltam** testes de provider OpenAI, das rotas de API, da máquina de estados de
transcrição, de finalize transacional, de Glasgow/glicemia e de settings.
