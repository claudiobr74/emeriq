import { describe, expect, it } from "vitest";
import {
  allSegmentsSettled,
  hasFailedSegments,
  initialTranscriptionState,
  pendingSegments,
  transcriptionReducer,
  type TranscriptionState,
} from "@/lib/transcription/reducer";

function run(
  actions: Parameters<typeof transcriptionReducer>[1][],
  start: TranscriptionState = initialTranscriptionState(),
): TranscriptionState {
  return actions.reduce(transcriptionReducer, start);
}

describe("transcription reducer", () => {
  it("partial delta does not enter confirmed until completed", () => {
    const state = run([
      { type: "audioAccepted", id: "1" },
      { type: "delta", id: "1", text: "Paciente refere dor..." },
    ]);
    expect(state.partial).toBe("Paciente refere dor...");
    expect(state.confirmed).toBe("");
  });

  it("completed replaces partial and consolidates confirmed", () => {
    const state = run([
      { type: "audioAccepted", id: "1" },
      { type: "delta", id: "1", text: "Paciente refere dor..." },
      {
        type: "completed",
        id: "1",
        text: "Paciente refere dor torácica há quarenta minutos.",
      },
    ]);
    expect(state.partial).toBe("");
    expect(state.confirmed).toBe(
      "Paciente refere dor torácica há quarenta minutos.",
    );
    // partial não é incorporado duas vezes
    expect(state.confirmed.match(/Paciente refere dor/g)?.length).toBe(1);
  });

  it("reconnection / repeated completed does not duplicate text", () => {
    const state = run([
      { type: "audioAccepted", id: "1" },
      { type: "completed", id: "1", text: "Dor torácica há quarenta minutos." },
      // mesmo texto reenviado após reconexão
      { type: "completed", id: "1", text: "Dor torácica há quarenta minutos." },
    ]);
    expect(state.confirmed).toBe("Dor torácica há quarenta minutos.");
  });

  it("keeps segments ordered and tracks pending vs settled", () => {
    let state = run([
      { type: "audioAccepted", id: "a" },
      { type: "audioAccepted", id: "b" },
      { type: "completed", id: "a", text: "Primeiro trecho." },
    ]);
    expect(state.segments.map((s) => s.id)).toEqual(["a", "b"]);
    expect(pendingSegments(state)).toHaveLength(1);
    expect(allSegmentsSettled(state)).toBe(false);

    state = transcriptionReducer(state, {
      type: "completed",
      id: "b",
      text: "Segundo trecho.",
    });
    expect(allSegmentsSettled(state)).toBe(true);
    expect(state.confirmed).toContain("Primeiro trecho.");
    expect(state.confirmed).toContain("Segundo trecho.");
  });

  it("records failed segments without ignoring them", () => {
    const state = run([
      { type: "audioAccepted", id: "1" },
      { type: "failed", id: "1" },
    ]);
    expect(hasFailedSegments(state)).toBe(true);
    expect(allSegmentsSettled(state)).toBe(true);
    expect(state.partial).toBe("");
  });

  it("finalize scenario: last pending segment reaches SOAP", () => {
    // segmento N recebido e ainda pendente quando o usuário finaliza
    let state = run([
      { type: "audioAccepted", id: "N" },
      { type: "delta", id: "N", text: "última fala" },
    ]);
    expect(allSegmentsSettled(state)).toBe(false); // aguardar flush
    // N confirma após flush
    state = transcriptionReducer(state, {
      type: "completed",
      id: "N",
      text: "Última fala do paciente antes de finalizar.",
    });
    expect(allSegmentsSettled(state)).toBe(true);
    expect(state.confirmed).toContain("Última fala do paciente");
  });

  it("reset clears everything", () => {
    const state = run([
      { type: "audioAccepted", id: "1" },
      { type: "completed", id: "1", text: "algo" },
      { type: "reset" },
    ]);
    expect(state).toEqual(initialTranscriptionState());
  });
});
