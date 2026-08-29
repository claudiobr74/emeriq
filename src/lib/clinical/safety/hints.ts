const TRIGGER_REEVALUATION_HINTS: Record<string, string> = {
  high_risk_chest_pain:
    "Reavalie diferenciais graves de dor torácica tempo-dependentes, incluindo SCA e dissecção aórtica, sem confirmá-los.",
  thunderclap_headache:
    "Reavalie causa grave de cefaleia hiperaguda, incluindo hemorragia subaracnóidea, sem confirmá-la.",
  sepsis_shock:
    "Reavalie infecção grave, sepse e choque séptico, sem confirmá-los.",
  acute_neuro_deficit:
    "Reavalie AVC e hipoglicemia, sem confirmá-los.",
  anaphylaxis: "Reavalie anafilaxia, sem confirmá-la.",
  hypoxemia:
    "Há saturação explicitamente baixa. Reavalie via aérea e causa respiratória ou circulatória.",
  major_bleeding: "Reavalie hemorragia importante e instabilidade.",
  obstetric_pain_bleeding:
    "Reavalie emergência obstétrica, incluindo gravidez ectópica se gestação inicial.",
  intoxication: "Reavalie intoxicação: substância, quantidade e horário.",
  hypoglycemia: "Há glicemia explicitamente baixa. Reavalie hipoglicemia.",
  hemodynamic_instability: "Reavalie choque e perfusão, sem inventar a causa.",
  trauma_hemorrhage: "Reavalie hemorragia traumática e via aérea.",
};

export function reevaluationHintForTrigger(trigger: string): string | undefined {
  return TRIGGER_REEVALUATION_HINTS[trigger];
}
