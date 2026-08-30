import fs from "node:fs";
import path from "node:path";

export const PROTOCOL_IDS = [
  "chest-pain",
  "stroke",
  "sepsis",
  "anaphylaxis",
  "asthma-copd",
  "abdominal-pain",
  "trauma",
  "intoxication",
  "hypertensive-emergency",
  "obstetric-emergencies",
  "altered-mental-status",
  "seizure",
] as const;

export type ProtocolId = (typeof PROTOCOL_IDS)[number];

export interface ProtocolDocument {
  id: ProtocolId;
  title: string;
  content: string;
}

const TITLES: Record<ProtocolId, string> = {
  "chest-pain": "Chest Pain",
  stroke: "Stroke",
  sepsis: "Sepsis",
  anaphylaxis: "Anaphylaxis",
  "asthma-copd": "Asthma / COPD",
  "abdominal-pain": "Abdominal pain",
  trauma: "Trauma",
  intoxication: "Intoxication",
  "hypertensive-emergency": "Hypertensive emergency",
  "obstetric-emergencies": "Obstetric emergencies",
  "altered-mental-status": "Altered mental status",
  seizure: "Seizure",
};

function protocolPath(id: ProtocolId): string[] {
  return [
    path.join(process.cwd(), "src/clinical-knowledge", `${id}.md`),
    path.join(process.cwd(), "clinical-knowledge", `${id}.md`),
  ];
}

export function loadProtocol(id: ProtocolId): ProtocolDocument | null {
  try {
    for (const file of protocolPath(id)) {
      if (!fs.existsSync(/* turbopackIgnore: true */ file)) continue;
      const content = fs.readFileSync(/* turbopackIgnore: true */ file, "utf8").trim();
      if (!content) continue;
      return { id, title: TITLES[id], content };
    }
  } catch {
    return null;
  }
  return null;
}

export function loadAllProtocols(): ProtocolDocument[] {
  return PROTOCOL_IDS.map(loadProtocol).filter(
    (item): item is ProtocolDocument => Boolean(item),
  );
}
