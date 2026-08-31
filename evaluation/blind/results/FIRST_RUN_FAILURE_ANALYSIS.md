# FIRST_RUN failure analysis — holdout v1.4

Autópsia do FIRST_RUN (`2026-08-31T13:18:47Z`, `gpt-4o-mini`, prompt 1.3).
O código clínico **não** foi alterado depois desta leitura.

Classificações podem acumular. `REVIEW_REQUIRED` não foi usado para enfraquecer gold.

## Tabela

| Case | Failure class | Root cause | Proposed fix (não aplicado) |
| --- | --- | --- | --- |
| b-crit-02 | MODEL_REASONING_MISS, SCORER_ERROR | Disse "aneurisma roto", gold `dissecção aórtica`; pulso assimétrico. Sem alias aneurisma↔dissecção. | Não aliasar depois do run. Safety de dissecção em jovem alto + assimetria. |
| b-crit-07 | MODEL_REASONING_MISS | Três crises sem recuperar; DDS metabólico/infecção/trauma, não status. | Regra determinística de status epilepticus. |
| b-crit-14 | MODEL_REASONING_MISS | Trauma abdominal tardio; DDS aneurisma/mesentérica, não hemorragia interna/baço. | Safety atraso + ombro de Kehr. |
| b-crit-15 | SCORER_ERROR, MODEL_REASONING_MISS | HIC presente; `mustNotMiss` exige TCE **e** HIC. Não disse TCE. | Não unir gold neste arquivo. Próximo holdout: um canônico. |
| b-crit-18 | MODEL_REASONING_MISS | Insulina esquecida + Kussmaul; DDS aneurisma/ectópica, não cetoacidose. | Safety DKA (insulina + respiração profunda). |
| b-crit-21 | MODEL_REASONING_MISS, SCORER_ERROR | "hemorrhage/shock" vs `hemorragia pós-parto`. | Alias só em versão futura de holdout, não agora. |
| b-crit-24 | SCORER_ERROR, MODEL_REASONING_MISS | SOAP `aneurisma roto` ≈ gold `ruptura de aneurisma`. Matching v1.3 não equivale. | Não adicionar alias post-hoc. |
| b-crit-25 | MODEL_REASONING_MISS | Dor desproporcional; SOAP celulite/TVP, não fascite. | Safety pain-out-of-proportion. |
| b-crit-26 | MODEL_REASONING_MISS | Pós-marca-passo, jugulares + bulhas abafadas → SCA/TEP, não tamponamento. | Safety Beck. |
| b-crit-27 | MODEL_REASONING_MISS | Parou prednisona; DDS aneurisma, não crise adrenal. | Safety desmame de corticoide. |
| b-crit-28 | MODEL_REASONING_MISS | Ultramaratona + água; DDS status/AVC, não hiponatremia. | — |
| b-crit-29 | MODEL_REASONING_MISS | Baba + voz abafada; DDS sepse/meningite, não epiglotite. | Safety via aérea. |
| b-atyp-01 | MODEL_REASONING_MISS | Dor dentária de esforço em diabética → odontológico, esqueceu SCA. | — |
| b-atyp-13 | SCORER_ERROR | DDS tem "hemorragia" e AVC; gold `hemorragia intracraniana` (frase completa). | — |
| b-atyp-16 | MODEL_REASONING_MISS | Enoxaparina + flanco; DDS aneurisma, não hematoma retroperitoneal. | — |
| b-atyp-20 | MODEL_REASONING_MISS | Ortopneia puerperal; SCA/TEP/dissecção, não cardiomiopatia periparto. | — |
| b-mis-02 | MODEL_REASONING_MISS | Jovem + voo longo + dispneia → sepse/pneumonia, não TEP. | — |
| b-mis-12 | MODEL_REASONING_MISS | "Virose" + polidipsia + Kussmaul; fechou gastroenterite. | Premature closure. |
| b-mis-13 | MODEL_REASONING_MISS | Lombalgia + hipotensão; SCA/dissecção, não AAA. | — |

## Overtriage (não FAIL de caso; falha de gate)

Classe **OVERTRIAGE**. 13/20 benignos. Padrão: `dangerousDifferentials` recebe 1–3 famílias críticas (SCA, TEP, dissecção, AVC, sepse, meningite) sem justificativa no gold/`clinicallyPlausibleAlternatives`.

IDs: b-ben-01, 02, 03, 04, 05, 06, 11, 12, 13, 15, 17, 19, 20.

Provável motor: inércia de SafetyMandatoryConsideration da v1.3 + modelo que lista o trio torácico por padrão.

## Contagem de classes (FAILs)

| Classe | Casos |
| --- | ---: |
| MODEL_REASONING_MISS | 17 |
| SCORER_ERROR (alias/AND/gold) | 5 |
| OVERTRIAGE | 13 (benign PASS) |
| UNDERTRIAGE | 19 |
| HALLUCINATED_FACT | 0 |
| NEGATION_ERROR / CORRECTION_ERROR | 0 (adversariais 15/15 PASS) |
| SAFETY_MISS | cofator em vários CRITICAL (sem regra para DKA, tamponade, PPH, fascite, adrenal, epiglotite, AAA) |
| PROTOCOL_ROUTING_MISS | não isolado |
| STATE_EXTRACTION_MISS | não demonstrado |
| OTHER | question-recall 0% (needles rígidos) |

## Recomendação

Problema **geral**, não caso a caso: (1) cobertura Safety limitada às famílias v1.3; (2) flooding de diferenciais críticos; (3) gold do holdout mais amplo que a tabela de aliases congelada.

**Não** treinar no holdout. Se a arquitetura for corrigida com estes casos, eles deixam de ser blind.
