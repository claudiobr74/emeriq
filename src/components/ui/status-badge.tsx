import { cn } from "@/lib/utils";

export type StatusBadgeVariant =
  | "prioritaria"
  | "possivel"
  | "grave"
  | "sugestao"
  | "realizado"
  | "critico";

const VARIANTS: Record<StatusBadgeVariant, { label: string; className: string }> = {
  prioritaria: { label: "Prioritária", className: "bg-critical-bg text-critical" },
  possivel: { label: "Possível", className: "bg-warning-bg text-warning" },
  grave: { label: "Grave a excluir", className: "bg-info-bg text-info" },
  sugestao: { label: "Sugestão", className: "bg-info-bg text-info" },
  realizado: { label: "Realizado", className: "bg-success-bg text-success" },
  critico: { label: "Crítico", className: "bg-critical text-white" },
};

export function StatusBadge({
  variant,
  label,
  className,
}: {
  variant: StatusBadgeVariant;
  label?: string;
  className?: string;
}) {
  const config = VARIANTS[variant];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm px-2 py-0.5 text-[10px] font-bold leading-none",
        config.className,
        className,
      )}
    >
      {label ?? config.label}
    </span>
  );
}

export function hypothesisVariant(
  priority: "high" | "medium" | "low",
): StatusBadgeVariant {
  if (priority === "high") return "prioritaria";
  if (priority === "medium") return "possivel";
  return "possivel";
}
