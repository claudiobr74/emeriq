import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
  iconSize?: number;
}

/**
 * Marca oficial do EmerIQ. O ícone é o asset SVG oficial (public/brand);
 * a wordmark é texto Inter para herdar o token de tema (navy no claro,
 * claro no escuro). Nunca redesenhar via CSS (seção 14).
 */
export function Logo({
  className,
  iconClassName,
  wordmarkClassName,
  showWordmark = true,
  iconSize = 32,
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/brand/emeriq-logo-icon.svg"
        alt="EmerIQ"
        width={iconSize}
        height={Math.round((iconSize * 155) / 175)}
        priority
        className={cn("h-7 w-8", iconClassName)}
      />
      {showWordmark ? (
        <span
          className={cn(
            "text-[18px] font-bold leading-none text-heading",
            wordmarkClassName,
          )}
        >
          EmerIQ
        </span>
      ) : null}
    </div>
  );
}
