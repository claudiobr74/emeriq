/** Limiares clínicos centralizados e revisáveis. Não espalhar no código. */
export const SAFETY_THRESHOLDS = {
  /** PAS abaixo disto, quando explicitamente informada, sugere instabilidade. */
  hypotensionSystolicMmHg: 90,
  /** SpO2 abaixo disto, quando explicitamente informada. */
  hypoxemiaSpO2Percent: 90,
  /** PAS elevada associada a sintoma de lesão de órgão-alvo. */
  hypertensiveEmergencySystolicMmHg: 180,
  /** Glicemia capilar baixa, quando explicitamente informada. */
  hypoglycemiaMgDl: 70,
  /** GCS ≤ este valor: reavaliação crítica do nível de consciência. */
  glasgowCriticalMax: 8,
  /** GCS neste intervalo: alteração significativa (não diagnóstico). */
  glasgowSignificantMin: 9,
  glasgowSignificantMax: 12,
} as const;
