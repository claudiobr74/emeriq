/**
 * Breakpoints e split oficiais do Figma (EmerIQ — Clinical Assistant MVP).
 * Mobile <640 · Tablet 640–1023 · Desktop ≥1024.
 * Split desktop (node 5:82): transcription-column 709 / assistant-column 659.
 */
export const FIGMA_BREAKPOINTS = {
  mobileMaxPx: 639,
  tabletMinPx: 640,
  tabletMaxPx: 1023,
  desktopMinPx: 1024,
} as const;

export const FIGMA_DESKTOP_SPLIT = {
  nodeId: "5:82",
  transcription: 709,
  assistant: 659,
} as const;

export function layoutForWidth(widthPx: number): "mobile" | "tablet" | "desktop" {
  if (widthPx <= FIGMA_BREAKPOINTS.mobileMaxPx) return "mobile";
  if (widthPx <= FIGMA_BREAKPOINTS.tabletMaxPx) return "tablet";
  return "desktop";
}
