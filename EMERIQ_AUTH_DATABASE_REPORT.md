# EMERIQ — Auth + Database + Realtime (relatório)

Rodada de consolidação: Appwrite Auth real, isolamento por médico, Login Figma e correções P0 de Realtime/Safety. Sem migração de backend, sem histórico, sem cadastro público.

## Architecture before

- Frontend Figma + OpenAI (Realtime + clínico) já operacionais.
- Appwrite TablesDB já persistia consultas via REST com **API key admin**.
- Sem Appwrite Auth, cookie ou `owner_user_id`.
- Proteção de API = same-origin (não é autenticação).
- Reconnect Realtime podia ficar eterno em “Reconectando”.
- Vitais/achados manuais não forçavam Clinical Update.
- Glasgow no ClinicalState, fora da Safety Layer.

## Appwrite Auth implementation

- E-mail + senha via `Account.createEmailPasswordSession` (`node-appwrite` 28).
- Sem OAuth, magic link, MFA ou cadastro público.
- Identidade: Appwrite User ID (`id`), `name`, `email`.
- Abstrações: `useAuth()` (client) e `requireUser()` / `getSessionUser()` (server).
- Recuperação de senha real: `POST /api/auth/recover` + `/recuperar`.

## Session strategy

- Cookie `emeriq_session` = `session.secret`.
- HttpOnly, Secure em produção/Vercel, SameSite=Lax, Path=/, expires = `session.expire`.
- Não há token em `localStorage`, query string ou HTML.
- Gate de cookie: `src/proxy.ts` (Next.js 16). Validação Appwrite: `requireUser()` nas APIs e nas pages.

## Figma Login

Arquivo `EucPNedxngcqVYMwhD64co`, via Figma MCP (`get_design_context` + screenshot):

| Layout | Node | Título / CTA |
| --- | --- | --- |
| Desktop | `5:306` | Entrar no EmerIQ / Entrar (não full-width) |
| Tablet | `5:1034` | Entrar no sistema / Entrar (full-width) |
| Mobile | `5:711` | Entrar no EmerIQ / Acessar sistema |

Layouts via CSS (desktop `min-[1024px]`, tablet `640–1023`, mobile `<640`) — sem `useLayoutMode` no primeiro paint, para não flashar o layout desktop em tablet/mobile. Formulário `method="post"` para não vazar e-mail na query se o JS falhar.

Estados: idle, submitting, success, invalid_credentials, network_error, rate_limited, unknown_error. Olho de senha conforme o Figma. “Esqueceu sua senha?” chama recovery real (não é link morto). Sem “Criar conta”. Sem status bar iOS fake.

## Protected routes

Público: `/login`, `/recuperar`, `/api/auth/login|logout|recover|recover/confirm`, `/api/health`, assets.

Protegido: `/`, APIs clínicas, consultas, transcribe, realtime session.

Sem cookie: páginas → `/login`; APIs → 401. Cookie presente em `/login` não redireciona no proxy (a page valida a sessão e só então vai para `/`).

## API authentication

Fluxo: request → `requireUser()` → `Account.get()` com a sessão → autorização → operação.

Same-origin permanece como CSRF auxiliar, **não** como autenticação.

Erros seguros: `{ error, code }`. Sem stack, sem Appwrite/OpenAI internals.

## User ownership

`owner_user_id` é sempre `authenticatedUser.id`. Payloads `ownerUserId` / `owner_user_id` do client são ignorados.

Helpers: `createConsultationForUser`, `getConsultationForUser`, `updateConsultationForUser`, `discardConsultationForUser`, `findActiveConsultationForUser`.

Médico B em consulta de A: **404** genérico.

## Database migration

Colunas novas (idempotentes, `pnpm appwrite:setup`): `owner_user_id`, `started_at`, `finalized_at`, `transcription_integrity`; enum `status` = `active | finalizing | finalized | discarded`.

Índices: `owner_user_id`, `status`, `owner_status` (`owner_user_id` + `status`).

Rows antigas com owner vazio **não** são atribuídas automaticamente.

Script explícito: `pnpm migrate:consultation-ownership --user=<APPWRITE_USER_ID>`.

## Row permissions

Setup liga `rowSecurity`. Create usa `read/update/delete(user:<id>)`. Runtime de consultas usa `X-Appwrite-Session`, não a admin key.

## Autosave

Debounce 4 s. Só `confirmed` transcript + ClinicalState da consulta `active`. Partial transcript e áudio não entram no banco.

## Active consultation recovery

No máximo 1 consulta `active` por usuário (409 se tentar outra).

Após refresh: modal “Existe um atendimento em andamento.” Continuar (phase `paused`, **sem** religar o mic) ou Descartar.

## Realtime reconnect fix

Estados: connecting / connected / reconnecting / degraded / failed.

Retries: 500 ms, 1 s, 2 s → modo de contingência REST. Sem loop infinito.

Ring buffer PCM (~4 s) durante reconnect. WAV só com `enableWavChunks` no modo degradado.

UI: “Transcrição em modo de contingência”.

## Manual clinical update fix

`setVital` e `addPhysicianFinding`: (1) atualizam ClinicalState, (2) Safety local, (3) alertas, (4) `runClinicalUpdate(true, true)` mesmo sem novo transcript.

API aceita `stateChanged` + transcript vazio.

## Glasgow Safety integration

`SafetyEvaluationInput.vitalSigns.glasgow`. Thresholds centralizados: GCS ≤ 8 critical, 9–12 high. Trigger `altered_level_of_consciousness` (não diagnóstico).

## Finalization integrity

Stop áudio → flush Realtime → ring/REST → segmentos accepted → Clinical Update → SOAP → persist `finalized` + `transcription_integrity`. Perda de áudio: “Um trecho do áudio não pôde ser transcrito.”

## Security tests

- Login válido (cookie HttpOnly) / inválido (sem leak Appwrite).
- Sem cookie / cookie rejeitado pelo Appwrite.
- Logout destrói sessão e zera cookie.
- Proxy: páginas → `/login`; APIs → 401.
- Create ignora `ownerUserId` do client.
- GET/PATCH/DELETE cross-user → 404 sem dados.
- Uma consulta active (409).
- APIs clínicas exigem sessão; update state-only autorizado.

Appwrite real **não** é chamado nos unitários (adapter mockado).

## Test results

| Gate | Resultado |
| --- | --- |
| `pnpm lint` | pass (0 errors) |
| `pnpm typecheck` | pass |
| `pnpm test` | pass — 36 files, 144 tests |
| `pnpm eval:clinical` | pass (exit 0) — 35 cases, 26 PASS / 9 FAIL, mean 89.3; o CLI só falha se **todos** os casos falham |
| `pnpm build` | pass — Next.js 16.3.3, Proxy (Middleware) ativo, rotas `/login` e `/api/auth/*` |

E2E (API, Appwrite real): login inválido 401 com mensagem segura; login válido define cookie HttpOnly; `ownerUserId` do client ignorado; 409 na segunda consulta `active`; GET/PATCH/DELETE cross-user 404; logout zera a sessão.

E2E (UI): `/` sem cookie → login Figma desktop; credenciais inválidas mostram “E-mail ou senha inválidos.”; sessão real abre a Start; Settings contém **Sair**. Layouts tablet/mobile batem nos nodes Figma. Microfone/Realtime no browser desta VM não foi exercitado (computerUse indisponível); o fluxo clínico de vitais/Glasgow está coberto por testes unitários da Safety Layer.

## Eval results

Harness OpenAI `gpt-4o-mini` (não é regressão de auth). SOAP fidelity 100%. Falhas pontuais: alucinação “intervenção sugerida como realizada” e misses de mustNotMiss. Variância do modelo clínico; fora do escopo desta rodada. Reexecução nesta rodada: mean 89.3 (26/35 PASS); execução anterior: mean 91.5 (28/35 PASS).

## Known limitations

- SMTP de recovery depende do Appwrite Console.
- Limitador de login é in-process (sem Redis).
- Cookie gate no proxy não valida a sessão (só presença); a validação ocorre em `requireUser` / `getSessionUser`.
- `APPWRITE_ADMIN_API_KEY` ainda é necessária no login SSR (`sessions.write`). Consultas runtime usam a sessão do médico.
- Microfone / OpenAI Realtime no browser desta VM não foi exercitado (computerUse indisponível). Safety de PA/Glasgow/achados está coberta por testes unitários.

## Not implemented

- Cadastro público, OAuth, Google, magic link, MFA.
- Histórico, pacientes, dashboard, prontuário.
- Persistência de áudio / partial transcript.
- Groq, Supabase, Clerk, Auth0, NextAuth.
- Header de perfil (avatar, CRM, hospital).
- Atribuição automática de consultas órfãs.
