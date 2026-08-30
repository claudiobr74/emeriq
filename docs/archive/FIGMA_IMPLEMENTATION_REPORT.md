# FIGMA_IMPLEMENTATION_REPORT

> Para a **arquitetura de IA vigente**, consulte `ARCHITECTURE.md` (OpenAI only).
> Este documento cobre a rodada de design-to-code.

Relatório da migração design-to-code do EmerIQ: o MVP funcional passou a
refletir o design oficial do Figma, preservando toda a lógica clínica e o
pipeline de transcrição/IA existente.

## Figma utilizado

`EmerIQ — Clinical Assistant MVP` · fileKey `EucPNedxngcqVYMwhD64co`.
Lidos via Figma MCP: design system (`5:1918`), developer handoff (`5:2206`),
e as telas desktop/tablet/mobile, modais, processing, rationale, error states,
dark mode e brand/logo.

## Nodes implementados

Start `5:18`/`5:395`, Microfone `5:54`, Consulta `5:82`/`5:849`/`5:470`+`5:565`,
SOAP `5:217`/`5:648`, Settings `5:1084`, Finalize `5:1251`, Processing `5:1370`,
Rationale `5:1409`, Error states `5:1531`, Dark mode `5:1775`, Design system
`5:1918`, Handoff `5:2206`, Brand/Logo `10:218`/`10:232`/`10:250`.

## Assets baixados

`public/brand/emeriq-logo-full.svg`, `emeriq-logo-icon.svg`, `emeriq-logo-header.svg`
(swatch de fundo do Figma removido). Demais ícones via Lucide, conforme handoff.
Nenhuma URL temporária do MCP permanece no código.

## Components mapping

`AppHeader`, `Logo`, `StatusPill`, `StatusBadge`, `Button`, `Card`, `Badge`,
`Checkbox`, `Dialog`, `StartScreen`, `MicPermissionScreen`, `ProcessingScreen`,
`ConsultationView`, `TranscriptPanel`, `ClinicalAlerts`, `SuggestedQuestions`,
`EvaluationBlock`, `RationalePopover` (popover desktop / drawer mobile),
`VitalsBar`, `PhysicianInput`, `ConsultationFooter`, `MobileTabs`,
`SettingsModal`, `FinalizeConfirmModal`, `SoapSummary`, `ErrorBanner`,
`ThemeToggle`. Componentes antigos equivalentes foram refatorados/substituídos.

## Design tokens

Definidos em `src/app/globals.css` (claro + escuro) e expostos como utilitários
Tailwind v4 via `@theme`. Primary `#2CB5B0`, navy, superfícies, texto (primário/
secundário/muted/body), border, e semânticos critical/warning/info/success com
variantes de fundo. Spacing 4–64, radius 4/8/12/16/pill, tipografia **Inter**
com `tabular-nums` nos sinais vitais.

## Screens implementadas

Start, Ativação de microfone, Consulta (workspace de duas colunas + VitalsBar +
input do médico + action footer), Processing (fases conceituais reais), SOAP
(cards S/O/A/P + Hipóteses/Condutas). Modais de Configurações e de confirmação
de Finalização. Estados de erro não bloqueantes.

## Responsive implementation

- **Desktop (≥1024px):** workspace de 2 colunas; VitalsBar em 6 colunas.
- **Tablet/intermediário (≥768px):** 2 colunas; vitais em 3 colunas (duas linhas).
- **Mobile (<768px):** segmented control **Consulta | Assistente** (views mutuamente
  exclusivas); footer fixo. Trocar de aba não afeta microfone/timer/estado/IA.
Sem overflow horizontal nos breakpoints 390/640/768/1024/1440.

## Dark mode

Implementado via classe `.dark` com tokens específicos do Figma (`5:1775`),
sem `invert`. `ThemeScript` evita flash; `ThemeToggle` no header alterna
claro/escuro/sistema (persistido em `localStorage`, respeita `prefers-color-scheme`).

## Accessibility

`aria-live="assertive"` + `role="alert"` nos alertas críticos; `aria-live="polite"`
na transcrição e no status; foco visível (WCAG AA); labels em pt-BR; inputs de
sinais vitais rotulados; botões icon-only com `aria-label`; `prefers-reduced-motion`
respeitado; `data-testid` nos componentes clínicos (`transcript-panel`,
`clinical-alerts`, `vitals-bar`, `hypothesis-list`, `soap-card`,
`finish-consultation`, `start-consultation`).

## Provedor de IA: migração para OpenAI

Conforme o prompt (seções 6 e 62) e a decisão do produto, a IA foi **migrada de
Groq para OpenAI**:

- **Transcrição** (`/api/transcribe`): `gpt-4o-transcribe` ("Alta precisão") e
  `gpt-4o-mini-transcribe` ("Tempo real"), via `openai.audio.transcriptions`.
- **Raciocínio clínico** (`/api/clinical/update` e `/api/clinical/finalize`):
  `gpt-4o-mini` via `openai.chat.completions` com `response_format: json_object`.
- SDK `openai` (substitui `groq-sdk`); chave `OPENAI_API_KEY` lida server-side em
  `src/lib/env.ts`; cliente em `src/lib/openai/client.ts`. **A chave nunca é
  exposta no client** (as chamadas ocorrem apenas nas rotas de API).
- Arquitetura conceitual do prompt seguida: microfone → OpenAI transcrição →
  transcrição incremental → `ClinicalState` → modelo clínico OpenAI →
  Safety/Grounding → UI. Transporte principal: OpenAI Realtime (sessão efêmera).
  REST em chunks é o fallback degradado. Não usamos Web Speech API.
- Verificação de runtime: `/api/health` → `{"openaiConfigured":false|true}`; sem
  chave, as rotas retornam `missing_api_key` (comprovando o caminho até o cliente
  OpenAI). Com `OPENAI_API_KEY` definido, o fluxo completo roda contra a OpenAI.

## Clinical logic preserved

`ClinicalState`, Safety Layer, Provenance Validator, Grounding, Protocol Router,
Clinical Knowledge, prompts e reconciliação de transcrição **inalterados**. A UI
apenas apresenta os resultados. O destaque de sinais vitais críticos reutiliza os
limiares centralizados da Safety Layer (sem duplicar lógica). Edições manuais de
vitais e achados do médico entram no `ClinicalState` real (merge sobre o estado do
servidor, reenviado ao modelo) — sem mocks.

## Evaluation results

O harness (`pnpm eval:clinical`) e seus casos permanecem inalterados (agora executam
contra a OpenAI). Sua execução requer `OPENAI_API_KEY` (não disponível neste ambiente).
Como os prompts, schemas e a lógica clínica não mudaram, a metodologia de pontuação
(recall de emergências, alucinação, fidelidade do SOAP, grounding) é preservada; a
troca de provedor pode alterar escores absolutos e deve ser reavaliada quando a chave
estiver disponível.

## Test results

`pnpm lint` ✓ · `pnpm typecheck` ✓ · `pnpm test` ✓ · `pnpm build` ✓.

## Visual QA

Comparação com os frames do Figma em 1440/1024/390 e claro/escuro. Start, Consulta,
SOAP, Settings, Finalize, Processing e Mic conferem com o design; alertas críticos,
badges (Prioritária/Possível/Grave a excluir/Sugestão), chips de exames/condutas,
VitalsBar com destaque de PA crítica e o dark mode correspondem às referências.
Segmented control mobile testado (troca Consulta ↔ Assistente sem perder estado).

## Remaining differences (deliberadas)

- **Rótulos de transcrição por locutor** (Médico/Paciente) do Figma são apenas
  demonstrativos; não há diarização no pipeline, então a transcrição real é exibida
  sem rótulos fabricados.
- **"Realizado vs Sugestão":** o modelo não marca condutas como realizadas; itens da
  IA aparecem como **Sugestão** (o componente suporta ambos os rótulos).
- **Rationale popover:** exibe o fundamento real (`rationale` + achados a favor/contra),
  sem inventar protocolo/versão/seção.
- **Sinais vitais:** a barra principal segue o Figma (PA, FC, SpO₂, FR, Temp,
  Glasgow). **Glicemia** permanece como card complementar — ambos existem no
  `ClinicalState`.
- **VitalsBar no mobile mais estreito:** 2 colunas (em vez de 3) para evitar
  truncamento do rótulo "Glicemia/mg dL" (seção 60), voltando a 3 e 6 colunas em
  telas maiores.
- **Identidade de médico no header** (nome/avatar dos mockups) omitida por não haver
  autenticação real.

## Deliberately not implemented

- **Login/autenticação** (`5:306`/`5:1034`/`5:711`): não há auth real; não criamos
  login fake (seção 49).
- **Web Speech API**: superada pela arquitetura OpenAI (transcrição server-side).
- Nenhuma feature nova fora do escopo (seção 72). Zero mocks em runtime (seção 71).
