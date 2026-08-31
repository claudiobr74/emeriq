# AUTH_DATABASE_AUDIT

Auditoria pré-implementação (rodada Auth + isolamento + Realtime). Sem alterações de código neste arquivo.

## Appwrite SDK version

Não havia `node-appwrite` no `package.json` da base desta rodada. Persistência usava `fetch` REST (`X-Appwrite-Key`) em `src/lib/appwrite/consultations.ts`.

Esta rodada instala `node-appwrite` **28.0.0** (server-only) para Auth SSR oficial (`createEmailPasswordSession` + `client.setSession`). Sem SDK web no browser e sem segundo provedor de autenticação.

## Database configuration

- Endpoint default: `https://nyc.cloud.appwrite.io/v1`
- Project ID default: `6a94b9240022214b03fe`
- Database: `emeriq`
- Table: `consultations`
- Setup: `pnpm appwrite:setup` → `scripts/appwrite-setup.ts`
- `rowSecurity: false`, `permissions: []` (API key admin lê/escreve tudo)
- Sem índices de ownership

## Existing consultation schema

Colunas: `status` (`active` | `finalized`), `transcript`, `clinical_state`, `soap`, `finalize_warning`.

Ausentes: `owner_user_id`, `started_at`, `finalized_at`, `transcription_integrity`, `finalizing`/`discarded`.

CRUD: `createConsultation` / `getConsultation` / `updateConsultation` — sem filtro de usuário.

## Existing API routes

| Rota | Auth |
| --- | --- |
| `POST /api/consultations` | same-origin |
| `GET`/`PATCH /api/consultations/[id]` | same-origin |
| `POST /api/clinical/update` | same-origin |
| `POST /api/clinical/finalize` | same-origin |
| `POST /api/transcribe` | same-origin |
| `POST /api/realtime/session` | same-origin |
| `GET /api/health` | público |

Same-origin **não** é autenticação. Qualquer cliente na origem chama OpenAI e lê qualquer UUID.

## Current security model

- Sem `middleware.ts`
- Sem cookie de sessão
- Chave Appwrite só no servidor (bom)
- Sem isolamento entre médicos
- Deployment Protection da Vercel é a única barreira de rede documentada

## Current authentication

Inexistente. Sem `/login`, sem Account Appwrite, sem logout.

## Existing environment variables

`OPENAI_API_KEY`, `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, `APPWRITE_DATABASE_ID`, `APPWRITE_TABLE_ID`.

Não há `APPWRITE_ADMIN_API_KEY` separado. A mesma key faz schema e runtime.

## Realtime architecture

`RealtimeTranscriber` (WebSocket + credencial efêmera) + fallback REST.

Bug: `onFatal` marca `reconnecting` e chama `connectRealtime()`; se o reconnect falha, o catch só faz `return false` — o status fica eternamente em `reconnecting`.

WAV: `useAudioRecorder` gera chunks WAV mesmo com Realtime saudável (`enqueue` ignora no modo realtime, mas o encode ainda corre).

## Risks

1. Consultas de teste sem `owner_user_id` — não atribuir a usuários aleatórios.
2. `session.secret` vazio se login não usar API key com `sessions.write`.
3. Enum `status` existente precisa ganhar valores novos com cuidado.
4. Recovery de senha depende de SMTP no Appwrite Console.
5. `eval:clinical` depende de `OPENAI_API_KEY`.
