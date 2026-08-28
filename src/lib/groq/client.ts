import Groq from "groq-sdk";
import { AI_CONFIG } from "@/config/ai";
import { getGroqApiKey } from "@/lib/env";
import { AppError } from "@/lib/errors";

let client: Groq | null = null;

export function getGroqClient(): Groq {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new AppError(
      "GROQ_API_KEY não encontrada. Crie o arquivo .env.local na mesma pasta do package.json, em UTF-8, com a linha GROQ_API_KEY=gsk_... (sem aspas e sem espaço depois do =). Depois pare o servidor e rode pnpm dev de novo.",
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
