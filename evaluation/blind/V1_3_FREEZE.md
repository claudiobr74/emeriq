# v1.3 freeze — clinical-baseline-v1.3

Congelado **antes** do holdout v1.4. Nenhuma alteração de prompt, ClinicalState,
Safety Layer, knowledge, Protocol Router, modelo, thresholds, scorer clínico,
aliases, matching ou stabilization deve ocorrer até o FIRST_RUN ser arquivado.

Este freeze é de **engenharia**. Não é validação clínica nem certificação.

## Identidade

| Campo | Valor |
| --- | --- |
| Conceptual tag | `clinical-baseline-v1.3` |
| Git tag | `clinical-baseline-v1.3` |
| Commit hash | `d19a2d213200c4a450101efde79a7f2f18ad6b64` |
| Branch at freeze | `cursor/clinical-reliability-v13-f665` |
| Freeze timestamp (UTC) | `2026-08-31T12:10:00Z` |

## Clinical stack (valores reais no código)

| Componente | Valor | Fonte |
| --- | --- | --- |
| Clinical model | `gpt-4o-mini` | `src/config/ai.ts` `AI_CONFIG.clinicalModel` |
| Prompt version | `1.3` | `src/lib/clinical/prompts/version.ts` |
| ClinicalState version | `1.3` | `src/lib/clinical/versions.ts` |
| Safety version | `1.3` | `src/lib/clinical/versions.ts` |
| Knowledge version | `1.3` | `src/lib/clinical/versions.ts` |
| Scorer clínico (dev set) | harness v1.3 `evaluation/scorer.ts` (imutável nesta rodada) | |
| Blind scorer | `1.4` (`evaluation/blind/scorer.ts`) — métricas novas, **não** altera o scorer clínico | |
| Temperature update/finalize | `0.2` / `0.2` | `AI_CONFIG.temperature` |
| maxCompletionTokens | update `1400`, finalize `1800` | `AI_CONFIG.maxCompletionTokens` |
| Structured output | `response_format: { type: "json_object" }` | `src/lib/openai/clinical.ts` |
| Timeouts | update `43000` ms, finalize `58000` ms | `AI_CONFIG.timeouts` |

## Quality gates v1.3 (dev set)

| Gate | Threshold |
| --- | --- |
| criticalDiagnosisRecall | ≥ 0.95 |
| soapFidelity | ≥ 0.95 |
| hallucinationRate | ≤ 0.05 |
| unsupportedGroundingRate | == 0 |
| criticalUnsafeRecommendations | == 0 |
| criticalFails | == 0 |
| criticalHallucinations | == 0 |

## Baseline de 50 casos (dev set, não holdout)

Fonte: `evaluation/reports/v1.3-before-after.md` / artefato `eval-v13-full-50.json`.

| Métrica | Valor |
| --- | ---: |
| Cases | 50 |
| PASS / FAIL | 50 / 0 |
| Mean score | 97.7 |
| Critical recall | 100% |
| Hallucination (casos) | 0% |
| SOAP fidelity | 100% |
| Critical fails | 0 |
| Critical hallucinations | 0 |
| Gate | PASS |
| Model | gpt-4o-mini |

## Blind gates

Definidos **antes** do FIRST_RUN em `evaluation/blind/BLIND_GATES.json`. Não alterar depois do resultado.

## Case set hash

Preenchido após gravar `evaluation/blind/v1.4/` e **antes** do FIRST_RUN.

| Campo | Valor |
| --- | --- |
| BLIND_CASESET_SHA256 | `b2ef2ae78c5d1433a5a8a0caa22c134ab95778025097ca33551df94650b1c751` |
| Case count | 100 |
| Holdout path | `evaluation/blind/v1.4/` |

## Regras desta rodada

- FIRST_RUN é imutável (`evaluation/blind/results/FIRST_RUN.json`).
- Não usar o holdout em prompt, knowledge, Safety ou aliases antes da primeira avaliação.
- Não otimizar scorer/prompt para 100/100.
- `pnpm build` **não** executa o blind suite.
