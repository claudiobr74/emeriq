# DEPLOYMENT_SECURITY

Práticas de segurança do MVP EmerIQ. **Não** há sistema de usuários nesta rodada;
o objetivo é reduzir exposição acidental, não implementar autenticação completa.

## Segredos

- `OPENAI_API_KEY` é lida **somente no servidor** (`src/lib/env.ts`). Nunca é enviada
  ao browser. Não existe `NEXT_PUBLIC_OPENAI_API_KEY`.
- `APPWRITE_API_KEY` e `APPWRITE_PROJECT_ID` também são server-only. Não existe
  `NEXT_PUBLIC_APPWRITE_*`. O browser só fala com `/api/consultations`.
- A transcrição Realtime usa **credencial efêmera** criada em
  `POST /api/realtime/session` (a chave permanente é usada só para mintar a efêmera).
- Nada de segredo em `localStorage`, `sessionStorage`, HTML, bundle JS ou query string.

## Endpoints (hardening)

Todas as rotas de API (`/api/transcribe`, `/api/clinical/update`,
`/api/clinical/finalize`, `/api/realtime/session`, `/api/consultations`):

- Aceitam apenas **POST** (método único exportado).
- **Same-origin check** (`ensureSameOrigin`): rejeita origem cruzada com 403.
- **Content-Type** `application/json` exigido nas rotas JSON (415 caso contrário).
- **Limites de payload** (`src/lib/http.ts` → `BODY_LIMITS`): JSON 512 KB, áudio 8 MB,
  transcrição 60 k caracteres, novo segmento 12 k caracteres (413 ao exceder).
- **Validação Zod** dos corpos clínicos (400 em payload inválido).
- **Sem stack traces** ao cliente: `errorResponse` devolve apenas mensagem + código estável.

## Proteção de acesso em deploy de teste

Um deploy de teste/preview deve usar a **proteção de acesso da plataforma** quando
disponível (ex.: Netlify **Password protection** / **Visitor access controls**, ou
Vercel **Deployment Protection**). Isso evita que o endpoint vire um proxy aberto da
OpenAI enquanto não há autenticação de aplicação.

## Limites de uso da IA

Ver `DEPLOYMENT.md` para timeouts por rota. Os limites de payload acima evitam que
`/api/*` seja usado como proxy irrestrito. Não há rate-limiting de aplicação nesta
rodada — combine com a proteção de acesso da plataforma.
