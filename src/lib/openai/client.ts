import OpenAI from "openai";
import { AI_CONFIG } from "@/config/ai";
import { getOpenAiApiKey } from "@/lib/env";
import { AppError } from "@/lib/errors";

let client: OpenAI | null = null;

export function getOpenAiClient(): OpenAI {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new AppError(
      "OPENAI_API_KEY não encontrada. No uso local, crie .env.local na pasta do package.json (UTF-8) com OPENAI_API_KEY=sk-... (sem aspas). No Netlify, defina OPENAI_API_KEY em Site configuration → Environment variables (Production e Preview) e faça um novo deploy.",
      "missing_api_key",
      500,
    );
  }

  if (!client) {
    client = new OpenAI({
      apiKey,
      timeout: AI_CONFIG.timeouts.clinicalFinalizeMs,
    });
  }

  return client;
}
