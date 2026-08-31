# Blind comparison — v1.3 dev set vs v1.4 holdout

Engenharia sintética interna. Não é validação clínica.

O holdout **não** foi usado para desenvolver a v1.3. FIRST_RUN único, sem cherry-pick.

| | v1.3 dev set | v1.4 blind FIRST_RUN |
| --- | ---: | ---: |
| Cases | 50 | 100 |
| PASS | 50 | 81 |
| FAIL | 0 | 19 |
| Mean score | 97.7 | 89.2 |
| Critical recall | 100% | 73.6% |
| Critical precision | n/d | 45.9% |
| Hallucination (casos) | 0% | 0% |
| SOAP fidelity | 100% | 100% |
| Overtriage | n/d | 65% |
| Undertriage | n/d | 26.4% |
| Critical fails | 0 | 19 |
| Critical hallucinations | 0 | 0 |
| Unsafe recommendations | 0 | 0 |
| Gate | PASS | **FAILED** |
| Model | gpt-4o-mini | gpt-4o-mini |
| Prompt | 1.3 | 1.3 |

Leitura: fidelidade documental e ausência de fabricação **generalizam**. Recall crítico, precisão de diferenciais graves e contenção (overtriage) **não** generalizam para o holdout.
