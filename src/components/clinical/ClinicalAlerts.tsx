"use client";

import type { ClinicalAlert } from "@/types/clinical";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClinicalAlertsProps {
  alerts: ClinicalAlert[];
}

export function ClinicalAlerts({ alerts }: ClinicalAlertsProps) {
  const visible = alerts.filter(
    (alert) => alert.severity === "critical" || alert.severity === "warning",
  );
  if (visible.length === 0) return null;

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-900">Atenção agora</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visible.map((alert) => {
          const tone =
            alert.severity === "critical"
              ? "border-red-200 bg-red-50"
              : "border-amber-200 bg-amber-50";
          const label = alert.severity === "critical" ? "Crítico" : "Tempo-dependente";

          return (
            <div
              key={`${alert.title}-${alert.message}`}
              className={`rounded-lg border p-3 ${tone}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                {label}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {alert.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {alert.message}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
