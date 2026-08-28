import Groq from "groq-sdk";
import { AI_CONFIG } from "@/config/ai";
import { AppError } from "@/lib/errors";

let client: Groq | null = null;

export function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AppError(
      "GROQ_API_KEY não configurada no servidor.",
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
