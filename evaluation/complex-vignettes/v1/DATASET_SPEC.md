# EMERIQ Complex Clinical Vignettes (ECCV-1)

Dataset de **engenharia**. Não é validação clínica, certificação, aprovação regulatória nem evidência de segurança para uso assistencial.

Versão do dataset: `v1` (ECCV-1).  
Pilha clínica congelada nesta rodada: prompt / ClinicalState / Safety / knowledge `1.3`, modelo `gpt-4o-mini` (`AI_CONFIG.clinicalModel`). **Não alterar** prompt, Safety, aliases, scorer clínico v1.3 nem o modelo para “passar” neste conjunto.

## Objetivo

Medir **integração clínica complexa**: o EmerIQ mantém raciocínio coerente com 15–30 variáveis simultâneas, distratores plausíveis, evolução temporal e informação tardia/corrigida?

Pergunta que o holdout v1.4 **não** responde bem: leitura longitudinal de vinheta longa estilo prova de residência.

## Regras de autoria

- Vinhetas **originais**. Não copiar, parafrasear nem adaptar questões reais de prova.
- Sem diagnóstico “escrito” no enunciado.
- Distratores clinicamente plausíveis (2–6).
- Labs mistos (normais / limítrofes / anormais), unidades brasileiras.
- Segmentos simulam consulta: não entregar o caso de uma vez.

## Tamanho

60 casos. Distribuição de domínio:

| Domínio | n | Prefixo |
| --- | ---: | --- |
| cardiovascular | 10 | `ecc-cv-` |
| neurológico | 8 | `ecc-neuro-` |
| respiratório | 8 | `ecc-resp-` |
| infeccioso | 8 | `ecc-inf-` |
| GI / hepatológico | 6 | `ecc-gi-` |
| trauma | 5 | `ecc-trauma-` |
| toxicologia / metabólico | 5 | `ecc-tox-` |
| obstétrico-ginecológico | 5 | `ecc-obg-` |
| undifferentiated | 5 | `ecc-und-` |

Dificuldade: 10 `moderate`, 30 `hard`, 20 `very_hard`. Nenhum `easy`.  
`complexityScore` ≥ 6 em todos; ≥ 8 em pelo menos 20.  
`variableCount` médio ≥ 18. Segmentos: 8–20 (ideal 10–16).

Quotas de desenho (assert no harness):

- ≥ 20 multimorbidade (2+ comorbidades relevantes)
- ≥ 15 polifarmácia (5+ medicamentos)
- ≥ 15 mudança de sinais vitais
- ≥ 15 undertriage-test (crítico pouco exuberante)
- ≥ 15 overtriage-test (complexo não crítico)
- ≥ 15 late reveal
- ≥ 10 correção posterior
- ≥ 10 deterioração
- late reveal em ≥ 50% dos casos

## Gold / runtime

`decisionPoints` são **metadata**. O EmerIQ não recebe múltipla escolha; processa segmentos como transcrição.

Gates em `GATES.json`, definidos **antes** do FIRST_RUN. Não relaxar após ver resultado.

## Hash

`DATASET_SHA256` é o SHA-256 canônico dos 60 casos (`evaluation/complex-vignettes/hash.ts`). Preenchido depois de gravar os casos e **antes** da primeira execução. FIRST_RUN imutável em `v1/results/FIRST_RUN.json`.

## Comandos

```
pnpm eval:clinical:complex
pnpm eval:clinical:complex:hard
pnpm eval:clinical:complex:stability
pnpm eval:clinical:complex:hash
```

Não entra em `pnpm build` / `release-check`.

## Modelos

Único modelo clínico no repositório: `gpt-4o-mini`. Não há candidato mais forte declarado em `AI_CONFIG`. Comparação A/B **não** roda nesta rodada (nada a comparar sem inventar ID). Roteamento por complexidade: experimento futuro, **não** ativar em produção.
