# EmerIQ — Architecture (current)

Fonte de verdade da arquitetura vigente do EmerIQ. Em caso de divergência com
qualquer outro documento, **este arquivo prevalece**.

## Authentication

**Appwrite Auth.** Sessão e-mail + senha. Sem cadastro público, OAuth, magic link
ou MFA nesta versão. Usuários são provisionados no Appwrite Console.

A sessão vive no cookie HttpOnly `emeriq_session` (Secure em produção, SameSite=Lax,
Path=/). O browser não guarda token em `localStorage`, query string ou HTML.

## Database

**Appwrite TablesDB.** Database `emeriq`, tabela `consultations`. Cada consulta
pertence a `owner_user_id` = Appwrite User ID do médico autenticado. Linhas
antigas sem dono permanecem inacessíveis. Sem página de histórico, pacientes ou
dashboard.

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
APPWRITE AUTH
  ↓
MÉDICO AUTENTICADO
  ↓
MICROFONE (efêmero; nunca persistido)
  ↓ (áudio contínuo)
OpenAI Realtime transcription  ──(retries limitados)──▶ Fallback REST (contingência)
  ↓ deltas → partialTranscript (não persistido)
  ↓ segmento finalizado → confirmedTranscript
ClinicalState
  ↓
Safety Layer (local, imediata) · Clinical AI · Provenance · Protocol Router
  ↓
APPWRITE DATABASE (consulta do médico)
  ↓
SOAP final
```

A **transcrição** e o **raciocínio clínico** são camadas separadas: o modelo
Realtime só transcreve; a análise clínica usa texto **confirmado** e também
aceita atualização só de estado (vitais/achados manuais).

## Audio storage

**none.** Áudio é efêmero. Não há Appwrite Storage, WAV persistido nem PCM em disco.

## Estado clínico

`ClinicalState` (Zod, `src/lib/clinical/schemas.ts`) preserva a separação de
proveniência: relato do paciente, achados observados pelo médico, sinais vitais,
resultados de exames, inferências e sugestões da IA. Sinais vitais: PA, FC, SpO₂,
FR, Temperatura, **Glasgow** e Glicemia. Glasgow alimenta a Safety Layer
(`altered_level_of_consciousness`) — trigger, não diagnóstico.

## Não faz parte da arquitetura

Groq, Web Speech API, Supabase, Firebase, Clerk, Auth0, NextAuth, Nhost/Redis,
RAG, agentes, dashboard, prontuário/pacientes/agenda, FHIR/HL7, cadastro público.
Ver limites em `DEPLOYMENT_SECURITY.md`.

Documentos históricos (não operacionais) estão em `docs/archive/` e em
`CORRECTIVE_AUDIT_BEFORE.md`.
