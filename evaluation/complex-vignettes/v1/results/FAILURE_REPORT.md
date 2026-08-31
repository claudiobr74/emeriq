# ECCV-1 FAILURE_REPORT

_Engineering only. Not clinical validation._

Run: FIRST_RUN  Generated: 2026-08-31T18:34:16.387Z  Hash: `1ccb50e548a2d71fc400da04b3f48d88a4213db01e287102ad8289bfbd9eb044`

### ecc-cv-01 — Epigastralgia em diabética com DRC e refluxo — SCA atrasada

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: cardiovascular
- Status: PASS  score 83
- Kinds: INTEGRATION_MISS, LATE_INFO_MISS, CORRECTION_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 1/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 1/1; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 1/1; distractors 0; urgency 2
- s4 (meds): mustNotMiss 1/1; distractors 0; urgency 2
- s5 (exam): mustNotMiss 1/1; distractors 0; urgency 2
- s6 (vitals): mustNotMiss 1/1; distractors 0; urgency 2
- s7 (ecg): mustNotMiss 1/1; distractors 0; urgency 2
- s8 (labs): mustNotMiss 1/1; distractors 0; urgency 2
- s9 (late): mustNotMiss 1/1; distractors 0; urgency 2; late-miss
- s10 (ecg): mustNotMiss 1/1; distractors 0; urgency 2


### ecc-cv-02 — Dor torácica súbita após empurrar caminhonete — pulsos inicialmente simétricos

- Difficulty: very_hard  Criticality: critical  Complexity: 9
- Domain: cardiovascular
- Status: PASS  score 83
- Kinds: INTEGRATION_MISS, LATE_INFO_MISS, CORRECTION_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 1/1; distractors 1; urgency 2
- s2 (hpi): mustNotMiss 1/1; distractors 1; urgency 3
- s3 (pmh): mustNotMiss 0/1; distractors 1; urgency 4
- s4 (meds): mustNotMiss 1/1; distractors 0; urgency 5
- s5 (exam): mustNotMiss 1/1; distractors 1; urgency 5
- s6 (vitals): mustNotMiss 1/1; distractors 1; urgency 5
- s7 (ecg): mustNotMiss 0/1; distractors 1; urgency 5
- s8 (labs): mustNotMiss 1/1; distractors 0; urgency 5
- s9 (imaging): mustNotMiss 1/1; distractors 1; urgency 5
- s10 (late): mustNotMiss 1/1; distractors 1; urgency 5; late-miss
- s11 (correction): mustNotMiss 0/1; distractors 1; urgency 5
- s12 (vitals): mustNotMiss 1/1; distractors 0; urgency 5


### ecc-cv-03 — Aperto no peito após discussão no trabalho — rotulado como ansiedade

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: cardiovascular
- Status: PASS  score 85
- Kinds: LATE_INFO_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 1/1; distractors 1; urgency 3
- s2 (hpi): mustNotMiss 1/1; distractors 1; urgency 3
- s3 (pmh): mustNotMiss 1/1; distractors 1; urgency 3
- s4 (meds): mustNotMiss 0/1; distractors 1; urgency 4
- s5 (exam): mustNotMiss 0/1; distractors 1; urgency 5
- s6 (vitals): mustNotMiss 0/1; distractors 1; urgency 5
- s7 (ecg): mustNotMiss 0/1; distractors 1; urgency 5
- s8 (labs): mustNotMiss 0/1; distractors 1; urgency 5
- s9 (late): mustNotMiss 1/1; distractors 1; urgency 5; late-miss
- s10 (exam): mustNotMiss 1/1; distractors 1; urgency 5
- s11 (labs): mustNotMiss 1/1; distractors 1; urgency 5


### ecc-cv-04 — Cansaço e pressão “quase normal” em hipertensa — história oncológica tardia

- Difficulty: very_hard  Criticality: critical  Complexity: 9
- Domain: cardiovascular
- Status: PASS  score 84
- Kinds: INTEGRATION_MISS, LATE_INFO_MISS, CORRECTION_MISS, TEMPORAL_UPDATE_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 1; urgency 3
- s2 (hpi): mustNotMiss 0/1; distractors 1; urgency 5
- s3 (pmh): mustNotMiss 0/1; distractors 1; urgency 5
- s4 (meds): mustNotMiss 0/1; distractors 1; urgency 5
- s5 (exam): mustNotMiss 0/1; distractors 1; urgency 5
- s6 (vitals): mustNotMiss 0/1; distractors 1; urgency 5
- s7 (ecg): mustNotMiss 0/1; distractors 1; urgency 5
- s8 (labs): mustNotMiss 0/1; distractors 1; urgency 5
- s9 (imaging): mustNotMiss 0/1; distractors 1; urgency 5
- s10 (late): mustNotMiss 0/1; distractors 1; urgency 5; late-miss
- s11 (correction): mustNotMiss 0/1; distractors 1; urgency 5
- s12 (deterioration): mustNotMiss 0/1; distractors 1; urgency 5


### ecc-cv-05 — Dispneia e palpitações em idoso com IC e FA — piora após volume

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: cardiovascular
- Status: FAIL  score 53
- Kinds: INTEGRATION_MISS, CRITICAL_MISS, LATE_INFO_MISS, TEMPORAL_UPDATE_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 0/2; distractors 1; urgency 2
- s2 (hpi): mustNotMiss 0/2; distractors 1; urgency 4
- s3 (pmh): mustNotMiss 0/2; distractors 1; urgency 5
- s4 (meds): mustNotMiss 0/2; distractors 1; urgency 5
- s5 (exam): mustNotMiss 0/2; distractors 1; urgency 5
- s6 (vitals): mustNotMiss 0/2; distractors 1; urgency 5
- s7 (ecg): mustNotMiss 0/2; distractors 1; urgency 5
- s8 (labs): mustNotMiss 0/2; distractors 1; urgency 5
- s9 (imaging): mustNotMiss 0/2; distractors 1; urgency 5
- s10 (late): mustNotMiss 0/2; distractors 1; urgency 5; late-miss
- s11 (deterioration): mustNotMiss 0/2; distractors 1; urgency 5
- s12 (other): mustNotMiss 0/2; distractors 1; urgency 5

- Perdeu diagnóstico crítico (mustNotMiss).

### ecc-cv-06 — Síncope na fila da lotérica — ECG inicial pouco exuberante

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: cardiovascular
- Status: FAIL  score 68
- Kinds: INTEGRATION_MISS, CRITICAL_MISS, LATE_INFO_MISS, CORRECTION_MISS, TEMPORAL_UPDATE_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 0/2; distractors 2; urgency 2
- s2 (hpi): mustNotMiss 0/2; distractors 2; urgency 3
- s3 (pmh): mustNotMiss 0/2; distractors 1; urgency 5
- s4 (meds): mustNotMiss 0/2; distractors 1; urgency 5
- s5 (exam): mustNotMiss 0/2; distractors 2; urgency 5
- s6 (vitals): mustNotMiss 0/2; distractors 1; urgency 5
- s7 (ecg): mustNotMiss 0/2; distractors 2; urgency 5
- s8 (labs): mustNotMiss 0/2; distractors 1; urgency 5
- s9 (late): mustNotMiss 0/2; distractors 2; urgency 5; late-miss
- s10 (correction): mustNotMiss 0/2; distractors 1; urgency 5
- s11 (deterioration): mustNotMiss 0/2; distractors 2; urgency 5
- s12 (ecg): mustNotMiss 0/2; distractors 1; urgency 5

- Perdeu diagnóstico crítico (mustNotMiss).

### ecc-cv-07 — Cefaleia e tremor encaminhados da UBS como crise de ansiedade

- Difficulty: hard  Criticality: critical  Complexity: 7
- Domain: cardiovascular
- Status: FAIL  score 53
- Kinds: INTEGRATION_MISS, CRITICAL_MISS, ANCHORING_ERROR, LATE_INFO_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 0/1; distractors 0; urgency 2
- s4 (meds): mustNotMiss 0/1; distractors 0; urgency 2
- s5 (exam): mustNotMiss 0/1; distractors 0; urgency 2
- s6 (vitals): mustNotMiss 0/1; distractors 0; urgency 2
- s7 (ecg): mustNotMiss 0/1; distractors 0; urgency 2
- s8 (labs): mustNotMiss 0/1; distractors 0; urgency 2
- s9 (late): mustNotMiss 0/1; distractors 0; urgency 4; late-miss
- s10 (other): mustNotMiss 0/1; distractors 0; urgency 5
- s11 (vitals): mustNotMiss 0/1; distractors 0; urgency 5

- Perdeu diagnóstico crítico (mustNotMiss).

### ecc-cv-08 — Epigastralgia em trabalhador rural — choque na observação

- Difficulty: very_hard  Criticality: critical  Complexity: 10
- Domain: cardiovascular
- Status: FAIL  score 68
- Kinds: INTEGRATION_MISS, CRITICAL_MISS, PREMATURE_CLOSURE, LATE_INFO_MISS, TEMPORAL_UPDATE_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 0/2; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/2; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 0/2; distractors 0; urgency 2
- s4 (meds): mustNotMiss 0/2; distractors 0; urgency 4
- s5 (exam): mustNotMiss 0/2; distractors 0; urgency 5
- s6 (vitals): mustNotMiss 0/2; distractors 0; urgency 5
- s7 (ecg): mustNotMiss 0/2; distractors 0; urgency 5
- s8 (labs): mustNotMiss 0/2; distractors 0; urgency 5
- s9 (late): mustNotMiss 0/2; distractors 0; urgency 5; late-miss
- s10 (imaging): mustNotMiss 0/2; distractors 0; urgency 5
- s11 (deterioration): mustNotMiss 0/2; distractors 0; urgency 5
- s12 (vitals): mustNotMiss 0/2; distractors 0; urgency 5

- Perdeu diagnóstico crítico (mustNotMiss).

### ecc-cv-09 — Dor precordial em motoboy após virose — supradesnivelamento difuso

- Difficulty: very_hard  Criticality: noncritical  Complexity: 8
- Domain: cardiovascular
- Status: PASS  score 86
- Kinds: INTEGRATION_MISS
- Diverge segment: s11

Segment trace:
- s1 (presentation): mustNotMiss 0/0; distractors 0; urgency 3
- s2 (hpi): mustNotMiss 0/0; distractors 0; urgency 4
- s3 (pmh): mustNotMiss 0/0; distractors 0; urgency 4
- s4 (meds): mustNotMiss 0/0; distractors 0; urgency 4
- s5 (exam): mustNotMiss 0/0; distractors 0; urgency 4
- s6 (vitals): mustNotMiss 0/0; distractors 0; urgency 4
- s7 (ecg): mustNotMiss 0/0; distractors 0; urgency 4
- s8 (labs): mustNotMiss 0/0; distractors 0; urgency 4
- s9 (imaging): mustNotMiss 0/0; distractors 0; urgency 4
- s10 (other): mustNotMiss 0/0; distractors 0; urgency 4
- s11 (vitals): mustNotMiss 0/0; distractors 0; urgency 5


### ecc-cv-10 — Dor torácica reproduzível após treino de peito — ECG normal

- Difficulty: moderate  Criticality: noncritical  Complexity: 6
- Domain: cardiovascular
- Status: PASS  score 79
- Kinds: INTEGRATION_MISS
- Diverge segment: s11

Segment trace:
- s1 (presentation): mustNotMiss 0/0; distractors 3; urgency 3
- s2 (hpi): mustNotMiss 0/0; distractors 3; urgency 3
- s3 (pmh): mustNotMiss 0/0; distractors 3; urgency 3
- s4 (meds): mustNotMiss 0/0; distractors 3; urgency 3
- s5 (exam): mustNotMiss 0/0; distractors 2; urgency 4
- s6 (vitals): mustNotMiss 0/0; distractors 1; urgency 5
- s7 (ecg): mustNotMiss 0/0; distractors 1; urgency 5
- s8 (labs): mustNotMiss 0/0; distractors 1; urgency 5
- s9 (other): mustNotMiss 0/0; distractors 0; urgency 5
- s10 (improvement): mustNotMiss 0/0; distractors 1; urgency 5
- s11 (hpi): mustNotMiss 0/0; distractors 1; urgency 5


### ecc-neuro-01 — Cefaleia súbita em migranosa — HSA atrasada por enxaqueca

- Difficulty: very_hard  Criticality: critical  Complexity: 9
- Domain: neurologic
- Status: FAIL  score 53
- Kinds: INTEGRATION_MISS, CRITICAL_MISS, PREMATURE_CLOSURE
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 1; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 1; urgency 2
- s3 (pmh): mustNotMiss 0/1; distractors 1; urgency 2
- s4 (meds): mustNotMiss 0/1; distractors 1; urgency 2
- s5 (exam): mustNotMiss 0/1; distractors 1; urgency 2
- s6 (vitals): mustNotMiss 0/1; distractors 1; urgency 2
- s7 (labs): mustNotMiss 0/1; distractors 1; urgency 2
- s8 (other): mustNotMiss 0/1; distractors 1; urgency 2
- s9 (late): mustNotMiss 0/1; distractors 1; urgency 3; late-miss
- s10 (deterioration): mustNotMiss 0/1; distractors 1; urgency 3
- s11 (exam): mustNotMiss 0/1; distractors 1; urgency 4
- s12 (other): mustNotMiss 0/1; distractors 1; urgency 5

- Perdeu diagnóstico crítico (mustNotMiss).

### ecc-neuro-02 — Confusão em FA anticoagulado — AVC com última vez normal tardia

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: neurologic
- Status: PASS  score 73
- Kinds: INTEGRATION_MISS, LATE_INFO_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 1; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 1; urgency 2
- s3 (pmh): mustNotMiss 0/1; distractors 1; urgency 2
- s4 (meds): mustNotMiss 0/1; distractors 1; urgency 2
- s5 (exam): mustNotMiss 0/1; distractors 1; urgency 2
- s6 (vitals): mustNotMiss 0/1; distractors 1; urgency 2
- s7 (labs): mustNotMiss 1/1; distractors 1; urgency 2
- s8 (ecg): mustNotMiss 1/1; distractors 1; urgency 2
- s9 (late): mustNotMiss 1/1; distractors 1; urgency 2; late-miss
- s10 (exam): mustNotMiss 1/1; distractors 1; urgency 2
- s11 (other): mustNotMiss 1/1; distractors 1; urgency 2


### ecc-neuro-03 — Queda em idosa — ICH versus isquemia, rivaroxabana corrigida

- Difficulty: very_hard  Criticality: critical  Complexity: 10
- Domain: neurologic
- Status: PASS  score 85
- Kinds: TEMPORAL_UPDATE_MISS
- Diverge segment: s11

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 0; urgency 4
- s3 (pmh): mustNotMiss 0/1; distractors 0; urgency 4
- s4 (meds): mustNotMiss 1/1; distractors 0; urgency 5
- s5 (exam): mustNotMiss 1/1; distractors 0; urgency 5
- s6 (vitals): mustNotMiss 1/1; distractors 0; urgency 5
- s7 (labs): mustNotMiss 0/1; distractors 0; urgency 5
- s8 (ecg): mustNotMiss 1/1; distractors 0; urgency 5
- s9 (correction): mustNotMiss 1/1; distractors 0; urgency 5
- s10 (late): mustNotMiss 1/1; distractors 0; urgency 5
- s11 (deterioration): mustNotMiss 0/1; distractors 0; urgency 5
- s12 (other): mustNotMiss 1/1; distractors 0; urgency 5
- s13 (exam): mustNotMiss 1/1; distractors 0; urgency 5


### ecc-neuro-04 — Convulsão em “epiléptico conhecido” — hipoglicemia não checada

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: neurologic
- Status: PASS  score 82
- Kinds: INTEGRATION_MISS, LATE_INFO_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 1/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 1/1; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 1/1; distractors 0; urgency 2
- s4 (meds): mustNotMiss 1/1; distractors 0; urgency 3
- s5 (exam): mustNotMiss 1/1; distractors 0; urgency 3
- s6 (vitals): mustNotMiss 1/1; distractors 0; urgency 3
- s7 (ecg): mustNotMiss 0/1; distractors 0; urgency 5
- s8 (labs): mustNotMiss 0/1; distractors 0; urgency 5
- s9 (late): mustNotMiss 1/1; distractors 0; urgency 5; late-miss
- s10 (other): mustNotMiss 1/1; distractors 0; urgency 5
- s11 (vitals): mustNotMiss 0/1; distractors 0; urgency 5


### ecc-neuro-05 — Idosa afebril confusa — meningite sem febre clássica

- Difficulty: very_hard  Criticality: critical  Complexity: 9
- Domain: neurologic
- Status: PASS  score 75
- Kinds: INTEGRATION_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 1/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 1/1; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 1/1; distractors 0; urgency 2
- s4 (meds): mustNotMiss 1/1; distractors 0; urgency 2
- s5 (exam): mustNotMiss 1/1; distractors 0; urgency 2
- s6 (vitals): mustNotMiss 1/1; distractors 0; urgency 2
- s7 (labs): mustNotMiss 1/1; distractors 0; urgency 2
- s8 (other): mustNotMiss 1/1; distractors 0; urgency 2
- s9 (late): mustNotMiss 1/1; distractors 0; urgency 2; late-miss
- s10 (deterioration): mustNotMiss 1/1; distractors 0; urgency 3
- s11 (exam): mustNotMiss 1/1; distractors 0; urgency 3
- s12 (other): mustNotMiss 1/1; distractors 0; urgency 3


### ecc-neuro-06 — “Labirintite” em hipertenso — vertigem central versus periférica

- Difficulty: hard  Criticality: critical  Complexity: 7
- Domain: neurologic
- Status: PASS  score 83
- Kinds: INTEGRATION_MISS, LATE_INFO_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 1/1; distractors 1; urgency 2
- s2 (hpi): mustNotMiss 1/1; distractors 1; urgency 2
- s3 (pmh): mustNotMiss 1/1; distractors 1; urgency 2
- s4 (meds): mustNotMiss 1/1; distractors 1; urgency 3
- s5 (exam): mustNotMiss 1/1; distractors 1; urgency 3
- s6 (vitals): mustNotMiss 1/1; distractors 1; urgency 4
- s7 (labs): mustNotMiss 1/1; distractors 1; urgency 4
- s8 (ecg): mustNotMiss 1/1; distractors 1; urgency 4
- s9 (late): mustNotMiss 0/1; distractors 1; urgency 4; late-miss
- s10 (exam): mustNotMiss 0/1; distractors 1; urgency 4
- s11 (other): mustNotMiss 0/1; distractors 1; urgency 4


### ecc-resp-01 — Dispneia com tosse e panturrilha — TEP atrasado por pneumonia

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: respiratory
- Status: PASS  score 75
- Kinds: INTEGRATION_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 1; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 1; urgency 2
- s3 (pmh): mustNotMiss 0/1; distractors 1; urgency 2
- s4 (meds): mustNotMiss 0/1; distractors 1; urgency 2
- s5 (exam): mustNotMiss 0/1; distractors 1; urgency 3
- s6 (vitals): mustNotMiss 0/1; distractors 1; urgency 3
- s7 (labs): mustNotMiss 0/1; distractors 1; urgency 3
- s8 (ecg): mustNotMiss 0/1; distractors 1; urgency 3
- s9 (imaging): mustNotMiss 0/1; distractors 1; urgency 3
- s10 (late): mustNotMiss 0/1; distractors 1; urgency 3; late-miss
- s11 (deterioration): mustNotMiss 0/1; distractors 1; urgency 3
- s12 (other): mustNotMiss 0/1; distractors 1; urgency 4


### ecc-resp-02 — DPOC “exacerbado” — pneumotórax hipertensivo atrasado

- Difficulty: very_hard  Criticality: critical  Complexity: 9
- Domain: respiratory
- Status: PASS  score 85
- Kinds: LATE_INFO_MISS, TEMPORAL_UPDATE_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 1/1; distractors 2; urgency 2
- s2 (hpi): mustNotMiss 1/1; distractors 1; urgency 3
- s3 (pmh): mustNotMiss 0/1; distractors 1; urgency 4
- s4 (meds): mustNotMiss 0/1; distractors 1; urgency 4
- s5 (exam): mustNotMiss 1/1; distractors 1; urgency 4
- s6 (vitals): mustNotMiss 1/1; distractors 1; urgency 4
- s7 (labs): mustNotMiss 1/1; distractors 1; urgency 4
- s8 (other): mustNotMiss 1/1; distractors 1; urgency 4
- s9 (late): mustNotMiss 1/1; distractors 1; urgency 4; late-miss
- s10 (deterioration): mustNotMiss 1/1; distractors 1; urgency 4
- s11 (exam): mustNotMiss 1/1; distractors 1; urgency 4
- s12 (other): mustNotMiss 1/1; distractors 1; urgency 4


### ecc-resp-03 — Crepitações, tosse e ortopneia — pneumonia versus edema

- Difficulty: hard  Criticality: noncritical  Complexity: 7
- Domain: respiratory
- Status: PASS  score 78
- Kinds: INTEGRATION_MISS, LATE_INFO_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 0/0; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/0; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 0/0; distractors 0; urgency 3
- s4 (meds): mustNotMiss 0/0; distractors 0; urgency 4
- s5 (exam): mustNotMiss 0/0; distractors 0; urgency 4
- s6 (vitals): mustNotMiss 0/0; distractors 0; urgency 4
- s7 (labs): mustNotMiss 0/0; distractors 0; urgency 4
- s8 (ecg): mustNotMiss 0/0; distractors 0; urgency 4
- s9 (imaging): mustNotMiss 0/0; distractors 0; urgency 5
- s10 (late): mustNotMiss 0/0; distractors 0; urgency 5; late-miss
- s11 (other): mustNotMiss 0/0; distractors 0; urgency 5


### ecc-resp-04 — DPOC “só cansado” — hipercapnia com gasometria tardia

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: respiratory
- Status: FAIL  score 48
- Kinds: INTEGRATION_MISS, CRITICAL_MISS, TEMPORAL_UPDATE_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 0; urgency 3
- s3 (pmh): mustNotMiss 0/1; distractors 1; urgency 3
- s4 (meds): mustNotMiss 0/1; distractors 1; urgency 3
- s5 (exam): mustNotMiss 0/1; distractors 1; urgency 4
- s6 (vitals): mustNotMiss 0/1; distractors 1; urgency 4
- s7 (labs): mustNotMiss 0/1; distractors 1; urgency 5
- s8 (other): mustNotMiss 0/1; distractors 1; urgency 5
- s9 (late): mustNotMiss 0/1; distractors 1; urgency 5; late-miss
- s10 (deterioration): mustNotMiss 0/1; distractors 1; urgency 5
- s11 (exam): mustNotMiss 0/1; distractors 1; urgency 5
- s12 (other): mustNotMiss 0/1; distractors 1; urgency 5

- Perdeu diagnóstico crítico (mustNotMiss).

### ecc-resp-05 — Sibilância após gato — asma que melhora na sala

- Difficulty: moderate  Criticality: noncritical  Complexity: 6
- Domain: respiratory
- Status: PASS  score 75
- Kinds: INTEGRATION_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 0/0; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/0; distractors 0; urgency 3
- s3 (pmh): mustNotMiss 0/0; distractors 1; urgency 3
- s4 (meds): mustNotMiss 0/0; distractors 1; urgency 3
- s5 (exam): mustNotMiss 0/0; distractors 1; urgency 3
- s6 (vitals): mustNotMiss 0/0; distractors 1; urgency 3
- s7 (labs): mustNotMiss 0/0; distractors 1; urgency 3
- s8 (other): mustNotMiss 0/0; distractors 1; urgency 3
- s9 (improvement): mustNotMiss 0/0; distractors 1; urgency 3
- s10 (exam): mustNotMiss 0/0; distractors 1; urgency 3


### ecc-resp-06 — Sonolência em usuário de morfina — aspiração e opioide juntos

- Difficulty: very_hard  Criticality: critical  Complexity: 9
- Domain: respiratory
- Status: PASS  score 93
- Kinds: INTEGRATION_MISS, TEMPORAL_UPDATE_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 2; urgency 2
- s3 (pmh): mustNotMiss 0/1; distractors 2; urgency 2
- s4 (meds): mustNotMiss 0/1; distractors 2; urgency 2
- s5 (exam): mustNotMiss 0/1; distractors 1; urgency 2
- s6 (vitals): mustNotMiss 0/1; distractors 1; urgency 3
- s7 (labs): mustNotMiss 0/1; distractors 1; urgency 3
- s8 (imaging): mustNotMiss 0/1; distractors 1; urgency 3
- s9 (late): mustNotMiss 0/1; distractors 1; urgency 3; late-miss
- s10 (deterioration): mustNotMiss 0/1; distractors 1; urgency 3
- s11 (exam): mustNotMiss 0/1; distractors 1; urgency 3
- s12 (other): mustNotMiss 0/1; distractors 1; urgency 3


### ecc-resp-07 — Dispneia em jovem “ansiosa” — TEP com ancoragem em crise

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: respiratory
- Status: PASS  score 85
- Kinds: INTEGRATION_MISS, LATE_INFO_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 1; urgency 2
- s3 (pmh): mustNotMiss 0/1; distractors 1; urgency 2
- s4 (meds): mustNotMiss 0/1; distractors 1; urgency 2
- s5 (exam): mustNotMiss 0/1; distractors 1; urgency 2
- s6 (vitals): mustNotMiss 0/1; distractors 1; urgency 2
- s7 (labs): mustNotMiss 0/1; distractors 1; urgency 2
- s8 (ecg): mustNotMiss 0/1; distractors 1; urgency 2
- s9 (late): mustNotMiss 0/1; distractors 1; urgency 2; late-miss
- s10 (deterioration): mustNotMiss 0/1; distractors 1; urgency 2
- s11 (other): mustNotMiss 0/1; distractors 2; urgency 2


### ecc-resp-08 — Falta de ar após treino — dor musculoesquelética que melhora

- Difficulty: moderate  Criticality: noncritical  Complexity: 6
- Domain: respiratory
- Status: PASS  score 80
- Kinds: INTEGRATION_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 0/0; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/0; distractors 0; urgency 4
- s3 (pmh): mustNotMiss 0/0; distractors 0; urgency 4
- s4 (meds): mustNotMiss 0/0; distractors 0; urgency 4
- s5 (exam): mustNotMiss 0/0; distractors 0; urgency 4
- s6 (vitals): mustNotMiss 0/0; distractors 0; urgency 4
- s7 (ecg): mustNotMiss 0/0; distractors 0; urgency 4
- s8 (labs): mustNotMiss 0/0; distractors 0; urgency 4
- s9 (other): mustNotMiss 0/0; distractors 0; urgency 4
- s10 (improvement): mustNotMiss 0/0; distractors 0; urgency 4


### ecc-inf-01 — Lombalgia em reumática afebril — choque oculto e foco tardio

- Difficulty: very_hard  Criticality: critical  Complexity: 9
- Domain: infectious
- Status: PASS  score 88
- Kinds: INTEGRATION_MISS, TEMPORAL_UPDATE_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 1/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 1/1; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 1/1; distractors 0; urgency 2
- s4 (meds): mustNotMiss 1/1; distractors 0; urgency 2
- s5 (exam): mustNotMiss 1/1; distractors 0; urgency 2
- s6 (vitals): mustNotMiss 1/1; distractors 0; urgency 2
- s7 (ecg): mustNotMiss 1/1; distractors 0; urgency 2
- s8 (labs): mustNotMiss 1/1; distractors 0; urgency 2
- s9 (correction): mustNotMiss 1/1; distractors 0; urgency 2
- s10 (late): mustNotMiss 1/1; distractors 0; urgency 2; late-miss
- s11 (deterioration): mustNotMiss 1/1; distractors 0; urgency 2
- s12 (labs): mustNotMiss 1/1; distractors 0; urgency 2


### ecc-inf-02 — Professora com “gripe da escola” — fotofobia só depois

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: infectious
- Status: PASS  score 83
- Kinds: INTEGRATION_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 1; urgency 2
- s2 (hpi): mustNotMiss 1/1; distractors 1; urgency 2
- s3 (pmh): mustNotMiss 1/1; distractors 1; urgency 3
- s4 (meds): mustNotMiss 1/1; distractors 1; urgency 3
- s5 (exam): mustNotMiss 1/1; distractors 1; urgency 3
- s6 (vitals): mustNotMiss 1/1; distractors 1; urgency 3
- s7 (labs): mustNotMiss 1/1; distractors 1; urgency 3
- s8 (correction): mustNotMiss 1/1; distractors 1; urgency 3
- s9 (late): mustNotMiss 1/1; distractors 1; urgency 3; late-miss
- s10 (deterioration): mustNotMiss 0/1; distractors 1; urgency 4
- s11 (other): mustNotMiss 0/1; distractors 1; urgency 4


### ecc-inf-03 — Tosse e sede em diabético que parou a insulina

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: infectious
- Status: FAIL  score 45
- Kinds: INTEGRATION_MISS, CRITICAL_MISS, LATE_INFO_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 0/1; distractors 0; urgency 2
- s4 (meds): mustNotMiss 0/1; distractors 0; urgency 2
- s5 (exam): mustNotMiss 0/1; distractors 0; urgency 3
- s6 (vitals): mustNotMiss 0/1; distractors 0; urgency 3
- s7 (ecg): mustNotMiss 0/1; distractors 0; urgency 3
- s8 (correction): mustNotMiss 0/1; distractors 0; urgency 3
- s9 (labs): mustNotMiss 0/1; distractors 0; urgency 3
- s10 (late): mustNotMiss 0/1; distractors 0; urgency 3; late-miss
- s11 (imaging): mustNotMiss 0/1; distractors 0; urgency 3

- Perdeu diagnóstico crítico (mustNotMiss).

### ecc-inf-04 — Celulite de coxa após dipirona intramuscular — dor desproporcional

- Difficulty: very_hard  Criticality: critical  Complexity: 10
- Domain: infectious
- Status: FAIL  score 60
- Kinds: INTEGRATION_MISS, CRITICAL_MISS, PREMATURE_CLOSURE, CORRECTION_MISS, TEMPORAL_UPDATE_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 0/1; distractors 0; urgency 2
- s4 (meds): mustNotMiss 0/1; distractors 0; urgency 2
- s5 (exam): mustNotMiss 0/1; distractors 0; urgency 2
- s6 (vitals): mustNotMiss 0/1; distractors 0; urgency 3
- s7 (labs): mustNotMiss 0/1; distractors 0; urgency 3
- s8 (correction): mustNotMiss 0/1; distractors 0; urgency 3
- s9 (late): mustNotMiss 0/1; distractors 0; urgency 3; late-miss
- s10 (deterioration): mustNotMiss 0/1; distractors 0; urgency 3
- s11 (labs): mustNotMiss 0/1; distractors 0; urgency 3

- Perdeu diagnóstico crítico (mustNotMiss).

### ecc-inf-05 — Resfriado em transplantado renal afebril

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: infectious
- Status: PASS  score 85
- Kinds: LATE_INFO_MISS, CORRECTION_MISS, TEMPORAL_UPDATE_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 1/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 1/1; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 1/1; distractors 0; urgency 2
- s4 (meds): mustNotMiss 1/1; distractors 0; urgency 2
- s5 (exam): mustNotMiss 1/1; distractors 0; urgency 3
- s6 (vitals): mustNotMiss 1/1; distractors 0; urgency 3
- s7 (labs): mustNotMiss 1/1; distractors 0; urgency 3
- s8 (correction): mustNotMiss 1/1; distractors 0; urgency 3
- s9 (late): mustNotMiss 1/1; distractors 0; urgency 4; late-miss
- s10 (deterioration): mustNotMiss 1/1; distractors 0; urgency 4
- s11 (imaging): mustNotMiss 1/1; distractors 0; urgency 4


### ecc-inf-06 — Mialgia febril em jovem que melhora na observação

- Difficulty: moderate  Criticality: noncritical  Complexity: 6
- Domain: infectious
- Status: PASS  score 70
- Kinds: INTEGRATION_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 0/0; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/0; distractors 0; urgency 5
- s3 (pmh): mustNotMiss 0/0; distractors 0; urgency 5
- s4 (meds): mustNotMiss 0/0; distractors 0; urgency 5
- s5 (exam): mustNotMiss 0/0; distractors 0; urgency 5
- s6 (vitals): mustNotMiss 0/0; distractors 0; urgency 5
- s7 (correction): mustNotMiss 0/0; distractors 0; urgency 5
- s8 (labs): mustNotMiss 0/0; distractors 0; urgency 5
- s9 (late): mustNotMiss 0/0; distractors 0; urgency 5; late-miss
- s10 (improvement): mustNotMiss 0/0; distractors 0; urgency 5


### ecc-inf-07 — Indigestão após feijoada — tríade tardia

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: infectious
- Status: FAIL  score 50
- Kinds: INTEGRATION_MISS, CRITICAL_MISS, DISTRACTOR_CAPTURE, PREMATURE_CLOSURE, LATE_INFO_MISS, CORRECTION_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 1; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 1; urgency 2
- s3 (pmh): mustNotMiss 0/1; distractors 1; urgency 2
- s4 (meds): mustNotMiss 0/1; distractors 2; urgency 2
- s5 (exam): mustNotMiss 0/1; distractors 2; urgency 2
- s6 (vitals): mustNotMiss 0/1; distractors 2; urgency 2
- s7 (ecg): mustNotMiss 0/1; distractors 2; urgency 2
- s8 (labs): mustNotMiss 0/1; distractors 2; urgency 2
- s9 (correction): mustNotMiss 0/1; distractors 2; urgency 2
- s10 (late): mustNotMiss 0/1; distractors 2; urgency 2; late-miss
- s11 (deterioration): mustNotMiss 0/1; distractors 2; urgency 3

- Perdeu diagnóstico crítico (mustNotMiss).

### ecc-inf-08 — Mal-estar pós-hemodiálise em paciente com cateter de longa permanência

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: infectious
- Status: PASS  score 85
- Kinds: INTEGRATION_MISS, LATE_INFO_MISS, CORRECTION_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 0/1; distractors 0; urgency 2
- s4 (meds): mustNotMiss 0/1; distractors 0; urgency 2
- s5 (exam): mustNotMiss 0/1; distractors 0; urgency 3
- s6 (vitals): mustNotMiss 0/1; distractors 0; urgency 3
- s7 (ecg): mustNotMiss 0/1; distractors 0; urgency 3
- s8 (labs): mustNotMiss 0/1; distractors 0; urgency 3
- s9 (correction): mustNotMiss 0/1; distractors 0; urgency 3
- s10 (late): mustNotMiss 0/1; distractors 0; urgency 3; late-miss
- s11 (deterioration): mustNotMiss 0/1; distractors 0; urgency 4


### ecc-gi-01 — Tontura em anticoagulado que “só tem gastrite” — borra tardia

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: gi
- Status: PASS  score 70
- Kinds: INTEGRATION_MISS, CORRECTION_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 1; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 1; urgency 2
- s3 (pmh): mustNotMiss 0/1; distractors 1; urgency 2
- s4 (meds): mustNotMiss 0/1; distractors 1; urgency 3
- s5 (exam): mustNotMiss 1/1; distractors 1; urgency 4
- s6 (vitals): mustNotMiss 1/1; distractors 1; urgency 4
- s7 (ecg): mustNotMiss 1/1; distractors 1; urgency 4
- s8 (labs): mustNotMiss 1/1; distractors 1; urgency 4
- s9 (correction): mustNotMiss 1/1; distractors 1; urgency 4
- s10 (late): mustNotMiss 1/1; distractors 1; urgency 4; late-miss
- s11 (deterioration): mustNotMiss 1/1; distractors 1; urgency 4
- s12 (labs): mustNotMiss 1/1; distractors 1; urgency 5


### ecc-gi-02 — Diarreia após pão da padaria — dor desproporcional e FA

- Difficulty: very_hard  Criticality: critical  Complexity: 10
- Domain: gi
- Status: FAIL  score 40
- Kinds: INTEGRATION_MISS, CRITICAL_MISS, DISTRACTOR_CAPTURE, PREMATURE_CLOSURE, CORRECTION_MISS, TEMPORAL_UPDATE_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 0/1; distractors 0; urgency 2
- s4 (meds): mustNotMiss 0/1; distractors 0; urgency 2
- s5 (exam): mustNotMiss 0/1; distractors 0; urgency 2
- s6 (vitals): mustNotMiss 0/1; distractors 0; urgency 2
- s7 (labs): mustNotMiss 0/1; distractors 0; urgency 2
- s8 (correction): mustNotMiss 0/1; distractors 0; urgency 2
- s9 (late): mustNotMiss 0/1; distractors 1; urgency 2; late-miss
- s10 (deterioration): mustNotMiss 0/1; distractors 1; urgency 2
- s11 (ecg): mustNotMiss 0/1; distractors 1; urgency 2

- Perdeu diagnóstico crítico (mustNotMiss).

### ecc-gi-03 — Epigastralgia em etilista — lipase e ECG no mesmo turno

- Difficulty: hard  Criticality: noncritical  Complexity: 8
- Domain: gi
- Status: PASS  score 85
- Kinds: LATE_INFO_MISS, CORRECTION_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 0; urgency 4
- s3 (pmh): mustNotMiss 0/1; distractors 0; urgency 4
- s4 (meds): mustNotMiss 0/1; distractors 0; urgency 4
- s5 (exam): mustNotMiss 0/1; distractors 0; urgency 4
- s6 (vitals): mustNotMiss 0/1; distractors 0; urgency 4
- s7 (ecg): mustNotMiss 0/1; distractors 0; urgency 4
- s8 (correction): mustNotMiss 0/1; distractors 0; urgency 4
- s9 (labs): mustNotMiss 0/1; distractors 0; urgency 4
- s10 (late): mustNotMiss 0/1; distractors 0; urgency 4; late-miss
- s11 (other): mustNotMiss 0/1; distractors 0; urgency 4


### ecc-gi-04 — Má digestão em diabética — Murphy que só aparece depois

- Difficulty: hard  Criticality: noncritical  Complexity: 7
- Domain: gi
- Status: PASS  score 70
- Kinds: INTEGRATION_MISS, LATE_INFO_MISS, CORRECTION_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 0/1; distractors 0; urgency 2
- s4 (meds): mustNotMiss 0/1; distractors 0; urgency 2
- s5 (exam): mustNotMiss 0/1; distractors 0; urgency 2
- s6 (vitals): mustNotMiss 0/1; distractors 0; urgency 2
- s7 (ecg): mustNotMiss 0/1; distractors 0; urgency 2
- s8 (labs): mustNotMiss 0/1; distractors 0; urgency 2
- s9 (correction): mustNotMiss 0/1; distractors 0; urgency 2
- s10 (late): mustNotMiss 0/1; distractors 0; urgency 2; late-miss
- s11 (imaging): mustNotMiss 0/1; distractors 0; urgency 2


### ecc-gi-05 — Dor de úlcera em quem soma AINE e prednisona — tábua tardia

- Difficulty: very_hard  Criticality: critical  Complexity: 9
- Domain: gi
- Status: PASS  score 80
- Kinds: CORRECTION_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 1/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 1/1; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 1/1; distractors 0; urgency 2
- s4 (meds): mustNotMiss 1/1; distractors 0; urgency 2
- s5 (exam): mustNotMiss 1/1; distractors 0; urgency 2
- s6 (vitals): mustNotMiss 1/1; distractors 0; urgency 2
- s7 (labs): mustNotMiss 1/1; distractors 0; urgency 2
- s8 (correction): mustNotMiss 1/1; distractors 0; urgency 2
- s9 (late): mustNotMiss 1/1; distractors 0; urgency 2; late-miss
- s10 (deterioration): mustNotMiss 1/1; distractors 0; urgency 2
- s11 (imaging): mustNotMiss 1/1; distractors 0; urgency 4


### ecc-gi-06 — Vômitos após churrasco em adulto jovem que rehidrata e melhora

- Difficulty: moderate  Criticality: noncritical  Complexity: 6
- Domain: gi
- Status: PASS  score 75
- Kinds: INTEGRATION_MISS, LATE_INFO_MISS, CORRECTION_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 0/0; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/0; distractors 0; urgency 4
- s3 (pmh): mustNotMiss 0/0; distractors 0; urgency 4
- s4 (meds): mustNotMiss 0/0; distractors 0; urgency 4
- s5 (exam): mustNotMiss 0/0; distractors 0; urgency 5
- s6 (vitals): mustNotMiss 0/0; distractors 0; urgency 5
- s7 (correction): mustNotMiss 0/0; distractors 0; urgency 5
- s8 (labs): mustNotMiss 0/0; distractors 0; urgency 5
- s9 (late): mustNotMiss 0/0; distractors 0; urgency 5; late-miss
- s10 (improvement): mustNotMiss 0/0; distractors 0; urgency 5


### ecc-trauma-01 — Queda da própria altura em idosa “sem sangue fino” — Glasgow que cai

- Difficulty: very_hard  Criticality: critical  Complexity: 10
- Domain: trauma
- Status: PASS  score 80
- Kinds: INTEGRATION_MISS, TEMPORAL_UPDATE_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 2/2; distractors 0; urgency 4
- s2 (hpi): mustNotMiss 2/2; distractors 0; urgency 4
- s3 (pmh): mustNotMiss 2/2; distractors 0; urgency 4
- s4 (meds): mustNotMiss 2/2; distractors 0; urgency 4
- s5 (exam): mustNotMiss 2/2; distractors 0; urgency 4
- s6 (vitals): mustNotMiss 2/2; distractors 0; urgency 4
- s7 (ecg): mustNotMiss 2/2; distractors 0; urgency 4
- s8 (labs): mustNotMiss 2/2; distractors 0; urgency 4
- s9 (correction): mustNotMiss 2/2; distractors 0; urgency 4
- s10 (late): mustNotMiss 2/2; distractors 0; urgency 4; late-miss
- s11 (deterioration): mustNotMiss 2/2; distractors 0; urgency 4
- s12 (other): mustNotMiss 2/2; distractors 0; urgency 4


### ecc-trauma-02 — Motocicleta em baixa velocidade — falta de ar que chega tarde

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: trauma
- Status: PASS  score 70
- Kinds: INTEGRATION_MISS, CORRECTION_MISS, TEMPORAL_UPDATE_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 1/1; distractors 0; urgency 3
- s2 (hpi): mustNotMiss 1/1; distractors 0; urgency 4
- s3 (pmh): mustNotMiss 1/1; distractors 0; urgency 5
- s4 (meds): mustNotMiss 0/1; distractors 0; urgency 5
- s5 (exam): mustNotMiss 1/1; distractors 0; urgency 5
- s6 (vitals): mustNotMiss 1/1; distractors 0; urgency 5
- s7 (ecg): mustNotMiss 1/1; distractors 0; urgency 5
- s8 (labs): mustNotMiss 0/1; distractors 0; urgency 5
- s9 (correction): mustNotMiss 1/1; distractors 0; urgency 5
- s10 (late): mustNotMiss 1/1; distractors 0; urgency 5; late-miss
- s11 (deterioration): mustNotMiss 1/1; distractors 0; urgency 5
- s12 (imaging): mustNotMiss 0/1; distractors 0; urgency 5


### ecc-trauma-03 — João de bicicleta no flanco — estável que descompensa

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: trauma
- Status: FAIL  score 50
- Kinds: INTEGRATION_MISS, CRITICAL_MISS, LATE_INFO_MISS, CORRECTION_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 0/1; distractors 0; urgency 2
- s4 (meds): mustNotMiss 0/1; distractors 0; urgency 2
- s5 (exam): mustNotMiss 0/1; distractors 0; urgency 2
- s6 (vitals): mustNotMiss 0/1; distractors 0; urgency 2
- s7 (labs): mustNotMiss 0/1; distractors 0; urgency 2
- s8 (correction): mustNotMiss 0/1; distractors 0; urgency 2
- s9 (late): mustNotMiss 0/1; distractors 0; urgency 2; late-miss
- s10 (deterioration): mustNotMiss 0/1; distractors 0; urgency 2
- s11 (labs): mustNotMiss 0/1; distractors 0; urgency 3

- Perdeu diagnóstico crítico (mustNotMiss).

### ecc-trauma-04 — Tropeço no tapete — punho doloroso sem bandeira vermelha

- Difficulty: moderate  Criticality: noncritical  Complexity: 6
- Domain: trauma
- Status: PASS  score 80
- Kinds: INTEGRATION_MISS, LATE_INFO_MISS, CORRECTION_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 0/0; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/0; distractors 0; urgency 3
- s3 (pmh): mustNotMiss 0/0; distractors 0; urgency 5
- s4 (meds): mustNotMiss 0/0; distractors 0; urgency 5
- s5 (exam): mustNotMiss 0/0; distractors 0; urgency 5
- s6 (vitals): mustNotMiss 0/0; distractors 0; urgency 5
- s7 (correction): mustNotMiss 0/0; distractors 0; urgency 5
- s8 (labs): mustNotMiss 0/0; distractors 0; urgency 5
- s9 (late): mustNotMiss 0/0; distractors 0; urgency 5; late-miss
- s10 (improvement): mustNotMiss 0/0; distractors 0; urgency 5


### ecc-trauma-05 — Motociclista sem capacete, hálito etílico e pó — dois problemas ao mesmo tempo

- Difficulty: very_hard  Criticality: critical  Complexity: 10
- Domain: trauma
- Status: PASS  score 80
- Kinds: INTEGRATION_MISS, LATE_INFO_MISS, CORRECTION_MISS, TEMPORAL_UPDATE_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 1/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 1/1; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 1/1; distractors 0; urgency 2
- s4 (meds): mustNotMiss 1/1; distractors 0; urgency 2
- s5 (exam): mustNotMiss 0/1; distractors 0; urgency 3
- s6 (vitals): mustNotMiss 0/1; distractors 0; urgency 3
- s7 (labs): mustNotMiss 0/1; distractors 0; urgency 3
- s8 (correction): mustNotMiss 0/1; distractors 0; urgency 3
- s9 (late): mustNotMiss 0/1; distractors 0; urgency 3; late-miss
- s10 (deterioration): mustNotMiss 0/1; distractors 0; urgency 3
- s11 (exam): mustNotMiss 0/1; distractors 0; urgency 3
- s12 (other): mustNotMiss 0/1; distractors 0; urgency 3


### ecc-tox-01 — Náusea e dor abdominal em diabética com glicemia 186 — acidose tardia

- Difficulty: very_hard  Criticality: critical  Complexity: 9
- Domain: tox_metabolic
- Status: FAIL  score 40
- Kinds: INTEGRATION_MISS, CRITICAL_MISS, PREMATURE_CLOSURE, TEMPORAL_UPDATE_MISS
- Diverge segment: s8

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 0; urgency 4
- s3 (pmh): mustNotMiss 0/1; distractors 0; urgency 4
- s4 (meds): mustNotMiss 0/1; distractors 0; urgency 5
- s5 (exam): mustNotMiss 0/1; distractors 0; urgency 5
- s6 (vitals): mustNotMiss 0/1; distractors 0; urgency 5
- s7 (labs): mustNotMiss 0/1; distractors 0; urgency 5
- s8 (late): mustNotMiss 0/1; distractors 0; urgency 5; late-miss
- s9 (correction): mustNotMiss 0/1; distractors 0; urgency 5
- s10 (deterioration): mustNotMiss 0/1; distractors 0; urgency 5
- s11 (other): mustNotMiss 0/1; distractors 0; urgency 5

- Perdeu diagnóstico crítico (mustNotMiss).

### ecc-tox-02 — Déficit focal no SAMU — glicemia não medida na porta

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: tox_metabolic
- Status: PASS  score 85
- Kinds: CORRECTION_MISS
- Diverge segment: s8

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 0; urgency 3
- s2 (hpi): mustNotMiss 0/1; distractors 0; urgency 4
- s3 (pmh): mustNotMiss 0/1; distractors 0; urgency 4
- s4 (meds): mustNotMiss 0/1; distractors 0; urgency 4
- s5 (exam): mustNotMiss 0/1; distractors 0; urgency 4
- s6 (vitals): mustNotMiss 0/1; distractors 0; urgency 4
- s7 (ecg): mustNotMiss 0/1; distractors 0; urgency 4
- s8 (late): mustNotMiss 1/1; distractors 0; urgency 4; late-miss
- s9 (correction): mustNotMiss 1/1; distractors 0; urgency 4
- s10 (labs): mustNotMiss 1/1; distractors 0; urgency 4
- s11 (other): mustNotMiss 1/1; distractors 0; urgency 4


### ecc-tox-03 — Sonolência e pupilas mióticas após “remédio da dor” da vizinha

- Difficulty: hard  Criticality: critical  Complexity: 7
- Domain: tox_metabolic
- Status: PASS  score 73
- Kinds: INTEGRATION_MISS, LATE_INFO_MISS, CORRECTION_MISS, TEMPORAL_UPDATE_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 1; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 1; urgency 3
- s3 (pmh): mustNotMiss 0/1; distractors 1; urgency 3
- s4 (meds): mustNotMiss 0/1; distractors 1; urgency 3
- s5 (exam): mustNotMiss 0/1; distractors 0; urgency 3
- s6 (vitals): mustNotMiss 0/1; distractors 0; urgency 3
- s7 (labs): mustNotMiss 0/1; distractors 0; urgency 3
- s8 (correction): mustNotMiss 0/1; distractors 0; urgency 3
- s9 (late): mustNotMiss 0/1; distractors 0; urgency 3; late-miss
- s10 (deterioration): mustNotMiss 0/1; distractors 0; urgency 3
- s11 (other): mustNotMiss 0/1; distractors 0; urgency 3


### ecc-tox-04 — Fraqueza em DRC com IECA e espironolactona — ECG muda tarde

- Difficulty: very_hard  Criticality: critical  Complexity: 9
- Domain: tox_metabolic
- Status: FAIL  score 50
- Kinds: INTEGRATION_MISS, CRITICAL_MISS, LATE_INFO_MISS, CORRECTION_MISS, TEMPORAL_UPDATE_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 1; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 1; urgency 2
- s3 (pmh): mustNotMiss 0/1; distractors 1; urgency 2
- s4 (meds): mustNotMiss 0/1; distractors 1; urgency 3
- s5 (exam): mustNotMiss 0/1; distractors 1; urgency 4
- s6 (vitals): mustNotMiss 0/1; distractors 1; urgency 4
- s7 (ecg): mustNotMiss 0/1; distractors 1; urgency 4
- s8 (labs): mustNotMiss 0/1; distractors 1; urgency 4
- s9 (correction): mustNotMiss 0/1; distractors 1; urgency 4
- s10 (late): mustNotMiss 0/1; distractors 1; urgency 4; late-miss
- s11 (deterioration): mustNotMiss 0/1; distractors 1; urgency 4
- s12 (other): mustNotMiss 0/1; distractors 1; urgency 4

- Perdeu diagnóstico crítico (mustNotMiss).

### ecc-tox-05 — Palpitações após festa — melhora com hidratação e lanche

- Difficulty: moderate  Criticality: noncritical  Complexity: 6
- Domain: tox_metabolic
- Status: PASS  score 93
- Kinds: INTEGRATION_MISS, LATE_INFO_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 0/0; distractors 1; urgency 2
- s2 (hpi): mustNotMiss 0/0; distractors 1; urgency 2
- s3 (pmh): mustNotMiss 0/0; distractors 1; urgency 2
- s4 (meds): mustNotMiss 0/0; distractors 1; urgency 2
- s5 (exam): mustNotMiss 0/0; distractors 1; urgency 3
- s6 (vitals): mustNotMiss 0/0; distractors 1; urgency 3
- s7 (ecg): mustNotMiss 0/0; distractors 1; urgency 3
- s8 (labs): mustNotMiss 0/0; distractors 1; urgency 3
- s9 (correction): mustNotMiss 0/0; distractors 1; urgency 3
- s10 (improvement): mustNotMiss 0/0; distractors 1; urgency 3


### ecc-obg-01 — Dor em fossa ilíaca e diarreia — atraso menstrual só depois

- Difficulty: very_hard  Criticality: critical  Complexity: 10
- Domain: obgyn
- Status: PASS  score 85
- Kinds: INTEGRATION_MISS, CORRECTION_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 1; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 1; urgency 2
- s3 (pmh): mustNotMiss 0/1; distractors 1; urgency 2
- s4 (meds): mustNotMiss 0/1; distractors 1; urgency 2
- s5 (exam): mustNotMiss 0/1; distractors 1; urgency 3
- s6 (vitals): mustNotMiss 0/1; distractors 1; urgency 3
- s7 (labs): mustNotMiss 0/1; distractors 1; urgency 3
- s8 (correction): mustNotMiss 0/1; distractors 1; urgency 3
- s9 (late): mustNotMiss 0/1; distractors 1; urgency 4; late-miss
- s10 (deterioration): mustNotMiss 0/1; distractors 1; urgency 5
- s11 (other): mustNotMiss 0/1; distractors 1; urgency 5


### ecc-obg-02 — Cefaleia em gestante de 33 semanas — plaquetas só no segundo lote

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: obgyn
- Status: PASS  score 78
- Kinds: INTEGRATION_MISS, LATE_INFO_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 1/1; distractors 1; urgency 2
- s2 (hpi): mustNotMiss 1/1; distractors 1; urgency 3
- s3 (pmh): mustNotMiss 1/1; distractors 1; urgency 3
- s4 (meds): mustNotMiss 1/1; distractors 1; urgency 3
- s5 (exam): mustNotMiss 1/1; distractors 1; urgency 4
- s6 (vitals): mustNotMiss 1/1; distractors 1; urgency 4
- s7 (labs): mustNotMiss 1/1; distractors 1; urgency 4
- s8 (correction): mustNotMiss 1/1; distractors 1; urgency 4
- s9 (late): mustNotMiss 1/1; distractors 1; urgency 4; late-miss
- s10 (vitals): mustNotMiss 1/1; distractors 1; urgency 4
- s11 (other): mustNotMiss 1/1; distractors 1; urgency 4


### ecc-obg-03 — Falta de ar na 28ª semana — “é a gravidez e a anemia”

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: obgyn
- Status: PASS  score 75
- Kinds: CORRECTION_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 1/1; distractors 1; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 1; urgency 3
- s3 (pmh): mustNotMiss 0/1; distractors 1; urgency 3
- s4 (meds): mustNotMiss 0/1; distractors 1; urgency 3
- s5 (exam): mustNotMiss 0/1; distractors 1; urgency 3
- s6 (vitals): mustNotMiss 0/1; distractors 1; urgency 3
- s7 (ecg): mustNotMiss 0/1; distractors 1; urgency 3
- s8 (labs): mustNotMiss 0/1; distractors 1; urgency 3
- s9 (correction): mustNotMiss 0/1; distractors 1; urgency 3
- s10 (late): mustNotMiss 0/1; distractors 1; urgency 3; late-miss
- s11 (other): mustNotMiss 0/1; distractors 1; urgency 3


### ecc-obg-04 — Parto em casa há três horas — absorvente “normal” que não para

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: obgyn
- Status: FAIL  score 45
- Kinds: INTEGRATION_MISS, CRITICAL_MISS, PREMATURE_CLOSURE, LATE_INFO_MISS, CORRECTION_MISS
- Diverge segment: s8

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 0/1; distractors 0; urgency 2
- s4 (meds): mustNotMiss 0/1; distractors 0; urgency 2
- s5 (exam): mustNotMiss 0/1; distractors 0; urgency 2
- s6 (vitals): mustNotMiss 0/1; distractors 0; urgency 2
- s7 (correction): mustNotMiss 0/1; distractors 0; urgency 2
- s8 (late): mustNotMiss 0/1; distractors 0; urgency 2; late-miss
- s9 (labs): mustNotMiss 0/1; distractors 0; urgency 2
- s10 (deterioration): mustNotMiss 0/1; distractors 0; urgency 2
- s11 (other): mustNotMiss 0/1; distractors 0; urgency 4

- Perdeu diagnóstico crítico (mustNotMiss).

### ecc-obg-05 — Sangramento no início da gestação — estável, colo fechado

- Difficulty: moderate  Criticality: noncritical  Complexity: 6
- Domain: obgyn
- Status: PASS  score 88
- Kinds: INTEGRATION_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 0/0; distractors 0; urgency 3
- s2 (hpi): mustNotMiss 0/0; distractors 0; urgency 3
- s3 (pmh): mustNotMiss 0/0; distractors 0; urgency 5
- s4 (meds): mustNotMiss 0/0; distractors 0; urgency 5
- s5 (exam): mustNotMiss 0/0; distractors 0; urgency 5
- s6 (vitals): mustNotMiss 0/0; distractors 0; urgency 5
- s7 (labs): mustNotMiss 0/0; distractors 0; urgency 5
- s8 (correction): mustNotMiss 0/0; distractors 0; urgency 5
- s9 (late): mustNotMiss 0/0; distractors 0; urgency 5; late-miss
- s10 (improvement): mustNotMiss 0/0; distractors 0; urgency 5


### ecc-und-01 — “Só estou fraca” em diabética — queixo tarde

- Difficulty: very_hard  Criticality: critical  Complexity: 9
- Domain: undifferentiated
- Status: PASS  score 90
- Kinds: LATE_INFO_MISS, CORRECTION_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 1/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 1/1; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 1/1; distractors 0; urgency 2
- s4 (meds): mustNotMiss 1/1; distractors 0; urgency 3
- s5 (exam): mustNotMiss 1/1; distractors 0; urgency 3
- s6 (vitals): mustNotMiss 1/1; distractors 0; urgency 3
- s7 (labs): mustNotMiss 1/1; distractors 0; urgency 3
- s8 (correction): mustNotMiss 1/1; distractors 0; urgency 3
- s9 (late): mustNotMiss 1/1; distractors 0; urgency 3; late-miss
- s10 (ecg): mustNotMiss 1/1; distractors 0; urgency 3
- s11 (other): mustNotMiss 1/1; distractors 0; urgency 3


### ecc-und-02 — Tontura em anticoagulado — “labirintite”, fezes tarde

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: undifferentiated
- Status: PASS  score 75
- Kinds: INTEGRATION_MISS, CORRECTION_MISS, TEMPORAL_UPDATE_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 1/1; distractors 0; urgency 4
- s3 (pmh): mustNotMiss 1/1; distractors 0; urgency 4
- s4 (meds): mustNotMiss 1/1; distractors 0; urgency 4
- s5 (exam): mustNotMiss 1/1; distractors 0; urgency 5
- s6 (vitals): mustNotMiss 1/1; distractors 0; urgency 5
- s7 (ecg): mustNotMiss 1/1; distractors 0; urgency 5
- s8 (labs): mustNotMiss 1/1; distractors 0; urgency 5
- s9 (correction): mustNotMiss 1/1; distractors 0; urgency 5
- s10 (late): mustNotMiss 1/1; distractors 0; urgency 5; late-miss
- s11 (deterioration): mustNotMiss 1/1; distractors 0; urgency 5


### ecc-und-03 — Confusão em idosa — sódio baixo, febre só depois

- Difficulty: hard  Criticality: critical  Complexity: 8
- Domain: undifferentiated
- Status: PASS  score 73
- Kinds: INTEGRATION_MISS, CORRECTION_MISS
- Diverge segment: s9

Segment trace:
- s1 (presentation): mustNotMiss 1/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 1/1; distractors 1; urgency 2
- s3 (pmh): mustNotMiss 1/1; distractors 1; urgency 2
- s4 (meds): mustNotMiss 1/1; distractors 1; urgency 2
- s5 (exam): mustNotMiss 1/1; distractors 1; urgency 2
- s6 (vitals): mustNotMiss 1/1; distractors 1; urgency 2
- s7 (labs): mustNotMiss 1/1; distractors 1; urgency 2
- s8 (correction): mustNotMiss 1/1; distractors 1; urgency 2
- s9 (late): mustNotMiss 1/1; distractors 1; urgency 2; late-miss
- s10 (ecg): mustNotMiss 1/1; distractors 1; urgency 2
- s11 (other): mustNotMiss 1/1; distractors 1; urgency 2


### ecc-und-04 — Mal-estar depois da virose — melhorando, vitais estáveis

- Difficulty: moderate  Criticality: noncritical  Complexity: 6
- Domain: undifferentiated
- Status: PASS  score 75
- Kinds: INTEGRATION_MISS, LATE_INFO_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 0/0; distractors 1; urgency 2
- s2 (hpi): mustNotMiss 0/0; distractors 1; urgency 2
- s3 (pmh): mustNotMiss 0/0; distractors 1; urgency 3
- s4 (meds): mustNotMiss 0/0; distractors 0; urgency 5
- s5 (exam): mustNotMiss 0/0; distractors 0; urgency 5
- s6 (vitals): mustNotMiss 0/0; distractors 0; urgency 5
- s7 (ecg): mustNotMiss 0/0; distractors 0; urgency 5
- s8 (labs): mustNotMiss 0/0; distractors 0; urgency 5
- s9 (correction): mustNotMiss 0/0; distractors 0; urgency 5
- s10 (improvement): mustNotMiss 0/0; distractors 0; urgency 5


### ecc-und-05 — Queda no banheiro — punho inchado, a viagem vem depois

- Difficulty: very_hard  Criticality: critical  Complexity: 9
- Domain: undifferentiated
- Status: FAIL  score 40
- Kinds: INTEGRATION_MISS, CRITICAL_MISS, PREMATURE_CLOSURE, CORRECTION_MISS
- Diverge segment: s10

Segment trace:
- s1 (presentation): mustNotMiss 0/1; distractors 0; urgency 2
- s2 (hpi): mustNotMiss 0/1; distractors 0; urgency 2
- s3 (pmh): mustNotMiss 0/1; distractors 0; urgency 3
- s4 (meds): mustNotMiss 0/1; distractors 0; urgency 4
- s5 (exam): mustNotMiss 0/1; distractors 0; urgency 4
- s6 (vitals): mustNotMiss 0/1; distractors 0; urgency 4
- s7 (imaging): mustNotMiss 0/1; distractors 0; urgency 4
- s8 (labs): mustNotMiss 0/1; distractors 0; urgency 4
- s9 (correction): mustNotMiss 0/1; distractors 0; urgency 4
- s10 (late): mustNotMiss 0/1; distractors 0; urgency 4; late-miss
- s11 (ecg): mustNotMiss 0/1; distractors 0; urgency 4
- s12 (other): mustNotMiss 0/1; distractors 0; urgency 4

- Perdeu diagnóstico crítico (mustNotMiss).
