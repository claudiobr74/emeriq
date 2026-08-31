# EmerIQ

Assistente clínica em tempo real para pronto-socorro: ouvir, transcrever, organizar o raciocínio e documentar um SOAP.

Ferramenta de apoio ao profissional médico. Não substitui julgamento clínico.

## AI Architecture

**OpenAI only.** (fonte de verdade: `ARCHITECTURE.md`)

- **Transcription:** OpenAI Realtime transcription (`gpt-4o-transcribe`), com fallback
  degradado para `POST /api/transcribe` (chunks REST) se a sessão Realtime falhar.
- **Clinical reasoning:** OpenAI (`gpt-4o-mini`).
- **Groq:** not used.
- A `OPENAI_API_KEY` fica só no servidor; o browser usa uma credencial efêmera
  (`POST /api/realtime/session`). Ver `DEPLOYMENT.md` e `DEPLOYMENT_SECURITY.md`.

## Pré-requisitos

- Node.js 20 ou superior (recomendado 22)
- pnpm
- chave da OpenAI (`OPENAI_API_KEY`)

## Uso local

```bash
git clone https://github.com/claudiobr74/emeriq.git
cd emeriq
pnpm install
printf 'OPENAI_API_KEY=sk-COLE_SUA_CHAVE_AQUI\n' > .env.local
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

Confira a chave sem expô-la: [http://localhost:3000/api/health](http://localhost:3000/api/health) deve retornar `{"openaiConfigured":true}`.

A chave fica só no `.env.local`. Nunca use `NEXT_PUBLIC_OPENAI_API_KEY` e não faça commit desse arquivo.

## Deploy no Vercel (via GitHub)

1. Branch de produção: `main` (ou o branch ligado ao projeto).
2. No [Vercel](https://vercel.com): **Add New → Project → `claudiobr74/emeriq`**.
   - Framework: Next.js
   - Build command: `pnpm run build`
   - Install: `pnpm install`
3. Environment Variables:

   | Nome | Valor |
   |---|---|
   | `OPENAI_API_KEY` | sua chave `sk-...` |
   | `APPWRITE_ENDPOINT` | `https://nyc.cloud.appwrite.io/v1` |
   | `APPWRITE_PROJECT_ID` | `6a94b9240022214b03fe` |
   | `APPWRITE_API_KEY` | API key server-only (nunca `NEXT_PUBLIC_*`) |

4. Escopo das variáveis: **Production**, **Preview** e **Development**.
   Depois **Redeploy** o deployment que você está usando. Chaves do
   Cloud Agent / Cursor **não** entram automaticamente na Vercel.
5. No Appwrite Console: crie o projeto e uma API key com `tables.write`,
   `columns.write`, `rows.read` e `rows.write`. Depois rode `pnpm appwrite:setup`.
6. Confira `https://SEU-PROJETO.vercel.app/api/health` →
   `{"openaiConfigured":true,"appwriteConfigured":true}`.
7. Ative **Deployment Protection** (Vercel Authentication) enquanto não houver
   login na aplicação — evita proxy aberto da OpenAI.

A URL `https://….vercel.app` já é HTTPS (necessário para o microfone).

## Deploy no Netlify (via GitHub)

O repositório inclui `netlify.toml` (Node 22, pnpm) e o plugin `@netlify/plugin-nextjs`. Sem esse plugin o Netlify publica a pasta errada e a home vira o 404 padrão (“Page not found”).

1. Branch de produção: `main`.
2. No [Netlify](https://app.netlify.com): **Add new site → Import an existing project → GitHub → `claudiobr74/emeriq`**.
   - Build command: `pnpm run build`
   - Publish directory: `.next`
3. Em **Site configuration → Environment variables**, crie:

   | Nome | Valor |
   |---|---|
   | `OPENAI_API_KEY` | sua chave `sk-...` |

   Escopo: **Production**, **Preview** e **Branch deploys**. Depois clique em **Trigger deploy → Deploy site**.
4. A URL `https://….netlify.app` já é HTTPS (necessário para o microfone).
5. Confira `https://SEU-SITE.netlify.app/api/health` → `{"openaiConfigured":true}`.

Não cole a chave no repositório, em `netlify.toml` nem em variável `NEXT_PUBLIC_*`.

Se o site já estiver conectado ao GitHub, confirme **Publish directory = `.next`**, a variável `OPENAI_API_KEY` e um **Trigger deploy** a partir de `main`.

Se aparecer “Page not found” da Netlify, o runtime do Next.js não está ativo: o `netlify.toml` deste repo já corrige isso. Faça um novo deploy depois do merge.

### Timeout das APIs no Netlify

As rotas rodam em funções serverless com `maxDuration` coerente (30/45/60 s) — ver
`DEPLOYMENT.md` para a tabela e os tetos por plano. No plano gratuito/Starter da
Netlify há teto de **10 s**; a transcrição principal é **Realtime** (client → OpenAI,
sem passar pela função), então não sofre esse teto. Para atendimentos longos use
Netlify Pro (26 s) ou plataforma que honre `maxDuration` maior.

## Scripts

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm eval:clinical
pnpm build
```

## Clinical Safety Layer

Camada determinística (sem LLM) em `src/lib/clinical/safety/`. Lê transcrição e sinais vitais **explicitamente informados** e gera `systemSafetyTriggers` internos (`high_risk_chest_pain`, `hypoxemia`, etc.). Triggers não são diagnósticos: forçam reavaliação clínica e entram no prompt. Alertas na tela vêm da IA (`alerts`). Limiares numéricos ficam em `safety/thresholds.ts`.

## Clinical Knowledge

Protocolos curtos em `src/clinical-knowledge/*.md`. O router escolhe no máximo 1–3 documentos por chamada (palavras-chave + triggers). São material de apoio, não verdade absoluta. Se o arquivo não carregar, o atendimento continua.

## Evaluation Harness

Ferramenta de desenvolvimento, sem botão na interface.

```bash
pnpm eval:clinical
```

Requer `OPENAI_API_KEY`. Processa os casos de `evaluation/cases` de forma incremental, pontua recall de emergências, alucinação e fidelidade do SOAP.

A OpenAI aplica limites de taxa (RPM/TPM) por modelo e conta. Uma corrida completa de ~35 casos pode esbarrar nesses limites. Use `EVAL_RESUME=1` para retomar ou `EVAL_FILTER` / `EVAL_LIMIT` para subconjuntos.

Relatórios:

- `evaluation/reports/latest.json`
- `evaluation/reports/latest.md`

Opcional: `EVAL_LIMIT=5`, `EVAL_FILTER=chest-pain,thunderclap` ou `EVAL_RESUME=1` (reaproveita casos PASS do `latest.json`).

## Limitações atuais

- Persistência opcional no Appwrite (atendimento corrente + SOAP). Sem as
  variáveis, recarregar a página encerra o atendimento.
- Sem autenticação e sem múltiplos usuários.
- Sem RAG vetorial ou embeddings.
- Sem integração com prontuário, agenda ou prescrição eletrônica.
- Áudio e transcrição não são armazenados.
- Uso inicial para avaliação controlada por profissionais.

## Como funciona

O navegador captura o microfone de forma contínua e transcreve via **OpenAI Realtime** (sessão efêmera em `/api/realtime/session`; a chave permanente não chega ao browser). Tokens provisórios aparecem como transcrição parcial; só o texto **confirmado** alimenta `/api/clinical/update` (OpenAI `gpt-4o-mini`). Se o Realtime falhar, o app cai para `/api/transcribe` em trechos (modo degradado). Ao finalizar, o último áudio é aguardado e `/api/clinical/finalize` gera o SOAP.
