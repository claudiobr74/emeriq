"use client";

export type MobileTab = "consulta" | "assistente";

interface MobileTabsProps {
  value: MobileTab;
  onChange: (tab: MobileTab) => void;
}

const TABS: { id: MobileTab; label: string }[] = [
  { id: "consulta", label: "Consulta" },
  { id: "assistente", label: "Assistente" },
];

/**
 * Segmented control (Consulta | Assistente) para o mobile. As duas views são
 * mutuamente exclusivas (seção 33); trocar de aba é apenas apresentação e não
 * afeta microfone, timer, estado ou IA.
 */
export function MobileTabs({ value, onChange }: MobileTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Alternar entre consulta e assistente"
      className="flex gap-1 rounded-xl border border-border bg-surface-muted p-1"
    >
      {TABS.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              active
                ? "bg-surface text-heading shadow-sm"
                : "text-text-secondary hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
