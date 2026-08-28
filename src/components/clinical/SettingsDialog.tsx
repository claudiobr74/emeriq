"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AnalysisPace, AppSettings, TranscriptionChoice } from "@/types/clinical";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onChange,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Configurações</DialogTitle>

        <section className="mt-4 space-y-2">
          <h3 className="text-sm font-semibold text-slate-800">Transcrição</h3>
          <Option
            label="Whisper Large V3"
            checked={settings.transcription === "standard"}
            onSelect={() =>
              onChange({ ...settings, transcription: "standard" as TranscriptionChoice })
            }
          />
          <Option
            label="Whisper Large V3 Turbo"
            checked={settings.transcription === "turbo"}
            onSelect={() =>
              onChange({ ...settings, transcription: "turbo" as TranscriptionChoice })
            }
          />
        </section>

        <section className="mt-5 space-y-2">
          <h3 className="text-sm font-semibold text-slate-800">
            Frequência de análise
          </h3>
          <Option
            label="Rápida"
            checked={settings.analysisPace === "fast"}
            onSelect={() =>
              onChange({ ...settings, analysisPace: "fast" as AnalysisPace })
            }
          />
          <Option
            label="Equilibrada"
            checked={settings.analysisPace === "balanced"}
            onSelect={() =>
              onChange({ ...settings, analysisPace: "balanced" as AnalysisPace })
            }
          />
          <Option
            label="Econômica"
            checked={settings.analysisPace === "economical"}
            onSelect={() =>
              onChange({ ...settings, analysisPace: "economical" as AnalysisPace })
            }
          />
        </section>

        <section className="mt-5 space-y-2">
          <h3 className="text-sm font-semibold text-slate-800">Mostrar</h3>
          <CheckRow
            label="Perguntas"
            checked={settings.showQuestions}
            onCheckedChange={(checked) =>
              onChange({ ...settings, showQuestions: checked })
            }
          />
          <CheckRow
            label="Hipóteses"
            checked={settings.showHypotheses}
            onCheckedChange={(checked) =>
              onChange({ ...settings, showHypotheses: checked })
            }
          />
          <CheckRow
            label="Alertas"
            checked={settings.showAlerts}
            onCheckedChange={(checked) =>
              onChange({ ...settings, showAlerts: checked })
            }
          />
          <CheckRow
            label="Exames"
            checked={settings.showTests}
            onCheckedChange={(checked) =>
              onChange({ ...settings, showTests: checked })
            }
          />
          <CheckRow
            label="Tratamentos"
            checked={settings.showTreatments}
            onCheckedChange={(checked) =>
              onChange({ ...settings, showTreatments: checked })
            }
          />
        </section>
      </DialogContent>
    </Dialog>
  );
}

function Option({
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
      onClick={onSelect}
      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
        checked
          ? "border-teal-800 bg-teal-50 text-teal-950"
          : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      {label}
      <span
        className={`h-2.5 w-2.5 rounded-full ${checked ? "bg-teal-800" : "bg-slate-300"}`}
      />
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
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      {label}
    </label>
  );
}
