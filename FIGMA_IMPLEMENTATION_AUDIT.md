# FIGMA_IMPLEMENTATION_AUDIT

Auditoria pré-implementação da migração design-to-code do EmerIQ (PS Assist),
a partir do arquivo Figma oficial `EmerIQ — Clinical Assistant MVP`
(fileKey `EucPNedxngcqVYMwhD64co`).

## Stack encontrada

- **Next.js 16.3.3** (App Router, Turbopack) + **React 19.2.8** + **TypeScript 5**.
- **Tailwind CSS v4** (`@tailwindcss/postcss`), estilos utilitários.
- Gerenciador **pnpm 10.33.3**, Node 22.
- Primitivos de UI estilo shadcn/ui sobre **Radix** (`button`, `card`, `badge`,
  `checkbox`, `dialog`, `scroll-area`).
- Ícones **lucide-react**. Fonte atual **Geist/Geist Mono** (será trocada por **Inter**).
- Validação **Zod**. Testes **Vitest** (37 testes). Harness de avaliação em `evaluation/`.
- **State management**: React hooks próprios (`useClinicalSession`, `useTranscription`,
  `useAudioRecorder`). **Não** há Zustand — mantido conforme seção 50 (não regredir).

## Arquitetura atual

- `ConsultationApp` orquestra a máquina de estados:
  `idle → starting → listening → paused → finalizing → completed → error`.
- Áudio capturado em trechos curtos (`useAudioRecorder`, AudioWorklet/PCM) →
  `/api/transcribe` (Whisper via Groq) → transcrição incremental (`useTranscription`) →
  `/api/clinical/update` (raciocínio clínico) → `ClinicalState` → UI. Finalização em
  `/api/clinical/finalize` gera o SOAP (`FinalClinicalReport`).
- Camadas clínicas: **Safety Layer** determinística (`lib/clinical/safety`),
  **Provenance Validator** (`lib/clinical/provenance`), **Protocol Router** +
  **Clinical Knowledge** (`src/clinical-knowledge`), reconciliação de transcrição.

## Funcionalidades atuais

Transcrição em tempo real, análise clínica incremental, alertas, perguntas sugeridas,
hipóteses/diferenciais graves, exames, condutas, sinais vitais (extraídos da fala),
geração de SOAP, cópia de SOAP/resumo, configurações (transcrição, ritmo de análise,
toggles de exibição). Harness de avaliação (`pnpm eval:clinical`).

## Componentes existentes

`ConsultationHeader`, `IdleScreen`, `TranscriptPanel`, `ClinicalAssistantPanel`
(`ClinicalAlerts`, `SuggestedQuestions`, `EvaluationSections`/`HypothesisList`),
`ConsultationControls`, `FinalReport`, `SettingsDialog`. Primitivos `ui/*`.

## Nodes Figma mapeados

| Tela | Node |
| --- | --- |
| Design System | `5:1918` |
| Developer Handoff | `5:2206` |
| Start (desktop/tablet/mobile) | `5:18` / `5:810` / `5:395` |
| Microfone (desktop/mobile) | `5:54` / `5:438` |
| Consulta (desktop/tablet/mobile Consulta+Assistente) | `5:82` / `5:849` / `5:470` + `5:565` |
| SOAP (desktop/tablet/mobile) | `5:217` / `5:977` / `5:648` |
| Settings modal | `5:1084` |
| Finalize modal | `5:1251` |
| Processing | `5:1370` |
| Rationale popover | `5:1409` |
| Error states | `5:1531` |
| Dark mode | `5:1775` |
| Brand / Logo | `5:1652` / `10:218`,`10:232`,`10:250` |

## Design tokens (valores reais extraídos do Figma)

Primary `#2CB5B0` · Primary dark `#1B8F8B` · Navy `#1B2B4B` (logo `#152F4C`).
BG `#F7F9FB` · Surface `#FFFFFF` · Text `#111625` · Text secondary `#6B7A8D` ·
Muted/labels `#8A99AD` · Body `#4E5D78` · Border `#E1E6EB`.
Critical `#D32F2F`/bg `#FDF2F2` · Warning `#ED6C02`/bg `#FFF8F2` ·
Info `#0288D1`/bg `#F0F9FF` · Success `#2E9E5B`/bg `#EAF7EF`.
Dark: BG `#0F1419` · Surface `#1A2029` · Text `#E8ECF0` · Border `#2A3040`
(+ variantes claras de critical/warning/info/success). Spacing 4→64, radius 4/8/12/16/pill,
tipografia **Inter** (Display 32 / H1 24 / H2 20 / H3 16 / Body 14 / Small 12 / Caption 11),
`tabular-nums` para sinais vitais.

## Assets necessários

Logo oficial baixado e versionado em `public/brand/`:
`emeriq-logo-full.svg`, `emeriq-logo-icon.svg`, `emeriq-logo-header.svg`
(swatch de fundo do Figma removido). Ícones genéricos reutilizam Lucide conforme handoff.

## Component mapping (Figma → código)

| Figma | Código |
| --- | --- |
| Global header | `AppHeader` (substitui `ConsultationHeader`) |
| StatusPill (Ouvindo/Pausado/...) | `StatusPill` |
| StatusBadge (Prioritária/Possível/Grave a excluir/Sugestão) | `StatusBadge` |
| Logo/Header | `Logo` (asset oficial) |
| Start screen | `StartScreen` (substitui `IdleScreen`) |
| Microphone state | `MicPermissionScreen` |
| Transcription column | `TranscriptPanel` |
| Critical alerts | `ClinicalAlerts` |
| Verification items | `SuggestedQuestions` |
| Evaluation block | `EvaluationBlock` + `RationalePopover`/`RationaleDrawer` |
| Vitals row | `VitalsBar` (edição inline) |
| Clinical input | `PhysicianInput` |
| Action footer | `ConsultationFooter` |
| Mobile Consulta/Assistente | `MobileTabs` (segmented control) |
| Settings modal | `SettingsModal` |
| Finalize modal | `FinalizeConfirmModal` |
| Processing | `ProcessingScreen` |
| SOAP summary | `SoapSummary` (substitui `FinalReport`) |
| Error states | `ErrorState` + banners |

## Rotas

Mantém a arquitetura de página única existente (`/` com máquina de estados) — o roteamento
conceitual do Figma (`/consulta`, `/consulta/processando`, `/consulta/resumo`) é
representado por estados internos, reduzindo risco de regressão (seção 57 permite adaptar).

## Riscos de regressão

- Pipeline clínico é dirigido pelo servidor; edição manual de vitais/achados precisa
  de merge cuidadoso para não ser sobrescrita nem quebrar o envio ao modelo.
- Troca de fonte/tokens não pode alterar layout de forma a truncar informação clínica.
- Dark mode via classe `.dark`, sem `invert`.

## Conflitos entre Figma e código

- **Provedor de IA:** o Figma / guia técnico menciona **Web Speech API** (superada). O MVP
  usava **Groq**, mas por decisão do produto **a IA foi migrada para OpenAI** (transcrição
  `gpt-4o-transcribe`/`gpt-4o-mini-transcribe` e raciocínio `gpt-4o-mini` via SDK `openai`,
  `OPENAI_API_KEY`). A arquitetura conceitual do prompt (microfone → OpenAI transcrição →
  transcrição incremental → ClinicalState → modelo clínico OpenAI → Safety/Grounding → UI)
  foi seguida. Não usamos Web Speech API. A chave nunca é exposta no client (fica nas rotas
  server-side). Mantida a arquitetura de chunks REST (transcrição incremental); a Realtime
  API fica como evolução futura.
- **SOAP "Realizado vs Sugestão":** o modelo de dados não marca condutas como *realizadas*.
  Como "sugestão da IA não pode aparecer como intervenção realizada" (seção 42), itens
  gerados pela IA são rotulados **Sugestão**; a UI suporta ambos os rótulos, mas em runtime
  só aparece o que os dados reais suportam.
- **Rationale popover:** o modelo não expõe protocolo/versão/seção por hipótese. O popover
  mostra o **fundamento real** (`rationale` + achados a favor/contra) sem inventar referência.
- **Login:** não há autenticação real no projeto. Conforme seção 49, **não** criamos login
  fake; a tela de login fica fora do fluxo ativo. O cabeçalho não exibe identidade de médico
  fictícia.

## Decisões de preservação

- `ClinicalState`, Safety, Provenance, Grounding, Protocol Router, SOAP, prompts clínicos e
  Evaluation Harness **inalterados** em comportamento; apenas o provedor de IA passou de
  Groq para **OpenAI** (transcrição + raciocínio), preservando o contrato JSON estruturado.
- Sem novas dependências de estado (sem Zustand). Sem features novas (seção 72). Zero mocks
  em runtime (seção 71): todo dado visível vem do estado real; dados demonstrativos do Figma
  não entram em produção.
