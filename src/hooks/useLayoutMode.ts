"use client";

import { useEffect, useState } from "react";
import { FIGMA_BREAKPOINTS } from "@/config/layout";

export type LayoutMode = "mobile" | "tablet" | "desktop";

export function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>("desktop");

  useEffect(() => {
    const desktop = window.matchMedia(
      `(min-width: ${FIGMA_BREAKPOINTS.desktopMinPx}px)`,
    );
    const tablet = window.matchMedia(
      `(min-width: ${FIGMA_BREAKPOINTS.tabletMinPx}px) and (max-width: ${FIGMA_BREAKPOINTS.tabletMaxPx}px)`,
    );
    const update = () => {
      if (desktop.matches) setMode("desktop");
      else if (tablet.matches) setMode("tablet");
      else setMode("mobile");
    };
    update();
    desktop.addEventListener("change", update);
    tablet.addEventListener("change", update);
    return () => {
      desktop.removeEventListener("change", update);
      tablet.removeEventListener("change", update);
    };
  }, []);

  return mode;
}
