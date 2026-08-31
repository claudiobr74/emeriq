/**
 * Glossário antigo enviado como `prompt` do Whisper/Realtime.
 * O modelo ecoava esse texto na transcrição (não é fala). Não enviar à API.
 * Mantido para `stripTranscriptionLeak` reconhecer vazamentos já gravados.
 */
export const WHISPER_PROMPT =
  "Consulta médica de pronto-socorro em português do Brasil. Termos frequentes: dispneia, síncope, dor torácica, saturação, hipertensão, hipotensão, diabetes, anticoagulante, ECG.";
