import { AI_CONFIG } from "../../src/config/ai";
import { runComplexEvaluation } from "./runner";

/**
 * ECCV-1 only. Production remains update 1400 / finalize 1800 (v1.3 freeze).
 * Long residency vignettes truncated ClinicalUpdate JSON at 1400 tokens
 * ("Expected ',' or ']' after array element" near ~4800 chars). This env
 * raises the completion budget for the eval process without changing
 * `AI_CONFIG` defaults used by the app.
 */
const evalTokens = Number(process.env.EVAL_MAX_COMPLETION_TOKENS);
if (Number.isFinite(evalTokens) && evalTokens >= 1400) {
  const budget = {
    update: Math.floor(evalTokens),
    finalize: Math.max(Math.floor(evalTokens), 1800),
  };
  Object.assign(AI_CONFIG.maxCompletionTokens, budget);
  console.log(
    `ECCV eval completion tokens (process-only): update ${budget.update} finalize ${budget.finalize}`,
  );
}

runComplexEvaluation()
  .then((report) => {
    if (report.gates.overall === "FAILED") process.exitCode = 1;
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
