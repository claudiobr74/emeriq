import { describe, expect, it } from "vitest";
import {
  FIGMA_BREAKPOINTS,
  FIGMA_DESKTOP_SPLIT,
  layoutForWidth,
} from "@/config/layout";

describe("Figma breakpoints", () => {
  it("classifies 390 as mobile and 639 as last mobile pixel", () => {
    expect(layoutForWidth(390)).toBe("mobile");
    expect(layoutForWidth(FIGMA_BREAKPOINTS.mobileMaxPx)).toBe("mobile");
  });

  it("starts tablet at 640 and keeps 768 as tablet", () => {
    expect(layoutForWidth(FIGMA_BREAKPOINTS.tabletMinPx)).toBe("tablet");
    expect(layoutForWidth(768)).toBe("tablet");
    expect(layoutForWidth(FIGMA_BREAKPOINTS.tabletMaxPx)).toBe("tablet");
  });

  it("starts desktop at 1024 and keeps 1440 as desktop", () => {
    expect(layoutForWidth(FIGMA_BREAKPOINTS.desktopMinPx)).toBe("desktop");
    expect(layoutForWidth(1440)).toBe("desktop");
  });

  it("uses the exact Figma 5:82 column widths for desktop split", () => {
    expect(FIGMA_DESKTOP_SPLIT.transcription).toBe(709);
    expect(FIGMA_DESKTOP_SPLIT.assistant).toBe(659);
  });
});
