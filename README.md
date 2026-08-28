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

1. No GitHub, use a branch `main` deste repositório.
2. No [Netlify](https://app.netlify.com): **Add new site → Import an existing project → GitHub → `claudiobr74/emeriq`**.
3. Build settings (já vêm do `netlify.toml`):
   - Build command: `pnpm run build`
   - O adapter Next.js do Netlify é aplicado automaticamente.
4. Em **Site configuration → Environment variables**, crie:

   | Nome | Valor |
   |---|---|
   | `GROQ_API_KEY` | sua chave `gsk_...` |

   Escopo: **Production**, **Preview** e **Branch deploys**.
5. Deploy. A URL `https://….netlify.app` já é HTTPS (necessário para o microfone).
6. Confira `https://SEU-SITE.netlify.app/api/health` → `{"groqConfigured":true}`.

Não cole a chave no repositório, em `netlify.toml` nem em variável `NEXT_PUBLIC_*`.

### Timeout das APIs no Netlify

As rotas `/api/transcribe`, `/api/clinical/update` e `/api/clinical/finalize` rodam em funções serverless.

- plano gratuito: cerca de **10 segundos**
- plano Pro: até **26 segundos** (`timeout = 26` no `netlify.toml`)

A análise clínica costuma caber nesse tempo. Se aparecer 504 no deploy, use o plano Pro ou rode localmente com `pnpm dev`.

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
