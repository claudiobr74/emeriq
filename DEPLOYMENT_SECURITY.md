# DEPLOYMENT_SECURITY

Práticas de segurança do MVP EmerIQ autenticado.

## Session model

- Autenticação: **Appwrite Auth** (e-mail + senha).
- Login: `POST /api/auth/login` cria sessão Appwrite no servidor
  (`Account.createEmailPasswordSession`) e grava o `session.secret` no cookie.
- Identidade: `Account.get()` após `client.setSession(secret)`.
- `ownerUserId` de consultas **nunca** vem do client: o servidor usa
  `authenticatedUser.id`.
- Logout: destrói a sessão Appwrite (`deleteSession current`), apaga o cookie e
  limpa estado clínico local.

## Cookie

| Atributo | Valor |
| --- | --- |
| Nome | `emeriq_session` |
| HttpOnly | true |
| Secure | true em produção / Vercel |
| SameSite | Lax |
| Path | `/` |
| Expiração | `session.expire` do Appwrite |

Não armazenar token em `localStorage`, query string, React state persistente ou HTML.

## Appwrite keys

| Variável | Uso | Browser |
| --- | --- | --- |
| `APPWRITE_ADMIN_API_KEY` | Schema, login SSR (`sessions.write`) | nunca |
| `APPWRITE_API_KEY` | Fallback legado da admin key | nunca |
| `APPWRITE_RUNTIME_API_KEY` | Opcional, menor privilégio; consultas preferem a sessão | nunca |
| `APPWRITE_PROJECT_ID` / `ENDPOINT` / `DATABASE_ID` / `TABLE_ID` | Identificadores de projeto | server-only neste app |

Não existe `NEXT_PUBLIC_APPWRITE_ADMIN_API_KEY` nem qualquer `NEXT_PUBLIC_*` de segredo.
A chave de admin **não** é usada para ler/escrever consultas em nome do médico.

`OPENAI_API_KEY` permanece somente no servidor. Realtime usa credencial efêmera.

## User isolation / ownership

- Toda consulta tem `owner_user_id` = Appwrite User ID.
- `getConsultationForUser` / `updateConsultationForUser` / `discardConsultationForUser`
  exigem `row.owner_user_id === authenticatedUser.id`.
- Falha de autorização: **404** genérico (`Não foi possível carregar o atendimento.`).
- Linhas antigas com `owner_user_id` vazio ficam inacessíveis.
- Migração explícita (não automática): `pnpm migrate:consultation-ownership --user=<id>`.

## Row permissions

Setup (`pnpm appwrite:setup`) ativa `rowSecurity` e permissões de tabela para
usuários autenticados. Cada row recebe:

`read/update/delete(user:<id>)`

Defesa em profundidade: permissões Appwrite **e** checagem no backend.

## Protected routes

Público: `/login`, `/recuperar`, `/api/auth/login`, `/api/auth/recover`,
`/api/auth/logout`, `/api/health`, assets.

Protegido (cookie ausente): páginas → `/login`; APIs → 401.

`src/proxy.ts` (Next.js 16) faz o gate de cookie. APIs clínicas ainda chamam
`requireUser()` e validam a sessão Appwrite. Same-origin **não** é autenticação.

## Production deployment protection

Manter **Vercel Deployment Protection** (ou equivalente) em previews. Não substitui
a sessão Appwrite, mas reduz exposição de deploys de teste.

## Limites

- Payload (`BODY_LIMITS`): JSON 512 KB, áudio 8 MB, transcrição 60 k chars.
- Uma consulta `active` por usuário.
- Limitador in-process no login (sem Redis).
- Sem stack traces ao client (`errorResponse`).
- Sem persistir áudio, partial transcript, chain-of-thought ou respostas brutas da IA.
