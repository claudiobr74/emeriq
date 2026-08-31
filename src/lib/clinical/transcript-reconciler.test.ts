import { describe, expect, it } from "vitest";
import { reconcileTranscript, transcriptTail } from "@/lib/clinical/transcript-reconciler";

describe("transcript reconciler", () => {
  it("keeps confirmed when incoming is already contained", () => {
    expect(reconcileTranscript("dor no peito há uma hora", "dor no peito")).toBe(
      "dor no peito há uma hora",
    );
  });

  it("replaces when incoming contains confirmed", () => {
    expect(reconcileTranscript("dor no peito", "dor no peito há uma hora")).toBe(
      "dor no peito há uma hora",
    );
  });

  it("appends when there is no overlap", () => {
    expect(reconcileTranscript("paciente de 58 anos", "pressão 88 por 54")).toMatch(
      /58 anos pressão 88 por 54/i,
    );
  });

  it("returns a tail for whisper continuity", () => {
    const tail = transcriptTail("a".repeat(400), 180);
    expect(tail.length).toBeLessThanOrEqual(180);
  });

  it("does not feed leaked glossary back as prompt tail", () => {
    const tail = transcriptTail(
      "Paciente com dor no peito. Termos frequentes: dispneia, síncope, dor torácica, saturação, hipertensão, hipotensão, diabetes, anticoagulante, ECG.",
    );
    expect(tail).toContain("dor no peito");
    expect(tail).not.toContain("Termos frequentes");
  });
});
