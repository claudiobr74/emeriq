import { AI_CONFIG } from "@/config/ai";
import {
  FINALIZE_SYSTEM_PROMPT,
  INCREMENTAL_SYSTEM_PROMPT,
  buildFinalizeUserPrompt,
  buildIncrementalUserPrompt,
} from "@/lib/clinical/prompts";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getGroqClient } from "@/lib/groq/client";
import type { ClinicalState, FinalClinicalReport } from "@/lib/clinical/schemas";
import {
  extractJsonObject,
  salvageClinicalState,
  salvageFinalReport,
} from "@/lib/clinical/parse";

export interface ClinicalUpdateInput {
  currentState: ClinicalState;
  confirmedTranscript: string;
  newSegment: string;
}

export interface ClinicalFinalizeInput {
  transcript: string;
  state: ClinicalState;
}

export interface ClinicalAIProvider {
  update(input: ClinicalUpdateInput): Promise<ClinicalState>;
  finalize(input: ClinicalFinalizeInput): Promise<FinalClinicalReport>;
}

function extractJsonText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: string }).text ?? "");
        }
        return "";
      })
      .join("\n");
  }
  return "";
}

function extractMessageJson(message: {
  content?: unknown;
  reasoning?: string | null;
} | undefined): string {
  const fromContent = extractJsonText(message?.content);
  if (fromContent.trim()) return fromContent;
  return message?.reasoning?.trim() ?? "";
}

function parseJsonPayload(text: string): unknown {
  return extractJsonObject(text);
}

function groqUserMessage(error: unknown): string {
  const status = (error as { status?: number }).status;
  const raw = error instanceof Error ? error.message : "";
  if (status === 413 || raw.includes("rate_limit_exceeded") || raw.includes("Request too large")) {
    return "O modelo clínico excedeu o limite de tokens da Groq. A gravação continua; nova tentativa em instantes.";
  }
  if (status === 429) {
    return "Limite de uso da Groq atingido. A gravação continua.";
  }
  if (status === 401 || status === 403) {
    return "Falha de autenticação com a Groq. Verifique GROQ_API_KEY.";
  }
  return "A análise clínica falhou. A gravação continua.";
}

async function completeJson<T>(input: {
  system: string;
  user: string;
  salvage: (raw: unknown) => T;
  reasoning: "low" | "medium" | "high";
  maxTokens: number;
  timeoutMs: number;
  label: "ClinicalUpdate" | "ClinicalFinalize";
}): Promise<T> {
  const groq = getGroqClient();

  const run = async () => {
    const response = await groq.chat.completions.create(
      {
        model: AI_CONFIG.clinicalModel,
        temperature: 0.2,
        reasoning_effort: input.reasoning,
        reasoning_format: "hidden",
        max_completion_tokens: input.maxTokens,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
        response_format: { type: "json_object" },
      },
      { timeout: input.timeoutMs },
    );

    const content = extractMessageJson(response.choices[0]?.message);
    const parsed = parseJsonPayload(content);
    return input.salvage(parsed);
  };

  try {
    return await run();
  } catch (error) {
    logger.clinicalUpdate(`${input.label} failed`, {
      message: error instanceof Error ? error.message.slice(0, 300) : "unknown",
    });
    throw new AppError(groqUserMessage(error), "clinical_model_failed", 502);
  }
}

export class GroqClinicalProvider implements ClinicalAIProvider {
  async update(input: ClinicalUpdateInput): Promise<ClinicalState> {
    logger.clinicalUpdate("request", {
      newChars: input.newSegment.length,
      transcriptChars: input.confirmedTranscript.length,
    });

    return completeJson({
      system: INCREMENTAL_SYSTEM_PROMPT,
      user: buildIncrementalUserPrompt({
        currentStateJson: JSON.stringify(input.currentState),
        confirmedTranscript: input.confirmedTranscript,
        newSegment: input.newSegment,
      }),
      salvage: salvageClinicalState,
      reasoning: AI_CONFIG.reasoning.update,
      maxTokens: AI_CONFIG.maxCompletionTokens.update,
      timeoutMs: AI_CONFIG.timeouts.clinicalUpdateMs,
      label: "ClinicalUpdate",
    });
  }

  async finalize(input: ClinicalFinalizeInput): Promise<FinalClinicalReport> {
    logger.clinicalFinalize("request", {
      transcriptChars: input.transcript.length,
    });

    return completeJson({
      system: FINALIZE_SYSTEM_PROMPT,
      user: buildFinalizeUserPrompt({
        currentStateJson: JSON.stringify(input.state),
        transcript: input.transcript,
      }),
      salvage: salvageFinalReport,
      reasoning: AI_CONFIG.reasoning.finalize,
      maxTokens: AI_CONFIG.maxCompletionTokens.finalize,
      timeoutMs: AI_CONFIG.timeouts.clinicalFinalizeMs,
      label: "ClinicalFinalize",
    });
  }
}

export const clinicalAIProvider: ClinicalAIProvider = new GroqClinicalProvider();
