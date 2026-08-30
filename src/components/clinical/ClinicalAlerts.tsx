"use client";

import { AlertOctagon, Clock } from "lucide-react";
import type { ClinicalAlert } from "@/types/clinical";
import { StatusBadge } from "@/components/ui/status-badge";

interface ClinicalAlertsProps {
  alerts: ClinicalAlert[];
}

export function ClinicalAlerts({ alerts }: ClinicalAlertsProps) {
  const visible = alerts.filter(
    (alert) => alert.severity === "critical" || alert.severity === "warning",
  );
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-3" data-testid="clinical-alerts">
      {visible.map((alert) => {
        const critical = alert.severity === "critical";
        return (
          <div
            key={`${alert.title}-${alert.message}`}
            role="alert"
            aria-live={critical ? "assertive" : "polite"}
            className={`animate-alert-in flex flex-col gap-3 rounded-xl border p-4 ${
              critical
                ? "border-critical bg-critical-bg"
                : "border-warning bg-warning-bg"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {critical ? (
                  <AlertOctagon className="h-[18px] w-[18px] text-critical" aria-hidden />
                ) : (
                  <Clock className="h-[18px] w-[18px] text-warning" aria-hidden />
                )}
                <h3
                  className={`text-sm font-bold ${
                    critical ? "text-critical" : "text-warning"
                  }`}
                >
                  Atenção Agora
                </h3>
              </div>
              {critical ? (
                <StatusBadge variant="critico" />
              ) : (
                <StatusBadge
                  variant="possivel"
                  label="Tempo-dependente"
                  className="bg-warning text-white"
                />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-bold text-text">{alert.title}</p>
              <p className="text-sm leading-6 text-text-body">{alert.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
