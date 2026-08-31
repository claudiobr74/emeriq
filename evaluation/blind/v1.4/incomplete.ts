import type { BlindClinicalCase } from "../types";

export const INCOMPLETE_CASES: BlindClinicalCase[] = [
  {
    id: "b-mis-01",
    title: "Ansiedade conhecida com equivalentes isquêmicos",
    category: "misleading",
    severity: "incomplete",
    transcriptSegments: [
      "Mulher de 58 anos, 'é ansiedade, sempre foi'.",
      "Hoje opressão ao caminhar, náusea, suor. Dura vinte minutos.",
    ],
    expected: {
      mustNotMiss: ["síndrome coronariana aguda"],
      expectedDispositionConcept: "urgent",
      clinicallyPlausibleAlternatives: ["ansiedade"],
    },
    forbidden: { mustNotFabricate: ["é só ansiedade"] },
  },
  {
    id: "b-mis-02",
    title: "Jovem saudável após viagem, dispneia",
    category: "misleading",
    severity: "incomplete",
    transcriptSegments: [
      "Rapaz de 25 anos, 'nunca fico doente', volta de intercâmbio de 14 horas de voo.",
      "Falta de ar ao subir dois degraus. Sem febre.",
    ],
    expected: {
      mustNotMiss: ["tromboembolismo pulmonar"],
      expectedDispositionConcept: "urgent",
    },
    forbidden: { mustNotFabricate: ["idade jovem exclui TEP"] },
  },
  {
    id: "b-mis-03",
    title: "Epigástrio de esforço em hipertensa",
    category: "misleading",
    severity: "incomplete",
    transcriptSegments: [
      "Mulher de 69 anos hipertensa, 'é gastrite'.",
      "Queimação no estômago só quando sobe a rampa do mercado. Cansaço.",
    ],
    expected: {
      mustNotMiss: ["síndrome coronariana aguda"],
      shouldTest: ["ECG"],
      expectedDispositionConcept: "urgent",
      clinicallyPlausibleAlternatives: ["dispepsia"],
    },
    forbidden: { mustNotFabricate: ["ECG realizado"] },
  },
  {
    id: "b-mis-04",
    title: "Indigestão em diabético",
    category: "misleading",
    severity: "incomplete",
    transcriptSegments: [
      "Homem de 62 anos diabético, diz que a comida não desceu.",
      "Náusea. Sem falar em peito.",
    ],
    expected: {
      mustNotMiss: ["síndrome coronariana aguda"],
      shouldTest: ["ECG"],
      expectedDispositionConcept: "urgent",
    },
    forbidden: { mustNotFabricate: ["nega dor torácica"] },
  },
  {
    id: "b-mis-05",
    title: "Rotulado como crise psicótica, fotofobia",
    category: "misleading",
    severity: "incomplete",
    transcriptSegments: [
      "Homem de 21 anos, família acha que é surto.",
      "Febre, evita luz, pescoço duro. Desorganizado.",
    ],
    expected: {
      mustNotMiss: ["meningite"],
      expectedDispositionConcept: "emergency",
      clinicallyPlausibleAlternatives: ["encefalite"],
    },
    forbidden: { mustNotFabricate: ["é psiquiátrico"] },
  },
  {
    id: "b-mis-06",
    title: "Ébrio encontrado, hematoma oculto",
    category: "misleading",
    severity: "incomplete",
    transcriptSegments: [
      "Homem de 55 anos 'só bêbado', encontrado na calçada.",
      "Hálito etílico. Há um hematoma atrás da orelha. Mais sonolento agora.",
    ],
    expected: {
      mustNotMiss: ["TCE", "hemorragia intracraniana"],
      expectedDispositionConcept: "emergency",
    },
    forbidden: { mustNotFabricate: ["é só intoxicação alcoólica"] },
  },
  {
    id: "b-mis-07",
    title: "Resfriado que depois dessatura",
    category: "misleading",
    severity: "incomplete",
    transcriptSegments: [
      "Mulher de 47 anos, 'é um resfriado'.",
      "Mais tarde a saturação medida é 86%. Tosse e febre.",
    ],
    expected: {
      mustConsider: ["hipoxemia"],
      mustNotMiss: ["pneumonia"],
      expectedDispositionConcept: "urgent",
      clinicallyPlausibleAlternatives: ["sepse"],
    },
    forbidden: { mustNotFabricate: ["SpO2 98%"] },
  },
  {
    id: "b-mis-08",
    title: "DRGE de etiqueta, mas dor aos esforços",
    category: "misleading",
    severity: "incomplete",
    transcriptSegments: [
      "Homem de 60 anos, ficha diz DRGE.",
      "A 'azia' vem ao varrer o quintal e passa parado.",
    ],
    expected: {
      mustNotMiss: ["síndrome coronariana aguda"],
      shouldTest: ["ECG"],
      expectedDispositionConcept: "urgent",
    },
    forbidden: { mustNotFabricate: ["é DRGE"] },
  },
  {
    id: "b-mis-09",
    title: "Anemia crônica assumida, na verdade melena",
    category: "misleading",
    severity: "incomplete",
    transcriptSegments: [
      "Senhora de 72 anos, 'minha anemia de sempre'.",
      "Cansaço pior. Só depois: fezes pretas esta semana. Usa diclofenaco.",
    ],
    expected: {
      mustNotMiss: ["hemorragia digestiva"],
      expectedDispositionConcept: "urgent",
    },
    forbidden: { mustNotFabricate: ["anemia ferropênica crônica estável"] },
  },
  {
    id: "b-mis-10",
    title: "Adolescente 'dramática' com dor pélvica",
    category: "misleading",
    severity: "incomplete",
    transcriptSegments: [
      "Menina de 16 anos, equipe diz que é dramática.",
      "Dor pélvica, tontura, atraso menstrual. Pressão 92 por 60.",
    ],
    expected: {
      mustNotMiss: ["gravidez ectópica"],
      expectedDispositionConcept: "urgent",
    },
    forbidden: { mustNotFabricate: ["não está grávida"] },
  },
  {
    id: "b-mis-11",
    title: "Ataque de pânico após camarão, garganta fechando",
    category: "misleading",
    severity: "incomplete",
    transcriptSegments: [
      "Mulher de 30 anos, 'é crise de pânico'.",
      "Comeu camarão. Garganta fechando, urticária, chiado.",
    ],
    expected: {
      mustNotMiss: ["anafilaxia"],
      expectedDispositionConcept: "emergency",
    },
    forbidden: { mustNotFabricate: ["é só pânico"] },
  },
  {
    id: "b-mis-12",
    title: "Gastroenterite de rótulo em adolescente com polidipsia",
    category: "misleading",
    severity: "incomplete",
    transcriptSegments: [
      "Garoto de 14 anos, vômitos, 'é virose'.",
      "Bebe água sem parar, emagreceu, respira fundo.",
    ],
    expected: {
      mustNotMiss: ["cetoacidose"],
      shouldTest: ["glicemia"],
      expectedDispositionConcept: "emergency",
    },
    forbidden: { mustNotFabricate: ["glicemia normal"] },
  },
  {
    id: "b-mis-13",
    title: "Lombalgia em fumante hipotenso",
    category: "misleading",
    severity: "incomplete",
    transcriptSegments: [
      "Homem de 74 anos, 'é a coluna'.",
      "Dor lombar súbita, pálido, pressão 80 por 50.",
    ],
    expected: {
      mustNotMiss: ["ruptura de aneurisma"],
      mustConsider: ["hemorragia interna"],
      expectedDispositionConcept: "emergency",
    },
    forbidden: { mustNotFabricate: ["lombalgia mecânica"] },
  },
  {
    id: "b-mis-14",
    title: "Enxaqueca habitual mas a pior e súbita",
    category: "misleading",
    severity: "incomplete",
    transcriptSegments: [
      "Mulher de 42 anos tem enxaqueca.",
      "Hoje começou num segundo, a pior da vida, um vômito.",
    ],
    expected: {
      mustNotMiss: ["hemorragia subaracnóidea"],
      expectedDispositionConcept: "emergency",
    },
    forbidden: { mustNotFabricate: ["é a enxaqueca de sempre"] },
  },
  {
    id: "b-mis-15",
    title: "Intoxicação alcoólica versus hipoglicemia",
    category: "misleading",
    severity: "incomplete",
    transcriptSegments: [
      "Homem de 47 anos diabético, hálito etílico, encontrado 'dormindo'.",
      "Suado, não responde bem. Ninguém mediu glicemia.",
    ],
    expected: {
      mustNotMiss: ["hipoglicemia"],
      shouldTest: ["glicemia"],
      expectedDispositionConcept: "emergency",
      clinicallyPlausibleAlternatives: ["intoxicação", "TCE"],
    },
    forbidden: { mustNotFabricate: ["glicemia 95"] },
  },
];
