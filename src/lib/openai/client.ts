import OpenAI from "openai";
import { AI_CONFIG } from "@/config/ai";
import { getOpenAiApiKey, missingOpenAiKeyMessage } from "@/lib/env";
import { AppError } from "@/lib/errors";

let client: OpenAI | null = null;

export function getOpenAiClient(): OpenAI {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new AppError(
      missingOpenAiKeyMessage(),
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
