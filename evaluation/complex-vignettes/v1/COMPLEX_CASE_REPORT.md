# ECCV-1 COMPLEX_CASE_REPORT

_Engineering only. Not clinical validation, certification, or evidence of safety for clinical use._

## Dataset design

- Name: EMERIQ COMPLEX CLINICAL VIGNETTES (ECCV-1)
- Cases: 60
- Hash: `1ccb50e548a2d71fc400da04b3f48d88a4213db01e287102ad8289bfbd9eb044`
- Model: gpt-4o-mini (único clinicalModel no repositório; sem A/B)
- Prompt / State / Safety / Knowledge: 1.3 / 1.3 / 1.3 / 1.3
- Complex scorer: 1.0

## Case distribution

- cardiovascular: 10
- neurologic: 8
- respiratory: 8
- infectious: 8
- gi: 6
- trauma: 5
- tox_metabolic: 5
- obgyn: 5
- undifferentiated: 5

- moderate: 10
- hard: 30
- very_hard: 20

## Dataset metrics

- Average variable count: 25.1
- Average segment count: 11.2
- Average word count: 626
- Average distractor count: 3.9
- complexityScore ≥ 8: 45
- multimorbidity: 54
- polypharmacy: 42
- vitalsChange: 58
- undertriage-test: 31
- overtriage-test: 15
- late reveal cases: 55
- correction cases: 39
- deterioration: 28
- Word count range: 417–1187

## FIRST_RUN results

- Generated: 2026-08-31T18:34:16.387Z
- PASS 2 / FAIL 58 / mean 73
- Gate: **FAILED**

## Critical metrics

- criticalDiagnosisRecall: 68.1% (>= 0.95) FAIL
- criticalPrecision: 47.0% (>= 0.8) FAIL
- criticalFails: 15 (== 0) FAIL
- criticalHallucinations: 0 (== 0) PASS
- unsafeRecommendations: 0 (== 0) PASS
- casesWithFabricationRate: 0.0% (<= 0.05) PASS
- soapFidelity: 100.0% (>= 0.95) PASS
- overtriageRate: 80.0% (<= 0.1) FAIL
- undertriageRate: 33.3% (== 0) FAIL
- complexIntegration: 18.3% (>= 0.85) FAIL
- temporalUpdate: 32.1% (>= 0.9) FAIL
- distractorResistance: 96.7% (>= 0.85) PASS
- prematureClosureRate: 19.5% (<= 0.05) FAIL
- anchoringErrorRate: 16.7% (<= 0.05) FAIL
- lateInformationIntegration: 43.6% (>= 0.95) FAIL
- correctionHandling: 28.2% (>= 0.95) FAIL

## Complex integration / temporal / distractors

- Complex Case Integration: 18.3%
- Temporal Update: 32.1%
- Distractor Resistance: 96.7%
- Premature Closure Rate: 19.5%
- Anchoring Error Rate: 16.7%
- Late Information Integration: 43.6%
- Correction Handling: 28.2%

## Results by specialty

- cardiovascular: n=10 PASS 0 mean 74.2
- gi: n=6 PASS 0 mean 70.0
- infectious: n=8 PASS 0 mean 70.8
- neurologic: n=8 PASS 2 mean 76.1
- obgyn: n=5 PASS 0 mean 74.2
- respiratory: n=8 PASS 0 mean 77.4
- tox_metabolic: n=5 PASS 0 mean 68.2
- trauma: n=5 PASS 0 mean 72.0
- undifferentiated: n=5 PASS 0 mean 70.6

## Results by difficulty

- hard: n=30 PASS 1 mean 71.5
- moderate: n=10 PASS 1 mean 79.0
- very_hard: n=20 PASS 0 mean 72.3

## Results by complexity score

- 10: n=7 PASS 0 mean 71.1
- 6: n=10 PASS 1 mean 79.0
- 7: n=5 PASS 0 mean 71.4
- 8: n=26 PASS 1 mean 72.1
- 9: n=12 PASS 0 mean 71.8

## Model comparison

Único modelo clínico declarado em `AI_CONFIG.clinicalModel`: `gpt-4o-mini`. Não há candidato mais forte no repositório. Comparação A/B **não executada** (não inventar ID). Roteamento por complexidade: experimento futuro, **não ativado**.

## Hard subset

_Ainda não executado (`pnpm eval:clinical:complex:hard`)._

## Stability (very_hard ∩ critical, 3×)

_Ainda não executado (`pnpm eval:clinical:complex:stability`)._

## Failures

Ver `evaluation/complex-vignettes/v1/results/FAILURE_REPORT.md` (58 casos).

## Post-run policy

Gates definidos **antes** do FIRST_RUN. Este relatório **não** altera prompt, ClinicalState, Safety, knowledge, aliases, scorer v1.3 nem o modelo.

## Key findings (FIRST_RUN)

- **Gate FAILED.** Não relaxar thresholds.
- SOAP 100%, fabricação 0, alucinação crítica 0, recomendação insegura 0 — o modelo responde; a integração longitudinal é o gargalo.
- Resistência a distrator 96,7% (quase o gate de 85%).
- Integração 18,3%, late-info 43,6%, correção 28,2%, update temporal 32,1% — o scorer exige eco textual de `lateReveals`/`corrections` e aumento de `urgencyMarks` no segmento de deterioração.
- Overtriage 80% nos 15 casos complexos não críticos; undertriage 33% nos críticos.
- Recall crítico 68,1% (15 CRITICAL_MISS). Casos limpos sem `failureKinds`: `ecc-neuro-07`, `ecc-neuro-08`.
- `very_hard` (n=20): 0 PASS no critério estrito (status PASS ∧ kinds vazio).
- Orçamento de completion **só no processo ECCV**: 3200 tokens (`EVAL_MAX_COMPLETION_TOKENS`). Produção permanece 1400/1800. Sem esse override, ClinicalUpdate truncava JSON em vinhetas longas.
- Sem A/B: único `clinicalModel` é `gpt-4o-mini`.
