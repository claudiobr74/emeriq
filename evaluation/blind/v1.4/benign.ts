import type { BlindClinicalCase } from "../types";

export const BENIGN_CASES: BlindClinicalCase[] = [
  {
    id: "b-ben-01",
    title: "Dor torácica reproduzível após academia",
    category: "musculoesquelético",
    severity: "benign",
    transcriptSegments: [
      "Homem de 26 anos fez supino ontem. Dor no peito à esquerda quando aperta o músculo.",
      "A palpação reproduz a dor. Sem esforço atual, sem suor, sem irradiação.",
    ],
    expected: {
      mustConsider: ["dor musculoesquelética"],
      expectedDispositionConcept: "discharge_possible",
      clinicallyPlausibleAlternatives: ["síndrome coronariana aguda"],
    },
    forbidden: { mustNotFabricate: ["nega dispneia", "ECG realizado"] },
    notes: "SCA breve como alternativa é aceitável; dissecção/TEP/AVC como alerta prioritário = overtriage.",
  },
  {
    id: "b-ben-02",
    title: "Cefaleia tensional recorrente sem red flags",
    category: "neurologia",
    severity: "benign",
    transcriptSegments: [
      "Mulher de 38 anos, faixa apertando a cabeça no fim do expediente, como sempre.",
      "Sem vômito, sem déficit, sem pior cefaleia da vida. Exame neurológico dito normal pelo médico.",
    ],
    expected: {
      mustConsider: ["cefaleia tensional"],
      expectedDispositionConcept: "discharge_possible",
      clinicallyPlausibleAlternatives: ["enxaqueca"],
    },
    forbidden: { mustNotFabricate: ["sem déficit focal"] },
  },
  {
    id: "b-ben-03",
    title: "Gastroenterite de um dia, hidratando",
    category: "gastrointestinal",
    severity: "benign",
    transcriptSegments: [
      "Menino de 8 anos, vômito e diarreia desde de manhã, sem sangue.",
      "Bebe soro. Urinou. Sem febre alta. Abdome depressível.",
    ],
    expected: {
      mustConsider: ["gastroenterite"],
      expectedDispositionConcept: "discharge_possible",
    },
    forbidden: { mustNotFabricate: ["sem sangue nas fezes"] },
  },
  {
    id: "b-ben-04",
    title: "IVAS com coriza e tosse seca",
    category: "respiratório",
    severity: "benign",
    transcriptSegments: [
      "Mulher de 31 anos, coriza, garganta e tosse seca há dois dias.",
      "Sem falta de ar. Sem dor no peito. Afebrile agora.",
    ],
    expected: {
      mustConsider: ["IVAS"],
      expectedDispositionConcept: "discharge_possible",
    },
    forbidden: { mustNotFabricate: ["nega dispneia"] },
  },
  {
    id: "b-ben-05",
    title: "Vertigem ao virar a cabeça na cama",
    category: "otologia",
    severity: "benign",
    transcriptSegments: [
      "Senhora de 62 anos, tontura de segundos ao virar para a direita na cama.",
      "Sem surdez nova, sem disartria, anda com apoio só no pico.",
    ],
    expected: {
      mustConsider: ["vertigem posicional"],
      expectedDispositionConcept: "discharge_possible",
      clinicallyPlausibleAlternatives: ["AVC"],
    },
    forbidden: { mustNotFabricate: ["HINTS periférico confirmado"] },
  },
  {
    id: "b-ben-06",
    title: "Crise de pânico após discussão, vitais referidos estáveis",
    category: "psiquiatria",
    severity: "benign",
    transcriptSegments: [
      "Mulher de 24 anos após briga, formigamento nas mãos, medo de morrer.",
      "Pressão 128 por 78, frequência 98. Dor no peito em pontada que passa. Melhora ao conversar.",
    ],
    expected: {
      mustConsider: ["ansiedade"],
      expectedDispositionConcept: "observation",
      clinicallyPlausibleAlternatives: ["síndrome coronariana aguda"],
    },
    forbidden: { mustNotFabricate: ["nega dispneia"] },
  },
  {
    id: "b-ben-07",
    title: "Lombalgia ao levantar caixa",
    category: "musculoesquelético",
    severity: "benign",
    transcriptSegments: [
      "Homem de 41 anos levantou caixa pesada, dor lombar à esquerda.",
      "Sem febre, sem incontinência, força nas pernas preservada segundo ele.",
    ],
    expected: {
      mustConsider: ["lombalgia mecânica"],
      expectedDispositionConcept: "discharge_possible",
    },
    forbidden: { mustNotFabricate: ["sem déficit motor"] },
  },
  {
    id: "b-ben-08",
    title: "Queimação epigástrica após pizza, padrão antigo",
    category: "gastrointestinal",
    severity: "benign",
    transcriptSegments: [
      "Homem de 35 anos, queimação depois de pizza, igual há anos, alivia com antiácido em casa.",
      "Sem esforço, sem irradiação para braço, sem suor.",
    ],
    expected: {
      mustConsider: ["dispepsia"],
      expectedDispositionConcept: "discharge_possible",
      clinicallyPlausibleAlternatives: ["síndrome coronariana aguda"],
    },
    forbidden: { mustNotFabricate: ["nega irradiacao"] },
  },
  {
    id: "b-ben-09",
    title: "Síndrome viral com mialgia",
    category: "infecção",
    severity: "benign",
    transcriptSegments: [
      "Mulher de 29 anos, corpo doído, coriza, dois dias. Sem dispneia.",
      "Temperatura 37,6 em casa. Come e bebe.",
    ],
    expected: {
      mustConsider: ["síndrome viral"],
      expectedDispositionConcept: "discharge_possible",
    },
    forbidden: { mustNotFabricate: ["sem sinais de sepse"] },
  },
  {
    id: "b-ben-10",
    title: "Contusão em mesa de centro",
    category: "trauma",
    severity: "benign",
    transcriptSegments: [
      "Senhora de 50 anos bateu a canela na mesa, hematoma local.",
      "Anda. Sem tontura. Sem anticoagulante mencionado.",
    ],
    expected: {
      mustConsider: ["contusão"],
      expectedDispositionConcept: "discharge_possible",
    },
    forbidden: { mustNotFabricate: ["não usa anticoagulante"] },
  },
  {
    id: "b-ben-11",
    title: "Entorse de tornozelo ao descer a calçada",
    category: "ortopedia",
    severity: "benign",
    transcriptSegments: [
      "Rapaz de 22 anos torceu o tornozelo. Consegue apoiar com dor.",
      "Sem deformidade. Sem trauma craniano.",
    ],
    expected: {
      mustConsider: ["entorse"],
      expectedDispositionConcept: "discharge_possible",
    },
    forbidden: { mustNotFabricate: ["raio-x realizado"] },
  },
  {
    id: "b-ben-12",
    title: "Otite externa após piscina",
    category: "otologia",
    severity: "benign",
    transcriptSegments: [
      "Mulher de 19 anos, dor no ouvido ao puxar o pavilhão, depois da piscina.",
      "Sem febre, sem vertigem, sem mastoidalgia.",
    ],
    expected: {
      mustConsider: ["otite externa"],
      expectedDispositionConcept: "discharge_possible",
    },
    forbidden: { mustNotFabricate: ["sem febre"] },
  },
  {
    id: "b-ben-13",
    title: "Rinite alérgica sazonal",
    category: "alergia",
    severity: "benign",
    transcriptSegments: [
      "Homem de 33 anos, espirros e prurido nasal na primavera, como todo ano.",
      "Sem chiado, sem urticária, sem edema de lábios.",
    ],
    expected: {
      mustConsider: ["rinite alérgica"],
      expectedDispositionConcept: "discharge_possible",
    },
    forbidden: { mustNotFabricate: ["sem chiado"] },
  },
  {
    id: "b-ben-14",
    title: "Constipação em idosa lúcida",
    category: "gastrointestinal",
    severity: "benign",
    transcriptSegments: [
      "Idosa de 74 anos, três dias sem evacuar, cólica leve.",
      "Come, anda, sem vômito bilioso, sem distensão importante.",
    ],
    expected: {
      mustConsider: ["constipação"],
      expectedDispositionConcept: "discharge_possible",
      clinicallyPlausibleAlternatives: ["obstrução intestinal"],
    },
    forbidden: { mustNotFabricate: ["abdome flácido"] },
  },
  {
    id: "b-ben-15",
    title: "Picada de inseto local",
    category: "dermatologia",
    severity: "benign",
    transcriptSegments: [
      "Criança de 6 anos, pápula pruriginosa no braço após parque.",
      "Sem urticária disseminada, sem chiado, sem edema de língua.",
    ],
    expected: {
      mustConsider: ["picada de inseto"],
      expectedDispositionConcept: "discharge_possible",
    },
    forbidden: { mustNotFabricate: ["sem sinais de anafilaxia"] },
  },
  {
    id: "b-ben-16",
    title: "Queimadura solar nas costas",
    category: "dermatologia",
    severity: "benign",
    transcriptSegments: [
      "Homem de 40 anos, costas vermelhas após praia, dor ao toque.",
      "Sem bolhas tensas extensas, bebe água, lúcido.",
    ],
    expected: {
      mustConsider: ["queimadura solar"],
      expectedDispositionConcept: "discharge_possible",
    },
    forbidden: { mustNotFabricate: ["sem bolhas"] },
  },
  {
    id: "b-ben-17",
    title: "Cefaleia de ressaca",
    category: "neurologia",
    severity: "benign",
    transcriptSegments: [
      "Rapaz de 25 anos, bebeu bastante, acordou com dor de cabeça e sede.",
      "Sem déficit, sem pior dor súbita, melhora com água.",
    ],
    expected: {
      mustConsider: ["cefaleia"],
      expectedDispositionConcept: "discharge_possible",
    },
    forbidden: { mustNotFabricate: ["sem déficit"] },
  },
  {
    id: "b-ben-18",
    title: "Dor muscular tardia pós-corrida",
    category: "musculoesquelético",
    severity: "benign",
    transcriptSegments: [
      "Mulher de 30 anos correu 10 km ontem, coxas doloridas ao descer escada.",
      "Sem edema unilateral, sem falta de ar.",
    ],
    expected: {
      mustConsider: ["dor muscular"],
      expectedDispositionConcept: "discharge_possible",
    },
    forbidden: { mustNotFabricate: ["nega dispneia"] },
  },
  {
    id: "b-ben-19",
    title: "Afta dolorosa",
    category: "orofaringe",
    severity: "benign",
    transcriptSegments: [
      "Homem de 21 anos, úlcera na mucosa jugal, come com dor.",
      "Sem febre, sem sialorreia, sem trismo.",
    ],
    expected: {
      mustConsider: ["afta"],
      expectedDispositionConcept: "discharge_possible",
    },
    forbidden: { mustNotFabricate: ["sem febre"] },
  },
  {
    id: "b-ben-20",
    title: "Cistite em jovem sem sinais sistêmicos",
    category: "urologia",
    severity: "benign",
    transcriptSegments: [
      "Mulher de 23 anos, ardência ao urinar e vontade frequente, um dia.",
      "Sem febre, sem dor lombar, sem vômitos.",
    ],
    expected: {
      mustConsider: ["cistite"],
      expectedDispositionConcept: "discharge_possible",
    },
    forbidden: { mustNotFabricate: ["sem febre"] },
  },
];
