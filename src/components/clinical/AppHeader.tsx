"use client";

import { Settings } from "lucide-react";
import { formatElapsed } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { StatusPill } from "@/components/ui/status-pill";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { DisplayStatus } from "@/types/clinical";

interface AppHeaderProps {
  status?: DisplayStatus;
  elapsedMs?: number;
  showStatus?: boolean;
  showTimer?: boolean;
  onOpenSettings?: () => void;
}

export function AppHeader({
  status = "idle",
  elapsedMs = 0,
  showStatus = false,
  showTimer = false,
  onOpenSettings,
}: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-4 py-4 md:px-8">
      <Logo />

      <div className="flex items-center gap-3 md:gap-6">
        {showStatus ? <StatusPill status={status} /> : null}
        {showTimer ? (
          <span className="hidden font-bold tabular-nums text-heading sm:inline text-[18px]">
            {formatElapsed(elapsedMs)}
          </span>
        ) : null}
        {(showStatus || showTimer) && onOpenSettings ? (
          <span className="hidden h-6 w-px bg-border sm:block" aria-hidden />
        ) : null}
        <ThemeToggle />
        {onOpenSettings ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Configurações"
            onClick={onOpenSettings}
          >
            <Settings className="h-5 w-5" />
          </Button>
        ) : null}
      </div>
    </header>
  );
}
