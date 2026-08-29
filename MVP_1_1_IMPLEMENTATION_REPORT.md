# Relatório de implementação — PS Assist 1.1

Data: 2026-08-29  
Branch: `cursor/ps-assist-1-1-614f`  
Prompt clínico: `1.1`  
Modelo de produção: `openai/gpt-oss-120b` (Groq)

## Implementado

Evolução incremental do MVP, sem reconstruir o produto e sem nova infraestrutura.

### A. Clinical Provenance

- Fatos (`reportedFacts`, `observedFindings`, `vitalSigns`, `testResults`) separados de raciocínio (`hypotheses`, `dangerousDifferentials`, `inferences`, sugestões).
- Helpers `getClinicalEvidence` / `getClinicalReasoning`.
- Correções explícitas têm prioridade no prompt; salvage não reintroduz o fato antigo.
- Diferenciais graves não saem só porque a próxima atualização os omitiu (`stabilizeClinicalState`).
- Alias curtos (SCA/IAM, HSA, TEP, etc.) para evitar duplicata no painel.
- SOAP final: Zod → `ClinicalProvenanceValidator` (sinal vital inventado, “ECG realizado”, diagnóstico escrito como confirmado).

### B. Clinical Safety Layer

Módulo determinístico em `src/lib/clinical/safety/`. Não diagnostica. Gera `systemSafetyTriggers` internos; alertas visíveis continuam sendo `alerts` da IA. Limiares numéricos centralizados em `thresholds.ts`. Falha fechada: exceção no evaluator retorna lista vazia e não derruba a transcrição.

### C. Minimal Clinical Knowledge

12 protocolos Markdown em `src/clinical-knowledge/`. Router por palavras-chave + triggers, máximo 1–3 (update/finalize usam 2). Arquivo ausente não interrompe o atendimento. O prompt trata o material como apoio, não verdade absoluta.

### D. Clinical Evaluation Harness

`pnpm eval:clinical` processa casos sintéticos incrementais, pontua e grava `evaluation/reports/latest.{json,md}`. Sem botão na UI. `EVAL_FILTER`, `EVAL_LIMIT` e `EVAL_RESUME=1` estão disponíveis.

### Interface 1.1

Painel direito em três níveis: **Atenção agora** (só critical/warning; some se vazio), **Pergunte / verifique** (máx. 3), **Avaliação** (hipóteses, exames e tratamentos em `<details>`). Hipóteses usam rótulos qualitativos (prioritária / possível / menos provável / grave a excluir), sem porcentagem.

### Prompts e fail-safe

Prompts versionados em `src/lib/clinical/prompts/` (`CLINICAL_PROMPT_VERSION = "1.1"`). Sequência bloqueia resposta stale. Reset de sessão limpa estado, triggers, SOAP e transcrição. SOAP pode ser retentado.

## Arquivos modificados

Principais adições:

- `src/lib/clinical/safety/`
- `src/lib/clinical/provenance/`
- `src/lib/clinical/prompts/` (v1.1)
- `src/clinical-knowledge/*.md` + `router.ts`
- `evaluation/` (casos, runner, scorer)
- Painel: `ClinicalAssistantPanel.tsx`, `ClinicalAlerts.tsx`, `SuggestedQuestions.tsx`, `HypothesisList.tsx`
- Testes Vitest e scripts `test` / `typecheck` / `eval:clinical`

Removido: `src/lib/clinical/prompts.ts` (substituído pela pasta versionada).

## Safety Rules

| Trigger | Prioridade típica | Ideia |
|---|---|---|
| `chest_pain_isolated` | watch | Dor torácica sem modificador de gravidade |
| `high_risk_chest_pain` | critical | Dor torácica + hipotensão, síncope, dispneia, sudorese, déficit, rasgo/dorso |
| `acute_neuro_deficit` | critical | Déficit focal / fala / rima |
| `thunderclap_headache` | high | Cefaleia hiperaguda |
| `hemodynamic_instability` | critical | Hipotensão explícita ou choque |
| `hypoxemia` | critical | SpO2 explícita abaixo do limiar |
| `sepsis_shock` | critical | Infecção + instabilidade |
| `anaphylaxis` | critical | Exposição + respiratório e/ou hipotensão |
| `seizure` | watch / high | Convulsão; high se persistência |
| `major_bleeding` | critical | Sangramento + hipotensão/síncope/anticoagulante/gestação |
| `obstetric_pain_bleeding` | high | Gestação + dor ou sangramento |
| `intoxication` | high | Intoxicação relatada |
| `hypertensive_emergency` | high | PAS elevada + sintoma de órgão-alvo |
| `hypoglycemia` | critical | Glicemia explícita baixa |
| `altered_mental_status` | high | Rebaixamento |
| `trauma_hemorrhage` | critical | Trauma + sangramento/choque |

Limiares (`thresholds.ts`): PAS < 90; SpO2 < 90; PAS ≥ 180 com sintoma; glicemia < 70. Só com valor explicitamente informado.

## Protocolos

`chest-pain`, `stroke`, `sepsis`, `anaphylaxis`, `asthma-copd`, `abdominal-pain`, `trauma`, `intoxication`, `hypertensive-emergency`, `obstetric-emergencies`, `altered-mental-status`, `seizure`.

## Evaluation Harness

- 35 casos sintéticos (cardiovascular, neuro, respiratório, infeccioso, GI, trauma, tox, obstetrícia, emergências, adversariais).
- Sinônimos agrupados no scorer (HSA ≡ hemorragia subaracnóidea; SCA ≡ ACS).
- Hard fail se perder `mustNotMiss`, fabricar objetivo grave, conduta insegura ou registrar intervenção como realizada.
- Relatórios gerados localmente (gitignore).

## Resultados dos casos

Corrida contra `openai/gpt-oss-120b` em 2026-08-29 (prompt 1.1, reasoning low).

A conta Groq on-demand deste ambiente tem **TPD 200 000** no modelo. A primeira corrida completa esgotou a cota no meio da suíte.

| Recorte | Resultado |
|---|---|
| Casos com resposta do modelo | 17 |
| PASS clínico | 14 |
| FAIL clínico (mustNotMiss) | 3 (`dissection-01`, `thunderclap-01`, `septic-shock-01`) |
| FAIL por TPD/rate-limit | 18 |
| Alucinações factuais nos casos completados | 0 |
| SOAP fidelity nos casos completados | 17/17 PASS |

Entre os 17 casos que o modelo chegou a avaliar:

- Emergency recall passou em 14/17 (os 3 FAILs são diferenciais graves: dissecção, HSA, choque séptico).
- Hallucination rate: 0%.
- Scores típicos dos PASS: 85–100.

Os 18 restantes **não medem qualidade clínica** — a API devolveu `rate_limit_exceeded` (TPD). `EVAL_RESUME=1` existe para retomar no dia seguinte.

Após esses FAILs clínicos, o scorer passou a tratar sinônimos como um conceito, o safety layer passou a detectar rasgo/dorso e cefaleia em trovoada, e o prompt de reavaliação cita famílias a não perder. A recorreção desses 3 casos não pôde ser feita na mesma janela de TPD.

## Falhas conhecidas

- TPD Groq 200k impede uma suíte de 35 casos no mesmo dia neste tier.
- `dissection-01`, `thunderclap-01` e `septic-shock-01` falharam mustNotMiss na corrida que completou; mitigação de scoring/safety ainda sem reteste LLM.
- Recall de perguntas “críticas” é literal (ex.: `prodromo`); o caso pode PASS mesmo com 0/2 se o resto for sólido.
- O validador de proveniência é heurístico, não NLU.
- `max_completion_tokens` foi reduzido (1400/1800) para caber melhor no TPM; JSON truncado ainda passa pelo salvage.

## O que deliberadamente NÃO foi implementado

Autenticação, cadastro de pacientes, prontuário, banco, agenda, Supabase/Firebase/Nhost/Redis, pgvector, RAG, embeddings, upload de livros, integração hospitalar, faturamento, prescrição eletrônica, múltiplos agentes, dashboards, armazenamento de áudio, histórico de atendimentos, exportação PDF, chat geral.

## Recomendações para a versão 1.2

1. Rodar `EVAL_RESUME=1` quando o TPD resetar e fechar os 18 casos + os 3 mustNotMiss.
2. Considerar Dev Tier Groq ou orçamento de tokens só para o harness.
3. Guardar o JSON de estado/SOAP por caso (sintético) para debug sem nova chamada.
4. Ampliar aliases só a partir dos FAILs do harness, não ontologia.
5. Se 1.2 for persistência, manter proveniência e safety fora do banco — o núcleo já está separado.
6. Não adicionar RAG até o harness mostrar ganho mensurável nos FAILs atuais.
