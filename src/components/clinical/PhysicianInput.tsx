"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

interface PhysicianInputProps {
  onSubmit: (finding: string) => void;
}

/**
 * Campo de registro manual de achado clínico (não é chatbot). O texto entra no
 * ClinicalState como achado observado pelo médico (physicianObserved).
 */
export function PhysicianInput({ onSubmit }: PhysicianInputProps) {
  const [value, setValue] = useState("");

  function commit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        commit();
      }}
      className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface-muted px-4 py-2.5 focus-within:border-primary"
    >
      <Plus className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Adicionar achado clínico manualmente..."
        aria-label="Adicionar achado clínico manualmente"
        className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
      />
      {value.trim() ? (
        <button
          type="submit"
          className="rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Adicionar
        </button>
      ) : null}
    </form>
  );
}
