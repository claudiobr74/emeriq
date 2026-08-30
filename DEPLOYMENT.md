# DEPLOYMENT

## Plataforma

O repositório inclui `netlify.toml` + `@netlify/plugin-nextjs` → alvo principal de
deploy é **Netlify**. As rotas são funções serverless (runtime Node.js).

## Variável de ambiente

| Nome | Escopo | Valor |
| --- | --- | --- |
| `OPENAI_API_KEY` | Production, Preview, Branch deploys | `sk-...` |

Nunca expor a chave no client (sem `NEXT_PUBLIC_*`). A transcrição Realtime usa
**credencial efêmera** mintada em `POST /api/realtime/session` (a chave permanente
fica server-side).

## Timeouts (coerentes por rota)

Cada rota declara `maxDuration` (segundos) coerente com o timeout do cliente OpenAI
(`src/config/ai.ts` → `AI_CONFIG.timeouts`, sempre um pouco abaixo do `maxDuration`
para falhar de forma controlada):

| Rota | `maxDuration` | Timeout cliente OpenAI |
| --- | ---: | ---: |
| `POST /api/transcribe` (fallback) | 30 s | 28 s |
| `POST /api/clinical/update` | 45 s | 43 s |
| `POST /api/clinical/finalize` | 60 s | 58 s |

Não há mais o conflito anterior (`maxDuration = 10` competindo com timeouts de
cliente de 45–65 s).

### Limites da plataforma

- **Netlify (Free/Starter):** funções têm teto de **10 s**. Nesse plano, apenas a
  transcrição **Realtime** (client → OpenAI, sem passar pela função) roda sem
  restrição de tempo; `clinical/update`/`finalize` podem exceder 10 s em casos
  longos. Para atendimentos completos, use **Netlify Pro** (teto de **26 s** após o
  suporte habilitar) ou uma plataforma que honre `maxDuration` maior (ex.: Vercel,
  até 60 s no plano adequado). O `netlify.toml` deste repo **não** deve reduzir isso.
- **Vercel:** `maxDuration` das rotas é honrado conforme o plano.

## Build

```bash
pnpm install
pnpm build   # Build command
# Publish directory: .next
```
