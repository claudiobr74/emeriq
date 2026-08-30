"use client";

import { Activity } from "lucide-react";
import type { ClinicalHypothesis, ClinicalSuggestion } from "@/types/clinical";
import { StatusBadge, hypothesisVariant } from "@/components/ui/status-badge";
import { RationalePopover } from "@/components/clinical/RationalePopover";

interface EvaluationBlockProps {
  hypotheses: ClinicalHypothesis[];
  dangerousDifferentials: ClinicalHypothesis[];
  tests: ClinicalSuggestion[];
  treatments: ClinicalSuggestion[];
  className?: string;
}

function hasRationale(h: ClinicalHypothesis): boolean {
  return Boolean(
    h.rationale || h.supportingFindings.length || h.opposingFindings.length,
  );
}

function HypothesisRow({
  hypothesis,
  variant,
  label,
}: {
  hypothesis: ClinicalHypothesis;
  variant: Parameters<typeof StatusBadge>[0]["variant"];
  label?: string;
}) {
  const row = (
    <div className="flex w-full items-center justify-between gap-2 rounded-md bg-surface-muted px-2.5 py-1.5">
      <span className="text-left text-[13px] font-semibold text-text">
        {hypothesis.diagnosis}
      </span>
      <StatusBadge variant={variant} label={label} />
    </div>
  );

  if (hasRationale(hypothesis)) {
    return (
      <RationalePopover hypothesis={hypothesis}>
        <button
          type="button"
          className="w-full rounded-md text-left transition-colors hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Fundamento clínico: ${hypothesis.diagnosis}`}
        >
          {row}
        </button>
      </RationalePopover>
    );
  }
  return row;
}

function Chips({
  label,
  items,
}: {
  label: string;
  items: ClinicalSuggestion[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.item}
            title={item.rationale}
            className="rounded-md border border-info bg-info-bg px-2.5 py-1 text-xs font-medium text-info"
          >
            {item.item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function EvaluationBlock({
  hypotheses,
  dangerousDifferentials,
  tests,
  treatments,
  className,
}: EvaluationBlockProps) {
  const hasHypotheses = hypotheses.length > 0 || dangerousDifferentials.length > 0;
  if (!hasHypotheses && tests.length === 0 && treatments.length === 0) return null;

  return (
    <section
      data-testid="hypothesis-list"
      className={`flex min-h-0 flex-col gap-4 rounded-xl border border-border bg-surface p-4 ${className ?? ""}`}
    >
      <div className="flex items-center gap-2">
        <Activity className="h-[18px] w-[18px] text-info" aria-hidden />
        <h3 className="text-sm font-bold text-heading">Avaliação e Hipóteses</h3>
      </div>

      {hasHypotheses ? (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
            Hipóteses Diagnósticas
          </p>
          {hypotheses.slice(0, 5).map((h) => (
            <HypothesisRow
              key={h.diagnosis}
              hypothesis={h}
              variant={hypothesisVariant(h.priority)}
            />
          ))}
          {dangerousDifferentials.slice(0, 3).map((h) => (
            <HypothesisRow
              key={`d-${h.diagnosis}`}
              hypothesis={h}
              variant="grave"
            />
          ))}
        </div>
      ) : null}

      {(tests.length > 0 || treatments.length > 0) && hasHypotheses ? (
        <div className="h-px w-full bg-border" aria-hidden />
      ) : null}

      <Chips label="Exames a Considerar" items={tests} />
      <Chips label="Condutas Possíveis" items={treatments} />
    </section>
  );
}
