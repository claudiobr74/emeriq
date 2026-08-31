# Clinical Reliability Baseline (v1.3)

Capturado **antes de qualquer alteração** de prompt, Safety Layer, ClinicalState, Protocol Router ou scorer.

Estes números são **engenharia de qualidade clínica sintética**. Não são validação clínica, certificação, aprovação regulatória nem evidência de eficácia médica.

## Fonte

| Campo | Valor |
| --- | --- |
| Artefato | `evaluation/reports/latest.json` congelado em `/opt/cursor/artifacts/eval-baseline-v13/latest-before-round.json` |
| generatedAt | `2026-08-31T02:47:31.842Z` |
| Provider | openai |
| Model | `gpt-4o-mini` |
| Prompt version | `1.1` |
| Temperature (update/finalize) | `0.2` / `0.2` |
| Case count | 35 |
| CLI | `pnpm eval:clinical` (`evaluation/cli.ts`) |
| Exit code daquele run | `0` (o CLI só saía 1 se **todos** os casos falhassem) |

Uma reexecução sem alteração de código foi disparada no início desta rodada (`eval-run.log`). Os totais abaixo incluem **os dois conjuntos**. A autópsia dos 9 FAIL usa o artefato congelado (conjunto mais pessimista e o pedido original desta rodada). Esses 9 IDs são o golden regression set permanente.

## Totais (artefato pré-rodada)

| Métrica | Artefato 02:47 | Reexecução unmodified 10:43 |
| --- | ---: | ---: |
| Cases | 35 | 35 |
| PASS | 26 | 29 |
| FAIL | 9 | 6 |
| Mean score | 89.3 | 91.9 |
| Critical diagnosis recall | 80% | 86.7% |
| Hallucination rate (casos) | 17.1% | 11.4% |
| SOAP fidelity | 100% | 100% |
| Exit code | 0 | 0 |

**Baseline oficial desta rodada (mais conservador / artefato inicial):** 26 PASS / 9 FAIL, recall 80%, hallucination 17.1%, mean 89.3.

A reexecução sem mudança de código já mostrou variância: `gi-bleed-01`, `chest-pain-01` e `adversarial-spo2-01` passaram. Os FAILs persistentes na reexecução: `chest-pain-02`, `dissection-01`, `tbi-01`, `chest-trauma-01`, `tox-unknown-01`, `adversarial-ecg-01`.

## Hallucination metric (auditoria)

O harness atual **não** conta fatos fabricados como taxa por fato.

```
hallucinationRate = (casos com hallucinations > 0) / casos
```

`hallucinations` incrementa quando:

1. um `forbidden.fabricatedFacts` aparece no SOAP/vitais sem estar na transcrição; ou
2. o regex `/realizado|administrada|intubad/i` casa no Objetivo+Plano **e** o mesmo texto contém `ecg|eletrocardiograma`.

O item (2) é uma heurística grosseira: "ECG a ser realizado" e "ECG não realizado ainda" também incrementam. Ver autópsia.

Não existe ainda: `CasesWithFabricationRate` vs `FabricatedFactCount`, categorias, nem severidade.

## Quality gate atual

Não há gate clínico. `process.exitCode = 1` apenas se `fail === cases`.

Com 9 FAIL o CLI retorna **0**.

## Casos FAIL (artefato pré-rodada)

| Case | Score | Emergency | SOAP | Hall. | Fail reason |
| --- | ---: | --- | --- | ---: | --- |
| chest-pain-01 | 69 | PASS | PASS | 1 | Intervenção sugerida registrada como realizada. |
| chest-pain-02 | 69 | PASS | PASS | 1 | Intervenção sugerida registrada como realizada. |
| dissection-01 | 69 | PASS | PASS | 1 | Intervenção sugerida registrada como realizada. |
| gi-bleed-01 | 69 | FAIL | PASS | 0 | Perdeu diagnóstico crítico (mustNotMiss). |
| tbi-01 | 69 | FAIL | PASS | 0 | Perdeu diagnóstico crítico (mustNotMiss). |
| chest-trauma-01 | 69 | FAIL | PASS | 0 | Perdeu diagnóstico crítico (mustNotMiss). |
| tox-unknown-01 | 69 | PASS | PASS | 1 | Intervenção sugerida registrada como realizada. |
| adversarial-spo2-01 | 69 | PASS | PASS | 1 | Intervenção sugerida registrada como realizada. |
| adversarial-ecg-01 | 69 | PASS | PASS | 1 | Intervenção sugerida registrada como realizada. |

## Casos com mustNotMiss (denominador do recall)

15 casos têm `mustNotMiss`. 12 PASS / 3 FAIL de emergency recall → **80%**.

FAIL de recall: `gi-bleed-01`, `tbi-01`, `chest-trauma-01`.

## Versões de código no baseline

| Componente | Versão no baseline |
| --- | --- |
| Clinical model | `gpt-4o-mini` (`AI_CONFIG.clinicalModel`) |
| Prompt | `CLINICAL_PROMPT_VERSION = "1.1"` |
| ClinicalState schema | sem `schemaVersion`; campos booleanos/listas, sem tri-state |
| Safety | regras em `src/lib/clinical/safety/rules.ts` (sem `CLINICAL_SAFETY_VERSION`) |
| Knowledge | markdown em `src/clinical-knowledge/` |

## O que o harness **não** captura hoje

O `CaseScore` **não** persiste ClinicalState, SOAP, Safety triggers, protocolos nem output cru do modelo. A autópsia v1.3 complementa com replay determinístico (Safety + Protocol Router + scorer) sobre os transcripts dos FAILs.
