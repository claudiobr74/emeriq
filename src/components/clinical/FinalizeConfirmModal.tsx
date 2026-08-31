"use client";

import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FinalizeConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function FinalizeConfirmModal({
  open,
  onOpenChange,
  onConfirm,
}: FinalizeConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={false} className="w-[min(26rem,calc(100%-2rem))]">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-bg">
            <HelpCircle className="h-5 w-5 text-warning" aria-hidden />
          </span>
          <DialogTitle>Finalizar atendimento?</DialogTitle>
        </div>
        <DialogDescription className="mt-3">
          A captura de áudio será encerrada e o resumo clínico será preparado de
          forma estruturada. Essa ação não pode ser desfeita.
        </DialogDescription>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Continuar atendimento
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            Finalizar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
