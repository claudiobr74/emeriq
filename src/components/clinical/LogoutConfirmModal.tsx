"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LogoutConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function LogoutConfirmModal({
  open,
  onOpenChange,
  onConfirm,
}: LogoutConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={false} className="w-[min(26rem,calc(100%-2rem))]">
        <DialogTitle>Sair do EmerIQ?</DialogTitle>
        <DialogDescription className="mt-3">
          A captura de áudio será encerrada e o atendimento em andamento será
          salvo. Você precisará entrar novamente.
        </DialogDescription>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button size="sm" variant="destructive" onClick={onConfirm}>
            Sair
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
