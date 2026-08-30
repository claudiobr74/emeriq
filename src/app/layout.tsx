import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/theme/ThemeScript";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EmerIQ — Assistente Clínica de Pronto-Socorro",
  description:
    "EmerIQ: assistente clínica em tempo real para pronto-socorro. Ouve, transcreve, organiza o raciocínio e documenta o SOAP.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={inter.variable}>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-bg font-sans text-text antialiased">
        {children}
      </body>
    </html>
  );
}
