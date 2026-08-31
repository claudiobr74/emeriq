# EMERIQ — Corrective Report

Rodada: consolidação OpenAI + Realtime Transcription + Figma fidelity + P1/P2.
Arquitetura vigente: `ARCHITECTURE.md`. Snapshot pré-correção: `CORRECTIVE_AUDIT_BEFORE.md`.

## Estado anterior

Antes desta rodada (e da corretiva que a antecedeu no mesmo ramo):

- Transcrição REST em chunks de ~6 s (`POST /api/transcribe`); sem partial real.
- `latestTranscriptSegment` existia e a UI não o usava.
- Breakpoint mobile/desktop em `md` (768 px), contra o Figma (640 / 1024).
- Glasgow do Figma mapeado para Glicemia; `ClinicalState` sem `glasgow`.
- Settings: “Profunda” = `economical` (rótulo falso).
- Logo do header como ícone + wordmark HTML.
- ThemeToggle no header (fora do Figma).
- `maxDuration = 10` nas rotas vs timeouts de cliente 35–65 s.
- Finalize com `waitForIdle(40s)` sem sequência terminal de áudio.
- 37 testes; sem cobertura de provider OpenAI, rotas, reducer, Glasgow.
- Documentação ainda descrevia Groq / chunks como arquitetura vigente.

## Groq purge

- `package.json` / `pnpm-lock.yaml`: sem `groq-sdk`.
- `.env.example`: só `OPENAI_API_KEY`.
- Código e testes: zero referências operacionais a Groq / `GROQ_API_KEY`.
- Relatórios históricos movidos ou marcados:
  - `docs/archive/MVP_1_1_IMPLEMENTATION_REPORT.md`
  - `docs/archive/FIGMA_IMPLEMENTATION_AUDIT.md`
  - `docs/archive/FIGMA_IMPLEMENTATION_REPORT.md`
  - `CORRECTIVE_AUDIT_BEFORE.md` (snapshot FASE 1)
- Documentação ativa (`README.md`, `ARCHITECTURE.md`, `DEPLOYMENT.md`) declara **Groq: not used**.

## OpenAI architecture

| Camada | Provider | Modelo |
| --- | --- | --- |
| Transcrição principal | OpenAI Realtime | `gpt-4o-transcribe` (ou `gpt-4o-mini-transcribe` se “Tempo real”) |
| Transcrição fallback | OpenAI REST | mesmos modelos |
| Raciocínio clínico | OpenAI | `gpt-4o-mini` (inalterado) |

Credencial: `OPENAI_API_KEY` somente server-side. Sem `NEXT_PUBLIC_OPENAI_API_KEY`.
Sessão Realtime: `POST /api/realtime/session` minta `ek_` efêmero.

## Realtime transcription

- Transporte principal: WebSocket Realtime (`src/lib/transcription/realtime-engine.ts`).
- Fallback REST só se a sessão falhar na init ou após reconexão esgotada.
- UI entra em `degraded` e mostra banner — não finge Realtime.
- Reconciliador de overlap mantido para REST / reconexão / segmentos repetidos.
- Lifecycle: `connecting | connected | listening | reconnecting | degraded | disconnected | error`.
- Reconexão com backoff limitado (`AI_CONFIG.realtime.reconnect`).
- Pause interrompe envio de áudio; resume continua a mesma consulta.

## Partial transcript implementation

- Reducer puro (`src/lib/transcription/reducer.ts`): deltas incrementais **acumulam** no mesmo `item_id`.
- `TranscriptPanel`: confirmed (texto normal) + partial (menor contraste).
- Completed limpa o partial; reconciliador evita duplicar confirmed.
- `/api/clinical/update` recebe só `getConfirmed()` — tokens provisórios não alimentam o ClinicalState.

## Finalization integrity

- `acceptedAudioSequence` = `state.segments` (ordem de áudio aceito).
- Finalize: bloqueia entrada → `commit()` → espera todos os segmentos `confirmed|failed` (até 40 s) → clinical update → SOAP.
- Falha de segmento: `hasFailedSegments` + banner “Um trecho não pôde ser transcrito.”
- Timeout de flush: aviso no SOAP (`finalizeWarning`); não ignora em silêncio.

## Timeout fixes

| Rota | `maxDuration` | Timeout cliente |
| --- | ---: | ---: |
| `/api/transcribe` | 30 s | 28 s |
| `/api/clinical/update` | 45 s | 43 s |
| `/api/clinical/finalize` | 60 s | 58 s |

Plataforma detectada: Netlify (`netlify.toml`) + preview Vercel. Tetos de plano documentados em `DEPLOYMENT.md`. Não há mais `maxDuration = 10` competindo com cliente de 60 s.

## Settings correction

- “Rápida / Equilibrada / Profunda” removida da UI.
- Cadência interna: `analysisCadence` (default `balanced`). Sem `reasoningDepth`.
- Tema Claro / Escuro / Sistema em Settings (não no header).
- Transcrição: Tempo real / Alta precisão — o modelo escolhido vai à sessão Realtime e ao REST.

## Glasgow + glucose

`vitalSigns`: PA, FC, SpO₂, FR, Temp, **glasgow** (3–15), **glucose**.
- Barra principal (Figma 5:82): seis cards, Glasgow no 6º.
- Glicemia: card complementar.
- Entrada inválida de Glasgow (2, 16) → `null` (não inferir).
- Fallback do SOAP Objetivo inclui Glasgow e glicemia **somente se informados**.

## Breakpoint fixes

| Largura | Layout |
| --- | --- |
| ≤639 (ex.: 390) | mobile — abas Consulta \| Assistente |
| 640–1023 (640, 768, 1023) | tablet — duas colunas |
| ≥1024 (1024, 1440) | desktop — duas colunas |

Implementado com `sm:` (640) e `lg:` (1024). Sem `md` (768) como fronteira mobile/tablet.

## Figma fidelity

Arquivo `EucPNedxngcqVYMwhD64co`. Node desktop consulta `5:82`:
- `transcription-column` width **709**, `assistant-column` width **659**.
- Desktop: `lg:grid-cols-[709fr_659fr]` (não 50/50).
- Tokens, Inter, StatusPill, Settings no header (ícone), sem ThemeToggle no header.
- Sem diarização Médico/Paciente (proibida nesta rodada).
- Web Speech API do handoff Figma ignorada.

## Logo correction

Header usa `public/brand/emeriq-logo-header.svg` (+ variante dark). Aspect 105:28 (node 10:250). Sem wordmark HTML.

## Dark mode handling

Classe `.dark`, tokens do node `5:1775`. Preferência em Settings + `prefers-color-scheme`. Overlay e card da Start usam tokens (`bg-overlay`, `bg-surface`).

## API hardening

`src/lib/http.ts`: same-origin, Content-Type JSON, limites (áudio 8 MB, JSON 512 KB, transcrição 60 k, segmento 12 k), Zod, `errorResponse` sem stack. Documentado em `DEPLOYMENT_SECURITY.md`.

## Tests added

Além da suíte clínica já existente:

- Reducer: partial incremental, item_id, reconexão sem duplicar, flush do segmento N, falha registrada, pause/status sem apagar confirmed, `acceptedAudioSequence`.
- Realtime session: credencial efêmera; modelo Tempo real / Alta precisão.
- Providers OpenAI mockados (`clinical.test.ts`).
- Rotas: `/api/clinical/update`, `/api/clinical/finalize`, `/api/transcribe`, `/api/realtime/session`.
- Settings: ausência de Profunda → economical.
- Vitals: Glasgow 15 / 8, glicemia 92, faixa 3–15, campos independentes.
- SOAP Objetivo: inclui Glasgow/glicemia só quando informados.
- Breakpoints: 390, 639, 640, 768, 1023, 1024, 1440.

## Test results

```
pnpm lint       ✓
pnpm typecheck  ✓
pnpm test       ✓  84/84
pnpm build      ✓
pnpm eval:clinical  ✗  OPENAI_API_KEY ausente neste ambiente
```

## Clinical Evaluation results

`pnpm eval:clinical` **não foi reexecutado contra a OpenAI real** neste ambiente: `OPENAI_API_KEY` não está disponível (harness exige a chave). Casos e scoring em `evaluation/` **não foram alterados**. A troca de transporte de transcrição não muda os testes sintéticos (eles chamam o provider clínico, não o Realtime).

## Manual latency measurements

Teste manual contínuo de 30–60 s com microfone **não foi executado** neste ambiente (sem dispositivo de áudio e sem chave OpenAI). Métricas `time-to-first-partial`, `time-to-confirmed-segment`, `time-to-clinical-update` e `time-to-final-SOAP` **não foram inventadas**.

Validação substituta: HTML da Start em `http://127.0.0.1:3000` contém `aria-label="Configurações"` e `data-testid="start-consultation"`; `/api/health` responde `{"openaiConfigured":false}` sem vazar chave.

## Remaining limitations

- Sem persistência de consulta ao recarregar.
- Sem autenticação de usuários.
- Plano Netlify Free: funções clínicas limitadas a 10 s; Realtime não passa pela função.
- Sem diarização.
- Cadência de análise não é escolhida na UI (só `balanced`).
- Avaliação clínica real do harness pendente de `OPENAI_API_KEY`.

## Deliberately not implemented

Banco, auth, Supabase/Nhost/Redis, RAG novo, agentes, dashboard, pacientes, histórico, prontuário, agenda, FHIR/HL7, speaker diarization, novos protocolos, prescrição, scores clínicos, Web Speech API, troca do modelo clínico `gpt-4o-mini`, benchmarking de modelos.
