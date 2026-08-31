# Realtime smoke test (manual)

Este checklist **não** é evaluation clínica. É infraestrutura de transcrição.

Não substitui `pnpm eval:clinical`.

Ambiente: navegador real, médico autenticado, uma consulta `active`, microfone concedido pelo usuário (não religar após refresh).

## Pré-condições

- Sessão Appwrite válida (cookie `emeriq_session`)
- `OPENAI_API_KEY` no server
- Permissão de microfone concedida **manualmente**
- Transporte: OpenAI Realtime (`gpt-4o-transcribe`)

## Passos

1. **partial** — falar continuamente ~10 s. Conferir texto parcial no painel (não persistido).
2. **confirmed** — pausar a fala. Conferir segmento confirmado no transcript.
3. **pause** — pausar captura. Nenhum áudio novo. Transcript permanece.
4. **resume** — retomar. Novos segmentos concatenam; não duplicar o confirmed anterior.
5. **disconnect** — cortar rede ~5 s durante fala. UI: reconectando. Áudio recente não some (ring buffer).
6. **reconnect** — rede volta em < 3 tentativas (500 ms, 1 s, 2 s). Estado `connected`. Buffer enviado se seguro.
7. **degraded fallback** — forçar falha Realtime após 3 tentativas. UI discreta: “Transcrição em modo de contingência”. Chunks REST. Sem fingir Realtime. WAV só neste modo.
8. **final flush** — finalizar atendimento. Aguardar segmentos accepted. SOAP. `transcription_integrity` complete ou partial. Se houver perda: “Um trecho do áudio não pôde ser transcrito.”

## Não esperado

- Loop infinito em “Reconectando”
- Microfone ligar sozinho após refresh
- Áudio persistido no Appwrite
- Partial transcript no banco

## Resultado

Preencher na hora do teste manual: data, browser, pass/fail por passo.
