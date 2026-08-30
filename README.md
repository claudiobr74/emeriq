# EmerIQ

Assistente clínica em tempo real para pronto-socorro: ouvir, transcrever, organizar o raciocínio e documentar um SOAP.

Ferramenta de apoio ao profissional médico. Não substitui julgamento clínico.

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

As rotas `/api/transcribe`, `/api/clinical/update` e `/api/clinical/finalize` rodam em funções serverless.

- plano gratuito / Starter: **10 segundos** (padrão; não altere isso no `netlify.toml`)
- plano Pro: até **26 segundos**, só depois que o suporte da Netlify ativar o teto na conta

A transcrição em trechos curtos e a análise clínica costumam caber em 10s. Se aparecer 504, rode localmente com `pnpm dev` ou peça o aumento no plano Pro.

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

- Sem persistência: recarregar a página encerra o atendimento.
- Sem autenticação e sem múltiplos usuários.
- Sem banco de dados, RAG vetorial ou embeddings.
- Sem integração com prontuário, agenda ou prescrição eletrônica.
- Áudio e transcrição não são armazenados.
- Uso inicial para avaliação controlada por profissionais.

## Como funciona

O navegador captura o microfone em trechos curtos, envia cada trecho para `/api/transcribe` (OpenAI `gpt-4o-transcribe`) e atualiza o estado clínico em `/api/clinical/update` (OpenAI `gpt-4o-mini`). Ao finalizar, `/api/clinical/finalize` gera o SOAP.
