"use client";

import { useState } from "react";
import type { ClinicalState } from "@/types/clinical";
import {
  VITAL_DESCRIPTORS,
  isVitalCritical,
  parseVitalInput,
  type VitalDescriptor,
  type VitalField,
} from "@/lib/clinical/vitals";

interface VitalsBarProps {
  vitals: ClinicalState["vitalSigns"];
  onChange: (field: VitalField, value: string | number | null) => void;
}

function VitalCard({
  descriptor,
  vitals,
  onChange,
}: {
  descriptor: VitalDescriptor;
  vitals: ClinicalState["vitalSigns"];
  onChange: (field: VitalField, value: string | number | null) => void;
}) {
  const { field, label, unit } = descriptor;
  const stored = vitals[field];
  const critical = isVitalCritical(field, vitals);
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");

  const value = focused ? draft : stored == null ? "" : String(stored);

  return (
    <label
      className={`flex flex-1 flex-col gap-1 rounded-lg border px-3 py-2 transition-colors ${
        critical
          ? "border-critical bg-critical-bg"
          : "border-border bg-surface focus-within:border-primary"
      }`}
    >
      <span className="text-[11px] font-semibold uppercase text-text-muted">
        {label}
      </span>
      <span className="flex items-baseline gap-1">
        <input
          inputMode={field === "bloodPressure" ? "text" : "decimal"}
          value={value}
          placeholder="—"
          aria-label={`${label} (${unit})`}
          onFocus={() => {
            setDraft(stored == null ? "" : String(stored));
            setFocused(true);
          }}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          onBlur={() => {
            setFocused(false);
            const parsed = parseVitalInput(field, draft);
            const normalizedStored = stored == null ? null : stored;
            if (parsed !== normalizedStored) onChange(field, parsed);
          }}
          className={`w-full min-w-0 bg-transparent text-[18px] font-bold tabular-nums outline-none placeholder:text-text-muted ${
            critical ? "text-critical" : "text-text"
          }`}
        />
        <span className="text-[12px] text-text-muted">{unit}</span>
      </span>
    </label>
  );
}

export function VitalsBar({ vitals, onChange }: VitalsBarProps) {
  return (
    <div
      data-testid="vitals-bar"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
    >
      {VITAL_DESCRIPTORS.map((descriptor) => (
        <VitalCard
          key={descriptor.field}
          descriptor={descriptor}
          vitals={vitals}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
