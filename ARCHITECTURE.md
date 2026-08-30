# EmerIQ — Architecture (current)

Fonte de verdade da arquitetura vigente do EmerIQ. Em caso de divergência com
qualquer outro documento, **este arquivo prevalece**.

## AI Architecture

**OpenAI only.** A Groq **não é utilizada** em nenhum caminho operacional.

| Camada | Provider | Modelo | Onde |
| --- | --- | --- | --- |
| Transcrição (principal) | OpenAI | `gpt-4o-transcribe` | Realtime (WebSocket, sessão efêmera) |
| Transcrição (fallback degradado) | OpenAI | `gpt-4o-transcribe` / `gpt-4o-mini-transcribe` | `POST /api/transcribe` (chunks REST) |
| Raciocínio clínico | OpenAI | `gpt-4o-mini` | `POST /api/clinical/update` e `/api/clinical/finalize` |

- **Credencial:** `OPENAI_API_KEY`, **somente server-side**. Nunca chega ao
  browser. Não existe `NEXT_PUBLIC_OPENAI_API_KEY`.
- **Realtime:** o browser obtém uma **credencial efêmera** em
  `POST /api/realtime/session` (mintada no servidor com `OPENAI_API_KEY`) e conecta
  ao endpoint Realtime de transcrição da OpenAI. A chave permanente nunca é exposta.
- **Config central:** `src/config/ai.ts` (`AI_CONFIG.transcription`, `clinicalModel`, etc.).

## Pipeline

```
MICROFONE
  ↓ (áudio contínuo)
OpenAI Realtime transcription  ──(falha na init)──▶ Fallback REST (degraded mode)
  ↓ deltas → partialTranscript
  ↓ segmento finalizado → confirmedTranscript
ClinicalState  (apenas texto confirmado, com cadência/debounce)
  ↓
Clinical AI (OpenAI gpt-4o-mini, JSON estruturado)
  ↓
Safety Layer · Provenance · Grounding · Protocol Router
  ↓
Interface (Figma)
```

A **transcrição** e o **raciocínio clínico** são camadas separadas e intencionais:
o modelo Realtime só transcreve; a análise clínica é um passo distinto sobre o
texto **confirmado** (não reage a tokens provisórios).

## Estado clínico

`ClinicalState` (Zod, `src/lib/clinical/schemas.ts`) preserva a separação de
proveniência: relato do paciente, achados observados pelo médico, sinais vitais,
resultados de exames, inferências e sugestões da IA. Sinais vitais: PA, FC, SpO₂,
FR, Temperatura, **Glasgow** e Glicemia.

## Não faz parte da arquitetura

Groq, Web Speech API, banco de dados, autenticação de usuários, Supabase/Nhost/Redis,
RAG, agentes, dashboard, prontuário/pacientes/agenda, FHIR/HL7. Ver limites em
`DEPLOYMENT_SECURITY.md`.
