"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ActiveConsultationModalProps {
  open: boolean;
  onContinue: () => void;
  onDiscard: () => void;
}

export function ActiveConsultationModal({
  open,
  onContinue,
  onDiscard,
}: ActiveConsultationModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent showClose={false} className="w-[min(26rem,calc(100%-2rem))]">
        <DialogTitle>Existe um atendimento em andamento.</DialogTitle>
        <DialogDescription className="mt-3">
          Você pode continuar de onde parou ou descartar este atendimento. O
          microfone não será religado automaticamente.
        </DialogDescription>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onDiscard}>
            Descartar atendimento
          </Button>
          <Button size="sm" onClick={onContinue}>
            Continuar atendimento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
