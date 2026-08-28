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

## Configuração

```bash
cp .env.example .env.local
```

Adicionar:

```env
GROQ_API_KEY=...
```

A chave permanece apenas no servidor. Nunca use `NEXT_PUBLIC_GROQ_API_KEY`.

## Rodar

```bash
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000), iniciar o atendimento e autorizar o microfone.

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
