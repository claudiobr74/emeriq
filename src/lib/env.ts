import fs from "node:fs";
import path from "node:path";

function decodeEnvFile(buffer: Buffer): string {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString("utf16le");
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.alloc(buffer.length - 2);
    for (let i = 2; i + 1 < buffer.length; i += 2) {
      swapped[i - 2] = buffer[i + 1]!;
      swapped[i - 1] = buffer[i]!;
    }
    return swapped.toString("utf16le");
  }
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString("utf8");
  }
  const nulls = buffer.subarray(0, Math.min(buffer.length, 64)).filter((byte) => byte === 0).length;
  if (nulls > 8) {
    return buffer.toString("utf16le");
  }
  return buffer.toString("utf8");
}

function parseEnvValue(content: string, name: string): string | undefined {
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/^\uFEFF/, "").trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (key !== name) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value.trim();
  }
  return undefined;
}

export function getGroqApiKey(): string | undefined {
  const fromProcess = process.env.GROQ_API_KEY?.trim();
  if (fromProcess) return fromProcess;

  const files = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env"),
  ];

  for (const file of files) {
    try {
      const value = parseEnvValue(decodeEnvFile(fs.readFileSync(file)), "GROQ_API_KEY");
      if (value) {
        process.env.GROQ_API_KEY = value;
        return value;
      }
    } catch {
      /* arquivo ausente */
    }
  }

  return undefined;
}
