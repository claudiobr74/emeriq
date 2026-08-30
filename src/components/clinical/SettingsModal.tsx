"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { AppSettings } from "@/types/clinical";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
      {children}
    </h3>
  );
}

function RadioRow({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className="flex items-center gap-2 rounded-md py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border ${
          checked ? "border-primary" : "border-border-strong"
        }`}
      >
        {checked ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
      </span>
      <span className="text-sm text-text">{label}</span>
    </button>
  );
}

function CheckRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-text">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      {label}
    </label>
  );
}

export function SettingsModal({
  open,
  onOpenChange,
  settings,
  onChange,
}: SettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <SettingsForm
          settings={settings}
          onCancel={() => onOpenChange(false)}
          onSave={(next) => {
            onChange(next);
            onOpenChange(false);
          }}
        />
      ) : null}
    </Dialog>
  );
}

function SettingsForm({
  settings,
  onCancel,
  onSave,
}: {
  settings: AppSettings;
  onCancel: () => void;
  onSave: (settings: AppSettings) => void;
}) {
  const [draft, setDraft] = useState<AppSettings>(settings);

  return (
    <DialogContent aria-describedby={undefined}>
      <DialogTitle>Configurações</DialogTitle>

        <div className="mt-5 space-y-5 border-t border-border pt-5">
          <section className="space-y-2">
            <SectionLabel>Transcrição</SectionLabel>
            <div
              role="radiogroup"
              aria-label="Modo de transcrição"
              className="flex flex-wrap gap-x-6 gap-y-1"
            >
              <RadioRow
                label="Tempo real"
                checked={draft.transcription === "turbo"}
                onSelect={() => setDraft({ ...draft, transcription: "turbo" })}
              />
              <RadioRow
                label="Alta precisão"
                checked={draft.transcription === "standard"}
                onSelect={() => setDraft({ ...draft, transcription: "standard" })}
              />
            </div>
          </section>

          <section className="space-y-2">
            <SectionLabel>Análise</SectionLabel>
            <div
              role="radiogroup"
              aria-label="Ritmo de análise"
              className="flex flex-wrap gap-x-6 gap-y-1"
            >
              <RadioRow
                label="Rápida"
                checked={draft.analysisPace === "fast"}
                onSelect={() => setDraft({ ...draft, analysisPace: "fast" })}
              />
              <RadioRow
                label="Equilibrada"
                checked={draft.analysisPace === "balanced"}
                onSelect={() => setDraft({ ...draft, analysisPace: "balanced" })}
              />
              <RadioRow
                label="Profunda"
                checked={draft.analysisPace === "economical"}
                onSelect={() => setDraft({ ...draft, analysisPace: "economical" })}
              />
            </div>
          </section>

          <section className="space-y-2">
            <SectionLabel>Mostrar no painel</SectionLabel>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <CheckRow
                label="Perguntas"
                checked={draft.showQuestions}
                onCheckedChange={(v) => setDraft({ ...draft, showQuestions: v })}
              />
              <CheckRow
                label="Hipóteses"
                checked={draft.showHypotheses}
                onCheckedChange={(v) => setDraft({ ...draft, showHypotheses: v })}
              />
              <CheckRow
                label="Alertas"
                checked={draft.showAlerts}
                onCheckedChange={(v) => setDraft({ ...draft, showAlerts: v })}
              />
              <CheckRow
                label="Exames"
                checked={draft.showTests}
                onCheckedChange={(v) => setDraft({ ...draft, showTests: v })}
              />
              <CheckRow
                label="Condutas"
                checked={draft.showTreatments}
                onCheckedChange={(v) => setDraft({ ...draft, showTreatments: v })}
              />
            </div>
          </section>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button size="sm" onClick={() => onSave(draft)}>
            Salvar alterações
          </Button>
        </div>
    </DialogContent>
  );
}
