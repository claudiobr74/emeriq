import type { ClinicalAlert } from "@/lib/clinical/schemas";
import type { ClinicalState } from "@/lib/clinical/schemas";
import { collectSafetyTriggers } from "@/lib/clinical/safety/rules";
import { reevaluationHintForTrigger } from "@/lib/clinical/safety/hints";
import type { SafetyTrigger } from "@/lib/clinical/safety/types";

const TRIGGER_ALERTS: Record<
  string,
  { severity: ClinicalAlert["severity"]; title: string; fallback: string }
> = {
  altered_level_of_consciousness: {
    severity: "critical",
    title: "Reavaliação do nível de consciência",
    fallback:
      "Glasgow reduzido. Reavalie via aérea e causas reversíveis, sem fechar diagnóstico.",
  },
  hemodynamic_instability: {
    severity: "critical",
    title: "Instabilidade hemodinâmica",
    fallback: "Há sinais de instabilidade. Reavalie choque e perfusão, sem inventar a causa.",
  },
  hypoxemia: {
    severity: "critical",
    title: "Hipoxemia explícita",
    fallback: "Saturação explicitamente baixa. Reavalie via aérea e ventilação.",
  },
  hypoglycemia: {
    severity: "critical",
    title: "Glicemia explicitamente baixa",
    fallback: "Há glicemia baixa informada. Reavalie hipoglicemia.",
  },
  high_risk_chest_pain: {
    severity: "critical",
    title: "Dor torácica de risco",
    fallback: "Reavalie diferenciais graves de dor torácica, sem confirmá-los.",
  },
  acute_neuro_deficit: {
    severity: "critical",
    title: "Déficit neurológico agudo",
    fallback: "Reavalie AVC e hipoglicemia, sem confirmá-los.",
  },
  anaphylaxis: {
    severity: "critical",
    title: "Possível reação grave",
    fallback: "Reavalie anafilaxia, sem confirmá-la.",
  },
  sepsis_shock: {
    severity: "critical",
    title: "Infecção com instabilidade",
    fallback: "Reavalie infecção grave e choque, sem confirmá-los.",
  },
  major_bleeding: {
    severity: "critical",
    title: "Sangramento importante",
    fallback: "Reavalie hemorragia e instabilidade.",
  },
  gi_bleeding: {
    severity: "critical",
    title: "Sangramento digestivo",
    fallback: "Há sangramento digestivo sugerido. Reavalie hemorragia, sem confirmar o sítio.",
  },
  head_trauma_high_risk: {
    severity: "critical",
    title: "Trauma craniano de risco",
    fallback: "Considere TCE e hemorragia intracraniana, sem confirmá-los.",
  },
  chest_trauma_respiratory: {
    severity: "critical",
    title: "Trauma torácico",
    fallback: "Considere pneumotórax, sem confirmá-lo.",
  },
  trauma_hemorrhage: {
    severity: "critical",
    title: "Trauma com instabilidade",
    fallback: "Reavalie hemorragia traumática e via aérea.",
  },
  thunderclap_headache: {
    severity: "warning",
    title: "Cefaleia hiperaguda",
    fallback: "Reavalie causa grave de cefaleia súbita, sem confirmá-la.",
  },
  hypertensive_emergency: {
    severity: "warning",
    title: "Pressão arterial muito elevada",
    fallback: "PA elevada com sintoma de órgão-alvo. Reavalie, sem fechar diagnóstico.",
  },
  altered_mental_status: {
    severity: "warning",
    title: "Alteração do nível de consciência",
    fallback: "Há rebaixamento relatado. Reavalie causas reversíveis, sem fechar diagnóstico.",
  },
};

export function alertsFromSafetyTriggers(triggers: SafetyTrigger[]): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  for (const trigger of triggers) {
    if (trigger.priority === "watch") continue;
    const mapped = TRIGGER_ALERTS[trigger.trigger];
    const hint = reevaluationHintForTrigger(trigger.trigger);
    const severity: ClinicalAlert["severity"] =
      trigger.priority === "critical" ? "critical" : "warning";
    alerts.push({
      severity: mapped?.severity ?? severity,
      title: mapped?.title ?? "Reavaliação de segurança",
      message: hint ?? mapped?.fallback ?? "Reavalie o caso à luz dos dados atuais.",
    });
  }
  return alerts.slice(0, 5);
}

export function applySafetyToClinicalState(
  state: ClinicalState,
  transcript: string,
  newSegment = "",
): ClinicalState {
  const triggers = collectSafetyTriggers({
    transcript,
    newSegment,
    chiefComplaint: state.chiefComplaint,
    vitalSigns: state.vitalSigns,
    medications: state.medications,
  });
  const safetyAlerts = alertsFromSafetyTriggers(triggers);
  const titles = new Set(safetyAlerts.map((alert) => alert.title));
  const rest = state.alerts.filter((alert) => !titles.has(alert.title));
  return {
    ...state,
    systemSafetyTriggers: triggers,
    alerts: [...safetyAlerts, ...rest].slice(0, 5),
  };
}
