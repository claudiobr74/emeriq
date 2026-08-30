"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { BookOpen, X } from "lucide-react";
import type { ClinicalHypothesis } from "@/types/clinical";
import { useMediaQuery } from "@/hooks/useMediaQuery";

function RationaleContent({ hypothesis }: { hypothesis: ClinicalHypothesis }) {
  const hasSupport = hypothesis.supportingFindings.length > 0;
  const hasOpposing = hypothesis.opposingFindings.length > 0;
  const empty = !hypothesis.rationale && !hasSupport && !hasOpposing;

  return (
    <div className="flex flex-col gap-3 text-left">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" aria-hidden />
        <span className="text-sm font-bold text-heading">Fundamento Clínico</span>
      </div>
      <h4 className="text-base font-bold text-text">{hypothesis.diagnosis}</h4>

      {hypothesis.rationale ? (
        <p className="text-[13px] leading-5 text-text-body">
          <span className="font-semibold text-text">Aplicação ao caso: </span>
          {hypothesis.rationale}
        </p>
      ) : null}

      {hasSupport ? (
        <div className="text-[13px] leading-5 text-text-body">
          <span className="font-semibold text-text">Achados a favor: </span>
          {hypothesis.supportingFindings.join("; ")}
        </div>
      ) : null}

      {hasOpposing ? (
        <div className="text-[13px] leading-5 text-text-body">
          <span className="font-semibold text-text">Achados contra: </span>
          {hypothesis.opposingFindings.join("; ")}
        </div>
      ) : null}

      {empty ? (
        <p className="text-[13px] leading-5 text-text-muted">
          Sem fundamentação adicional registrada para esta hipótese até o momento.
        </p>
      ) : null}

      <p className="border-t border-border pt-2 text-[11px] leading-4 text-text-muted">
        Fundamentação gerada pela análise clínica. Avalie sob julgamento clínico.
      </p>
    </div>
  );
}

export function RationalePopover({
  hypothesis,
  children,
}: {
  hypothesis: ClinicalHypothesis;
  children: React.ReactNode;
}) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  if (isDesktop) {
    return (
      <PopoverPrimitive.Root>
        <PopoverPrimitive.Trigger asChild>{children}</PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            side="left"
            align="start"
            sideOffset={8}
            collisionPadding={16}
            className="z-50 w-[320px] rounded-xl border border-border bg-surface p-4 shadow-xl focus:outline-none data-[state=open]:animate-alert-in"
          >
            <RationaleContent hypothesis={hypothesis} />
            <PopoverPrimitive.Arrow className="fill-[var(--surface)]" />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  }

  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#0b1220]/50 data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border bg-surface p-5 pb-8 shadow-xl focus:outline-none data-[state=open]:animate-alert-in">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" aria-hidden />
          <DialogPrimitive.Title className="sr-only">
            Fundamento clínico
          </DialogPrimitive.Title>
          <RationaleContent hypothesis={hypothesis} />
          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-md p-1 text-text-muted hover:bg-surface-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
