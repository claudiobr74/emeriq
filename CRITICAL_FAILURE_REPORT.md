# CRITICAL_FAILURE_REPORT — blind v1.4 FIRST_RUN

19 CRITICAL_FAIL. Código clínico **não** corrigido após o run.

Impacto: **bloquear promoção**. Estes testes são sintéticos; o relatório não afirma dano a pacientes reais.

| Case | Transcript (resumo) | Output (DDS / SOAP A) | Gold mustNotMiss | Root cause | Recommended correction |
| --- | --- | --- | --- | --- | --- |
| b-crit-02 | Jovem alto, dor em rasgo, pulso assimétrico, PA 78 | aneurisma roto / isquemia mesentérica | dissecção aórtica | MODEL + scorer sem alias aneurisma | Safety dissecção; não alias post-hoc |
| b-crit-07 | 3 crises, GCS 7 | metabólico / SNC / trauma | status epilepticus | MODEL | Trigger status |
| b-crit-14 | Bike, flanco, ombro, PA 88, D+4 | aneurisma / mesentérica | hemorragia interna | MODEL | Kehr / delayed spleen |
| b-crit-15 | Bike, intervalo lúcido, anisocoria | HIC presente, sem TCE explícito | TCE **e** HIC | AND do gold + modelo | Gold futuro com um canônico |
| b-crit-18 | Insulina esquecida, Kussmaul | aneurisma / ectópica | cetoacidose | MODEL | Safety DKA |
| b-crit-21 | Parto domiciliar, toalhas encharcadas | hemorrhage / shock | hemorragia pós-parto | MODEL + inglês vs PT | — |
| b-crit-24 | Fumante, lombar súbita, PA 72, abdome pulsátil | aneurisma roto (texto) | ruptura de aneurisma | SCORER sinônimo | Não alias agora |
| b-crit-25 | Unha + dor desproporcional | celulite / TVP | fascite necrosante | MODEL | Pain out of proportion |
| b-crit-26 | Pós-MP, jugulares, bulhas abafadas | SCA / TEP / arritmia | tamponamento | MODEL | Tríade de Beck |
| b-crit-27 | Parou prednisona, choque | aneurisma | crise adrenal | MODEL | Desmame esteroide |
| b-crit-28 | Ultramaratona + só água, convulsão | status / hipo / AVC | hiponatremia | MODEL | — |
| b-crit-29 | Baba, voz de batata | sepse / meningite | epiglotite | MODEL | Via aérea |
| b-atyp-01 | Dor dentária de esforço, diabética 71a | odontológico | SCA | MODEL | Equivalente isquêmico |
| b-atyp-13 | DOAC, confusão na poltrona | hemorragia / AVC | HIC | SCORER frase | — |
| b-atyp-16 | Enoxaparina, flanco, palidez | aneurisma | hemorragia interna | MODEL | Retroperitônio |
| b-atyp-20 | Ortopneia 3 sem pós-parto | SCA / TEP / dissecção | cardiomiopatia periparto | MODEL | — |
| b-mis-02 | Jovem, voo 14h, dispneia | sepse / pneumonia | TEP | MODEL | — |
| b-mis-12 | Vômitos + polidipsia + Kussmaul | gastroenterite | cetoacidose | premature closure | — |
| b-mis-13 | “Coluna” + PA 80 | SCA / dissecção | ruptura de aneurisma | MODEL | — |

Safety/protocols completos estão em cada objeto `trace` de `FIRST_RUN.json`.
