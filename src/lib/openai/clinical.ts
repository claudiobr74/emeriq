import { compactClinicalState } from "@/lib/clinical/clinical-state";
import {
  formatProtocolContext,
  selectRelevantProtocols,
} from "@/clinical-knowledge/router";
import { AI_CONFIG } from "@/config/ai";
import {
  FINALIZE_SYSTEM_PROMPT,
  INCREMENTAL_SYSTEM_PROMPT,
  buildFinalizeUserPrompt,
  buildIncrementalUserPrompt,
} from "@/lib/clinical/prompts";
import { validateAndSanitizeSoap } from "@/lib/clinical/provenance";
import { stabilizeClinicalState } from "@/lib/clinical/provenance/stabilize";
import {
  extractJsonObject,
  salvageClinicalState,
  salvageFinalReport,
} from "@/lib/clinical/parse";
import type { ClinicalState, FinalClinicalReport } from "@/lib/clinical/schemas";
import { stripInventedNegatives } from "@/lib/clinical/presence";
import { applyReliabilityLayer } from "@/lib/clinical/reliability";
import { evaluateSafety, reevaluationHintForTrigger } from "@/lib/clinical/safety";
import {
  formatMandatoryConsiderations,
  mandatoryConsiderationsFromTriggers,
} from "@/lib/clinical/safety/considerations";
import { AppError, openAiRetryAfterMs } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getOpenAiClient } from "@/lib/openai/client";

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

function extractMessageJson(
  message: { content?: unknown } | undefined,
): string {
  return extractJsonText(message?.content).trim();
}

function openAiUserMessage(error: unknown): string {
  const status = (error as { status?: number }).status;
  const raw = error instanceof Error ? error.message : "";
  if (status === 429 || raw.includes("rate_limit")) {
    return "Limite de uso da OpenAI atingido. A gravação continua.";
  }
  if (status === 413 || raw.includes("context_length") || raw.includes("too large")) {
    return "O pedido clínico ficou grande demais para o modelo. A gravação continua; nova tentativa em instantes.";
  }
  if (status === 401 || status === 403) {
    return "Falha de autenticação com a OpenAI. Verifique OPENAI_API_KEY.";
  }
  return "A análise clínica falhou. A gravação continua.";
}

async function completeJson<T>(input: {
  system: string;
  user: string;
  salvage: (raw: unknown) => T;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  label: "ClinicalUpdate" | "ClinicalFinalize";
}): Promise<T> {
  const openai = getOpenAiClient();

  const run = async () => {
    const response = await openai.chat.completions.create(
      {
        model: AI_CONFIG.clinicalModel,
        temperature: input.temperature,
        max_tokens: input.maxTokens,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
        response_format: { type: "json_object" },
      },
      { timeout: input.timeoutMs },
    );

    const content = extractMessageJson(response.choices[0]?.message);
    return input.salvage(extractJsonObject(content));
  };

  try {
    return await run();
  } catch (error) {
    logger.clinicalUpdate(`${input.label} failed`, {
      message: error instanceof Error ? error.message.slice(0, 300) : "unknown",
    });
    throw new AppError(
      openAiUserMessage(error),
      "clinical_model_failed",
      502,
      openAiRetryAfterMs(error),
    );
  }
}

export class OpenAiClinicalProvider implements ClinicalAIProvider {
  async update(input: ClinicalUpdateInput): Promise<ClinicalState> {
    const triggers = evaluateSafety({
      transcript: input.confirmedTranscript,
      newSegment: input.newSegment,
      chiefComplaint: input.currentState.chiefComplaint,
      vitalSigns: input.currentState.vitalSigns,
      medications: input.currentState.medications,
    });
    const protocols = selectRelevantProtocols(
      input.currentState,
      input.confirmedTranscript,
      triggers,
      2,
    );

    logger.clinicalUpdate("request", {
      newChars: input.newSegment.length,
      transcriptChars: input.confirmedTranscript.length,
      protocols: protocols.map((item) => item.id),
      triggers: triggers.map((item) => item.trigger),
    });

    const salvaged = await completeJson({
      system: INCREMENTAL_SYSTEM_PROMPT,
      user: buildIncrementalUserPrompt({
        currentStateJson: JSON.stringify(compactClinicalState(input.currentState)),
        confirmedTranscript: input.confirmedTranscript,
        newSegment: input.newSegment,
        protocolContext: formatProtocolContext(protocols),
        safetyTriggers: [
          ...triggers.map((item) => {
            const hint = reevaluationHintForTrigger(item.trigger);
            return hint
              ? `${item.trigger} (${item.priority}): ${hint}`
              : `${item.trigger} (${item.priority})`;
          }),
          formatMandatoryConsiderations(mandatoryConsiderationsFromTriggers(triggers)),
        ]
          .filter(Boolean)
          .join("\n"),
      }),
      salvage: salvageClinicalState,
      temperature: AI_CONFIG.temperature.update,
      maxTokens: AI_CONFIG.maxCompletionTokens.update,
      timeoutMs: AI_CONFIG.timeouts.clinicalUpdateMs,
      label: "ClinicalUpdate",
    });

    const stable = stabilizeClinicalState(input.currentState, salvaged);
    return applyReliabilityLayer(
      {
        ...stable,
        systemSafetyTriggers: triggers,
      },
      input.confirmedTranscript,
      triggers,
    );
  }

  async finalize(input: ClinicalFinalizeInput): Promise<FinalClinicalReport> {
    const triggers = evaluateSafety({
      transcript: input.transcript,
      chiefComplaint: input.state.chiefComplaint,
      vitalSigns: input.state.vitalSigns,
      medications: input.state.medications,
    });
    const reliable = applyReliabilityLayer(input.state, input.transcript, triggers);
    const protocols = selectRelevantProtocols(
      reliable,
      input.transcript,
      triggers,
      2,
    );

    logger.clinicalFinalize("request", {
      transcriptChars: input.transcript.length,
      protocols: protocols.map((item) => item.id),
    });

    const report = await completeJson({
      system: FINALIZE_SYSTEM_PROMPT,
      user: buildFinalizeUserPrompt({
        currentStateJson: JSON.stringify(compactClinicalState(reliable)),
        transcript: input.transcript,
        protocolContext: formatProtocolContext(protocols),
      }),
      salvage: salvageFinalReport,
      temperature: AI_CONFIG.temperature.finalize,
      maxTokens: AI_CONFIG.maxCompletionTokens.finalize,
      timeoutMs: AI_CONFIG.timeouts.clinicalFinalizeMs,
      label: "ClinicalFinalize",
    });

    const sanitized = validateAndSanitizeSoap(report, {
      transcript: input.transcript,
      state: reliable,
    }).report;
    const presence = reliable.keyPresence;
    if (!presence) return sanitized;
    return {
      ...sanitized,
      soap: {
        subjective: stripInventedNegatives(sanitized.soap.subjective, presence),
        objective: stripInventedNegatives(sanitized.soap.objective, presence),
        assessment: stripInventedNegatives(sanitized.soap.assessment, presence),
        plan: sanitized.soap.plan,
      },
    };
  }
}

export const clinicalAIProvider: ClinicalAIProvider = new OpenAiClinicalProvider();
