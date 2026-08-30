import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Altura do logo em px (largura mantém o aspect ratio 105:28). */
  height?: number;
}

/**
 * Marca oficial do EmerIQ (logo Header, node 10:250). Usa o asset SVG oficial —
 * ícone + wordmark — em vez de recriar o texto via HTML (seção 19). A variante
 * escura recolore a wordmark navy para clara, preservando o traçado oficial.
 */
export function Logo({ className, height = 28 }: LogoProps) {
  const width = Math.round((height * 105) / 28);
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src="/brand/emeriq-logo-header.svg"
        alt="EmerIQ"
        width={width}
        height={height}
        priority
        className="block h-7 w-auto dark:hidden"
      />
      <Image
        src="/brand/emeriq-logo-header-dark.svg"
        alt="EmerIQ"
        width={width}
        height={height}
        priority
        className="hidden h-7 w-auto dark:block"
      />
    </span>
  );
}
