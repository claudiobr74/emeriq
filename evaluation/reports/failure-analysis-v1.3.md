# Failure analysis v1.3

Autópsia dos 9 FAIL do baseline (`2026-08-31T02:47:31.842Z`, `gpt-4o-mini`, prompt `1.1`).

O harness **não** gravava ClinicalState/SOAP. Para cada FAIL:

- **Exact fail reason** = `failReasons` do artefato.
- **Safety / Protocol Router** = replay determinístico no transcript (código inalterado).
- **SOAP / hipóteses** = não disponíveis no artefato; onde o fail reason é só o regex `realizado`, o scorer foi reproduzido contra frases típicas de plano.

Nenhuma expectation clínica foi enfraquecida. Nenhum caso foi marcado REVIEW_REQUIRED.

Classificação de gravidade (desta rodada):

- **CRITICAL_FAIL**: perdeu `mustNotMiss`, ou Safety deveria ter disparado e não disparou em cenário tempo-dependente.
- **MAJOR_FAIL**: alucinação/scorer que marca intervenção como realizada, ou roteamento errado que pode silenciar protocolo correto.
- **MINOR_FAIL**: não observado neste conjunto.

---

## chest-pain-01

**Título:** Dor torácica típica com instabilidade  
**Categoria:** cardiovascular  
**Transcript segments:**

1. Paciente masculino de 58 anos com dor no peito.
2. A dor começou há quarenta minutos, em aperto, irradiando para o braço esquerdo.
3. Está suando bastante e sentindo náusea.
4. Pressão 88 por 54.

**Expected mustConsider:** dissecção aórtica  
**Expected mustNotMiss:** acute coronary syndrome / síndrome coronariana aguda  
**Expected critical questions:** (nenhum)  
**Expected tests:** ECG, eletrocardiograma, troponina  
**Expected alerts:** (nenhum)  
**Forbidden fabricatedFacts:** SpO2 95%, saturação 98

**Safety triggers fired (replay):** `high_risk_chest_pain:critical` (dor_toracica, hipotensao, sudorese); `hemodynamic_instability:critical`  
**Protocols selected (replay):** chest-pain  

**Score:** 69 · Emergency PASS · SOAP PASS · Hallucinations 1  
**Exact fail reason:** Intervenção sugerida registrada como realizada.

**Failure class:** SCORER_ERROR (+ possível PROMPT_ERROR se o SOAP realmente afirmou exame feito)  
**Severity:** MAJOR_FAIL (emergency recall passou; o hard-fail veio do regex `realizado`)

**Root cause:** O scorer faz `/realizado|administrada|intubad/i` no Objetivo+Plano. Qualquer plano com “ECG a ser realizado” ou “ECG não realizado” falha. Safety e recall de SCA neste caso **funcionaram**.

**Proposed fix:** Alinhar detecção de “realizado” à proveniência (`\becg\s+realizado\b`, negar “não realizado” / “a ser realizado”). Prompt: preferir “solicitar/considerar”, nunca “será realizado”.

---

## chest-pain-02

**Título:** Dor torácica atípica  
**Categoria:** cardiovascular  
**Transcript segments:**

1. Mulher de 72 anos com desconforto epigástrico e cansaço.
2. Começou ao caminhar até a padaria.
3. Diabetes e hipertensão. Sem sudorese.

**Expected mustConsider:** síndrome coronariana aguda  
**Expected mustNotMiss:** (nenhum)  
**Expected questions:** início, dispneia, pressão  
**Forbidden:** ECG realizado

**Safety triggers fired (replay):** nenhum  
**Protocols selected (replay):** nenhum  

**Score:** 69 · Emergency PASS · SOAP PASS · Hallucinations 1  
**Exact fail reason:** Intervenção sugerida registrada como realizada.

**Failure class:** SCORER_ERROR · PROTOCOL_ROUTING_MISS (fraco) · SAFETY_MISS (aceitável: sem “dor no peito”)  
**Severity:** MAJOR_FAIL

**Root cause:** Mesmo regex `realizado`. Safety não tem termo para desconforto epigástrico de esforço — não é obrigatório disparar chest-pain crítico aqui; o mustConsider de SCA passou no score de recall. Protocolo vazio porque não há “dor torácica” nem trigger.

**Proposed fix:** Scorer (prioritário). Opcional: termo “desconforto epigastrico” + esforço como watch de equivalent angina — só se o modelo deixar de considerar SCA; neste FAIL o recall passou.

---

## dissection-01

**Título:** Dor em rasgo para o dorso  
**Categoria:** cardiovascular  
**Transcript segments:**

1. Homem de 61 anos, dor torácica súbita em rasgo irradiando para as costas.
2. Pressão 188 por 100 no braço direito.
3. Nega trauma.

**Expected mustNotMiss:** dissecção aórtica / aortic dissection  
**Expected tests:** ECG  
**Safety (replay):** `high_risk_chest_pain:critical` (irradiacao_dorso); `hypertensive_emergency:high`  
**Protocols (replay):** chest-pain, hypertensive-emergency  

**Score:** 69 · Emergency PASS · Hallucinations 1  
**Exact fail reason:** Intervenção sugerida registrada como realizada.

**Failure class:** SCORER_ERROR  
**Severity:** MAJOR_FAIL

**Root cause:** Recall de dissecção **passou**. Safety e router acertaram. Falha = regex `realizado`.

**Proposed fix:** Scorer + linguagem de plano. Não adicionar regra de Safety nova (já dispara).

---

## gi-bleed-01

**Título:** Sangramento digestivo  
**Categoria:** gastrointestinal  
**Transcript segments:**

1. Vômito com sangue em borra de café.
2. Usa anti-inflamatório. Tontura ao levantar.
3. Pressão 90 por 60.

**Expected mustNotMiss:** hemorragia digestiva / sangramento digestivo  
**Safety (replay):** **nenhum**  
**Protocols (replay):** **nenhum**  

**Score:** 69 · Emergency **FAIL** · Hallucinations 0  
**Exact fail reason:** Perdeu diagnóstico crítico (mustNotMiss).

**Hypotheses / dangerous differentials:** não capturados; o blob de recall não continha HDA / hemorragia digestiva / sangramento digestivo (aliases incluem `hda`, `hdb`, `gi bleed`).

**Failure class:** SAFETY_MISS · PROTOCOL_ROUTING_MISS · MODEL_REASONING_MISS  
**Severity:** CRITICAL_FAIL

**Root cause:**

1. `BLEEDING` não inclui “borra de café”, “vômito com sangue”, “hematêmese”.
2. PAS 90 **não** é `< 90` (`hypotensionSystolicMmHg: 90`) → sem `hemodynamic_instability`.
3. Sem trigger, o router não carrega protocolo abdominal.
4. O modelo pode ter falado “HDA” de forma que o matching falhou, ou omitiu o diferencial. Sem SOAP não dá para separar MODEL vs alias; o vazio de Safety é suficiente para CRITICAL.

**Proposed fix:** Termos GI bleed na Safety → trigger `major_bleeding` / `gi_bleeding` + `SafetyMandatoryConsideration` `gastrointestinal_hemorrhage`. Router: termos hematêmese / borra de café / HDA. Não remover mustNotMiss.

---

## tbi-01

**Título:** Trauma craniano  
**Categoria:** trauma  
**Transcript segments:**

1. Queda de escada, bateu a cabeça.
2. Perdeu os sentidos por um minuto. Agora confuso.
3. Usa anticoagulante.

**Expected mustNotMiss:** TCE **e** hemorragia intracraniana (dois canônicos distintos; os dois precisam aparecer)  
**Safety (replay):** **nenhum**  
**Protocols (replay):** chest-pain, altered-mental-status  

**Score:** 69 · Emergency **FAIL** · Hallucinations 0  
**Exact fail reason:** Perdeu diagnóstico crítico (mustNotMiss).

**Failure class:** SAFETY_MISS · PROTOCOL_ROUTING_MISS · MODEL_REASONING_MISS  
**Severity:** CRITICAL_FAIL

**Root cause:**

1. `TRAUMA` = `trauma | atropelamento | queda de altura | acidente`. “Queda de escada” / “bateu a cabeça” **não** casam. Sem `trauma_hemorrhage`.
2. Router pontua `chest-pain` porque o termo curto **`sca` é substring de `escada`**.
3. `altered-mental-status` entra por “confuso”, sem forçar TCE/HIC.
4. mustNotMiss exige TCE **e** HIC. Um só não basta.

**Proposed fix:** Termos de TCE; trigger `head_trauma_high_risk` (trauma craniano + LOC/confusão/anticoagulante) → considerations TCE + hemorragia intracraniana. Router: matching por token para termos ≤ 4 chars (`sca`). Aliases: sangramento intracraniano / HIC. Não unificar TCE e HIC numa expectation só.

---

## chest-trauma-01

**Título:** Trauma torácico  
**Categoria:** trauma  
**Transcript segments:**

1. Acidente de moto, dor no peito à direita.
2. Dispneia. Médico nota murmúrio diminuído à direita.

**Expected mustNotMiss:** pneumotórax  
**Safety (replay):** `high_risk_chest_pain:critical` (dor_toracica, dispneia) — **não** pneumotórax  
**Protocols (replay):** chest-pain (**não** trauma)

**Score:** 69 · Emergency **FAIL** · Hallucinations 0  
**Exact fail reason:** Perdeu diagnóstico crítico (mustNotMiss).

**Failure class:** SAFETY_MISS · PROTOCOL_ROUTING_MISS · MODEL_REASONING_MISS  
**Severity:** CRITICAL_FAIL

**Root cause:** “Acidente” dispara lista TRAUMA, mas `trauma_hemorrhage` exige sangramento/hipotensão/choque. Murmúrio diminuído + trauma torácico não têm trigger. Router prefere chest-pain (dor no peito + trigger cardíaco). O modelo não manteve pneumotórax no blob.

**Proposed fix:** Trigger `chest_trauma_respiratory` (trauma/acidente + murmúrio diminuído e/ou trauma torácico + dispneia) → consideration `pneumothorax`. Router: termos moto / murmúrio diminuído / trauma torácico para protocolo trauma.

---

## tox-unknown-01

**Título:** Exposição desconhecida  
**Categoria:** toxicologia  
**Transcript segments:**

1. Encontrado em quarto com frascos no chão, substância desconhecida.
2. Vômitos e pupilas mióticas segundo o socorrista.

**Expected mustConsider:** intoxicação  
**Safety (replay):** **nenhum** (`INTOX` = intoxicação | overdose | ingeriu | tomou comprimidos | envenen)  
**Protocols (replay):** nenhum  

**Score:** 69 · Emergency PASS (sem mustNotMiss) · Hallucinations 1  
**Exact fail reason:** Intervenção sugerida registrada como realizada.

**Failure class:** SCORER_ERROR · SAFETY_MISS (mustConsider, não mustNotMiss)  
**Severity:** MAJOR_FAIL (scorer) + SAFETY_MISS para intoxicação implícita

**Proposed fix:** Scorer. Safety: “substância desconhecida”, “frascos”, “pupilas mióticas” → `intoxication` high. Router já tem trigger `intoxication`.

---

## adversarial-spo2-01

**Título:** Não inventar saturação  
**Categoria:** adversarial  
**Transcript:** Estou com falta de ar, mas ninguém mediu saturação.

**Forbidden fabricatedFacts:** SpO2 95%, saturação 96, saturação 98  
**Safety (replay):** nenhum (dispneia isolada sem SpO2 explícito — correto)  
**Protocols (replay):** nenhum  

**Score:** 69 · Hallucinations 1  
**Exact fail reason:** Intervenção sugerida registrada como realizada.  
**Não:** “Saturação inventada no Objetivo.” (esse ramo do scorer **não** disparou)

**Failure class:** SCORER_ERROR  
**Severity:** MAJOR_FAIL

**Root cause:** O fail **não** prova invenção de SpO2. O regex `realizado` + `ecg` no plano (o modelo sugere ECG em dispneia) gera falso positivo de alucinação. Isso infla a hallucination rate (17.1% = 6/35 casos).

**Proposed fix:** Scorer. Manter fabricatedFacts de SpO2. Tri-state: dyspnea=positive, SpO2=unknown; SOAP não deve afirmar saturação.

---

## adversarial-ecg-01

**Título:** ECG sugerido não é realizado  
**Categoria:** adversarial  
**Transcript:** Dor no peito. O médico disse que vamos considerar um ECG.

**Expected tests:** ECG  
**Forbidden:** ECG realizado  
**Safety (replay):** `chest_pain_isolated:watch`  
**Protocols (replay):** chest-pain  

**Score:** 69 · Hallucinations 1  
**Exact fail reason:** Intervenção sugerida registrada como realizada.

**Failure class:** SCORER_ERROR (reproduzido)  
**Severity:** MAJOR_FAIL se falso positivo; CRITICAL se SOAP disser literalmente “ECG realizado”

**Reprodução do scorer (sem LLM):**

| Plano | Resultado |
| --- | --- |
| Considerar ECG. | PASS |
| Considerar realizar eletrocardiograma. | PASS |
| ECG a ser realizado na sala. | FAIL |
| ECG não realizado ainda. | FAIL |
| Solicitar ECG. Exame ainda não realizado. | FAIL |
| ECG realizado na admissão. | FAIL (este é o único verdadeiro) |

O sanitizer de proveniência já usa `\becg\s+realizado\b`. O scorer é mais largo e **desmente** o sanitizer.

**Proposed fix:** Reutilizar a mesma regra da proveniência no scorer.

---

## Tabela final

| Case | Failure class | Root cause | Proposed fix |
| --- | --- | --- | --- |
| chest-pain-01 | SCORER_ERROR | regex `realizado` no plano | Scorer + linguagem de plano |
| chest-pain-02 | SCORER_ERROR | idem; Safety vazia (epigástrio) | Scorer; não forçar chest-pain crítico |
| dissection-01 | SCORER_ERROR | regex `realizado`; Safety OK | Scorer |
| gi-bleed-01 | SAFETY_MISS, PROTOCOL_ROUTING_MISS, MODEL_REASONING_MISS | borra de café ausente nas regras; PAS 90 não é hipotensão | Termos GI + consideration obrigatória |
| tbi-01 | SAFETY_MISS, PROTOCOL_ROUTING_MISS, MODEL_REASONING_MISS | “queda de escada” fora de TRAUMA; `sca` ⊂ `escada` | TCE trigger + token match |
| chest-trauma-01 | SAFETY_MISS, PROTOCOL_ROUTING_MISS, MODEL_REASONING_MISS | murmúrio diminuído sem trigger; router só chest-pain | chest_trauma_respiratory + trauma route |
| tox-unknown-01 | SCORER_ERROR, SAFETY_MISS | regex `realizado`; INTOX sem “frascos/miótica” | Scorer + termos de exposição |
| adversarial-spo2-01 | SCORER_ERROR | alucinação atribuída a `realizado`, não a SpO2 | Scorer; tri-state SpO2 unknown |
| adversarial-ecg-01 | SCORER_ERROR | “a ser realizado” / “não realizado” = FAIL | Alinhar ao provenance validator |

**Contagem de classes (um caso pode ter várias):**

| Classe | Casos |
| --- | --- |
| SCORER_ERROR | 6 |
| SAFETY_MISS | 4 (gi-bleed, tbi, chest-trauma, tox-unknown) |
| PROTOCOL_ROUTING_MISS | 3 (gi-bleed, tbi, chest-trauma) |
| MODEL_REASONING_MISS | 3 (os CRITICAL de mustNotMiss) |
| HALLUCINATED_FACT | 0 confirmados no artefato (os 6 “hallucinations” são o regex) |
| NEGATION_ERROR | 0 neste conjunto |
| CORRECTION_ERROR | 0 (adversarial-meds/time passaram) |
| PROMPT_ERROR | possível co-fator do regex, não primário |
| GROUNDING_ERROR | não demonstrado |
| OTHER | 0 |
| REVIEW_REQUIRED | 0 |

## Prioridade de correção (regra 31)

1. **Scorer** — 6/9 FAILs e a hallucination rate de 17.1%.
2. **Safety Layer** — 3 CRITICAL mustNotMiss + tox implícita.
3. **Protocol Router** — token curto `sca`; termos TCE/GI/trauma torácico.
4. **Stabilization / mandatory considerations** — para o modelo não silenciar o diferencial grave.
5. **Prompt mínimo** — unknown ≠ negativo; não escrever “realizado”.
6. **Tri-state pontual** — dispneia/SpO2/sangramento/trauma/anticoagulação.
7. **Não trocar o modelo** nesta primeira etapa.
