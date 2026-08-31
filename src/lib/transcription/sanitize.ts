import { WHISPER_PROMPT } from "@/lib/clinical/prompts";

const LEAK_SENTENCE =
  "Consulta médica de pronto-socorro em português do Brasil.";
const LEAK_GLOSSARY = /Termos frequentes:[^.]*\.?/gi;

/** Remove eco do prompt de vocabulário que o Whisper/Realtime devolve como fala. */
export function stripTranscriptionLeak(
  text: string,
  mode: "partial" | "final" = "final",
): string {
  if (!text) return "";
  let out = text;
  if (WHISPER_PROMPT) {
    out = out.split(WHISPER_PROMPT).join(" ");
  }
  out = out.split(LEAK_SENTENCE).join(" ");
  out = out.replace(LEAK_GLOSSARY, " ");
  out = out.replace(/\s+/g, " ");
  if (mode === "partial") {
    return out.replace(/^\s+/, "");
  }
  return out.trim();
}
