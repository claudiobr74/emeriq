# PS Assist

Assistente clínica em tempo real para pronto-socorro: ouvir, transcrever, organizar o raciocínio e documentar um SOAP.

Ferramenta de apoio ao profissional médico. Não substitui julgamento clínico.

## Pré-requisitos

- Node.js 20 ou superior (recomendado 22)
- pnpm
- chave da Groq (`GROQ_API_KEY`)

## Uso local

```bash
git clone https://github.com/claudiobr74/emeriq.git
cd emeriq
pnpm install
printf 'GROQ_API_KEY=gsk_COLE_SUA_CHAVE_AQUI\n' > .env.local
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

Confira a chave sem expô-la: [http://localhost:3000/api/health](http://localhost:3000/api/health) deve retornar `{"groqConfigured":true}`.

A chave fica só no `.env.local`. Nunca use `NEXT_PUBLIC_GROQ_API_KEY` e não faça commit desse arquivo.

## Deploy no Netlify (via GitHub)

O repositório já inclui `netlify.toml` (Node 22, pnpm, hoist para Next.js). O adapter Next.js do Netlify é aplicado automaticamente — não instale `@netlify/plugin-nextjs` no projeto.

1. Faça merge da branch de trabalho em `main` (há um pull request aberto).
2. No [Netlify](https://app.netlify.com): **Add new site → Import an existing project → GitHub → `claudiobr74/emeriq`**.
   - Branch de produção: `main`
   - Build command: `pnpm run build` (já vem do `netlify.toml`)
   - Publish directory: deixe o Netlify detectar (Next.js)
3. Em **Site configuration → Environment variables**, crie:

   | Nome | Valor |
   |---|---|
   | `GROQ_API_KEY` | sua chave `gsk_...` |

   Escopo: **Production**, **Preview** e **Branch deploys**. Depois clique em **Trigger deploy → Deploy site**.
4. A URL `https://….netlify.app` já é HTTPS (necessário para o microfone).
5. Confira `https://SEU-SITE.netlify.app/api/health` → `{"groqConfigured":true}`.

Não cole a chave no repositório, em `netlify.toml` nem em variável `NEXT_PUBLIC_*`.

Se o site já estiver conectado ao GitHub, só falta a variável `GROQ_API_KEY` e um deploy a partir de `main`.

### Timeout das APIs no Netlify

As rotas `/api/transcribe`, `/api/clinical/update` e `/api/clinical/finalize` rodam em funções serverless.

- plano gratuito / Starter: **10 segundos** (padrão; não altere isso no `netlify.toml`)
- plano Pro: até **26 segundos**, só depois que o suporte da Netlify ativar o teto na conta

A transcrição em trechos curtos e a análise clínica costumam caber em 10s. Se aparecer 504, rode localmente com `pnpm dev` ou peça o aumento no plano Pro.

## Scripts

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Limitações atuais

- Sem persistência: recarregar a página encerra o atendimento.
- Sem autenticação e sem múltiplos usuários.
- Sem banco de dados, RAG ou protocolos institucionais.
- Sem integração com prontuário, agenda ou prescrição eletrônica.
- Áudio e transcrição não são armazenados.
- Uso inicial para avaliação controlada por profissionais.

## Como funciona

O navegador captura o microfone em trechos curtos, envia cada trecho para `/api/transcribe` (Groq Whisper) e atualiza o estado clínico em `/api/clinical/update`. Ao finalizar, `/api/clinical/finalize` gera o SOAP.
