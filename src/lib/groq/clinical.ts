import { z } from "zod";
import { AI_CONFIG } from "@/config/ai";
import {
  FINALIZE_SYSTEM_PROMPT,
  INCREMENTAL_SYSTEM_PROMPT,
  buildFinalizeUserPrompt,
  buildIncrementalUserPrompt,
} from "@/lib/clinical/prompts";
import {
  clinicalStateJsonSchema,
  finalReportJsonSchema,
} from "@/lib/clinical/json-schema";
import {
  clinicalStateSchema,
  finalClinicalReportSchema,
  type ClinicalState,
  type FinalClinicalReport,
} from "@/lib/clinical/schemas";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getGroqClient } from "@/lib/groq/client";
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

async function completeJson<T>(input: {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
  zodSchema: z.ZodType<T>;
  salvage: (raw: unknown) => T;
  reasoning: "low" | "medium" | "high" | "none";
  maxTokens: number;
  timeoutMs: number;
  label: "ClinicalUpdate" | "ClinicalFinalize";
}): Promise<T> {
  const groq = getGroqClient();

  const run = async (extraUser?: string, useSchema = true) => {
    const response = await groq.chat.completions.create(
      {
        model: AI_CONFIG.clinicalModel,
        temperature: 0.2,
        reasoning_effort: input.reasoning,
        reasoning_format: "hidden",
        max_completion_tokens: input.maxTokens,
        messages: [
          { role: "system", content: input.system },
          {
            role: "user",
            content: extraUser ? `${input.user}\n\n${extraUser}` : input.user,
          },
        ],
        response_format: useSchema
          ? {
              type: "json_schema",
              json_schema: {
                name: input.schemaName,
                strict: false,
                schema: input.schema,
              },
            }
          : { type: "json_object" },
      },
      { timeout: input.timeoutMs },
    );

    const content = extractMessageJson(response.choices[0]?.message);
    const parsed = parseJsonPayload(content);
    try {
      return input.zodSchema.parse(input.salvage(parsed));
    } catch (zodError) {
      logger.clinicalUpdate("zod salvage parse", {
        issues:
          zodError instanceof z.ZodError
            ? zodError.issues.map((issue) => issue.path.join("."))
            : "unknown",
      });
      return input.salvage(parsed);
    }
  };

  try {
    return await run(undefined, false);
  } catch (error) {
    logger.clinicalUpdate(`${input.label} json_object failed, retrying schema`, {
      message: error instanceof Error ? error.message : "unknown",
    });
    try {
      return await run(
        "Responda novamente apenas com JSON válido no schema, sem texto extra.",
        true,
      );
    } catch (retryError) {
      logger.clinicalUpdate(`${input.label} recovery failed`, {
        message: retryError instanceof Error ? retryError.message : "unknown",
      });
      throw new AppError(
        "A análise clínica retornou uma resposta inválida.",
        "invalid_clinical_response",
        502,
      );
    }
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
      schemaName: "clinical_state",
      schema: clinicalStateJsonSchema as unknown as Record<string, unknown>,
      zodSchema: clinicalStateSchema,
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
      schemaName: "final_clinical_report",
      schema: finalReportJsonSchema as unknown as Record<string, unknown>,
      zodSchema: finalClinicalReportSchema,
      salvage: salvageFinalReport,
      reasoning: AI_CONFIG.reasoning.finalize,
      maxTokens: AI_CONFIG.maxCompletionTokens.finalize,
      timeoutMs: AI_CONFIG.timeouts.clinicalFinalizeMs,
      label: "ClinicalFinalize",
    });
  }
}

export const clinicalAIProvider: ClinicalAIProvider = new GroqClinicalProvider();
