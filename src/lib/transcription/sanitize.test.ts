import { describe, expect, it } from "vitest";
import { WHISPER_PROMPT } from "@/lib/clinical/prompts";
import { stripTranscriptionLeak } from "@/lib/transcription/sanitize";

describe("stripTranscriptionLeak", () => {
  it("keeps real speech and drops the exact Whisper glossary dump", () => {
    const leaked = [
      "Testando, transmissão, um, dois, três, testando.",
      "O senhor está tomando anticoagulante?",
      WHISPER_PROMPT,
    ].join(" ");
    expect(stripTranscriptionLeak(leaked)).toBe(
      "Testando, transmissão, um, dois, três, testando. O senhor está tomando anticoagulante?",
    );
  });

  it("drops the glossary even without the leading sentence", () => {
    expect(
      stripTranscriptionLeak(
        "Dor no peito. Termos frequentes: dispneia, síncope, dor torácica, saturação, hipertensão, hipotensão, diabetes, anticoagulante, ECG.",
      ),
    ).toBe("Dor no peito.");
  });

  it("keeps a trailing space in partial mode so deltas do not glue words", () => {
    expect(stripTranscriptionLeak("Paciente refere ", "partial")).toBe(
      "Paciente refere ",
    );
  });

  it("does not remove medical words that the patient actually said", () => {
    expect(
      stripTranscriptionLeak(
        "Paciente com dispneia e dor torácica, em uso de anticoagulante.",
      ),
    ).toBe("Paciente com dispneia e dor torácica, em uso de anticoagulante.");
  });
});
