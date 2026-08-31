# ECCV-1 freeze (antes do FIRST_RUN)

Congelado **antes** de qualquer `pnpm eval:clinical:complex`. Não alterar prompt, ClinicalState, Safety, knowledge, Protocol Router, modelo clínico, scorer v1.3, aliases ou thresholds de `GATES.json` para caber no resultado.

Engenharia apenas. Não é validação clínica.

## Pilha

| Campo | Valor |
| --- | --- |
| Dataset | ECCV-1 / `evaluation/complex-vignettes/v1/` |
| Branch | `cursor/complex-vignettes-v142-f665` |
| Clinical model | `gpt-4o-mini` (`src/config/ai.ts`) |
| Prompt / State / Safety / Knowledge | `1.3` |
| Complex scorer | `1.0` (empilha métricas novas sobre `evaluation/scorer.ts`) |
| Candidate model mais forte no repo | **nenhum** — sem A/B nesta rodada |

## Hash

Preenchido após os 60 casos e **antes** do FIRST_RUN.

| Campo | Valor |
| --- | --- |
| DATASET_SHA256 | `1ccb50e548a2d71fc400da04b3f48d88a4213db01e287102ad8289bfbd9eb044` |
| Case count | 60 |

## FIRST_RUN

Imutável em `evaluation/complex-vignettes/v1/results/FIRST_RUN.json`.  
Após o run: relatório. **Não** corrigir prompt/Safety/modelo automaticamente.
