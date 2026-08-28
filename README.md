# PS Assist

Assistente clínica em tempo real para pronto-socorro: ouvir, transcrever, organizar o raciocínio e documentar um SOAP.

Ferramenta de apoio ao profissional médico. Não substitui julgamento clínico.

## Pré-requisitos

- Node.js 20 ou superior
- pnpm

## Instalação

```bash
pnpm install
```

## Configuração (macOS)

A chave **não vai para o GitHub**. Ela fica só no Mac, no arquivo `.env.local`, **na mesma pasta do `package.json`**.

No Terminal:

```bash
cd ~/emeriq
ls package.json
```

Se `package.json` não aparecer, você não está na pasta certa. Use `pwd` e entre na pasta do clone.

Grave a chave **nessa pasta** (não use o TextEdit):

```bash
printf 'GROQ_API_KEY=gsk_COLE_SUA_CHAVE_AQUI\n' > .env.local
ls -a .env.local package.json
grep -E '^GROQ_API_KEY=gsk_.+' .env.local && echo "ok, gravou" || echo "ainda vazio"
```

Sem aspas, sem espaço depois do `=`. Nunca use `NEXT_PUBLIC_GROQ_API_KEY`.

Pare o servidor (Ctrl+C) e suba de novo **na mesma pasta**:

```bash
pnpm dev
```

Confira em [http://localhost:3000/api/health](http://localhost:3000/api/health): deve aparecer `{"groqConfigured":true}`.

## Rodar

```bash
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000). Para conferir a chave sem expô-la, abra também [http://localhost:3000/api/health](http://localhost:3000/api/health): deve aparecer `{"groqConfigured":true}`.

Inicie o atendimento e autorize o microfone.

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
