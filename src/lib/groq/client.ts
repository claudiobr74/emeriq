import Groq from "groq-sdk";
import { AI_CONFIG } from "@/config/ai";
import { getGroqApiKey } from "@/lib/env";
import { AppError } from "@/lib/errors";

let client: Groq | null = null;

export function getGroqClient(): Groq {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new AppError(
      "GROQ_API_KEY não encontrada. No uso local, crie .env.local na pasta do package.json (UTF-8) com GROQ_API_KEY=gsk_... (sem aspas). No Netlify, defina GROQ_API_KEY em Site configuration → Environment variables (Production e Preview) e faça um novo deploy.",
      "missing_api_key",
      500,
    );
  }

  if (!client) {
    client = new Groq({
      apiKey,
      timeout: AI_CONFIG.timeouts.clinicalFinalizeMs,
    });
  }

  return client;
}
