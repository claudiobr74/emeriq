const isDev = process.env.NODE_ENV === "development";

function summarize(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > 180 ? `${value.slice(0, 180)}…` : value;
  }
  if (value instanceof Error) {
    return { name: value.name, message: value.message.slice(0, 300) };
  }
  return value;
}

function log(scope: string, ...args: unknown[]) {
  if (!isDev) return;
  console.info(`[${scope}]`, ...args.map(summarize));
}

export const logger = {
  audio: (...args: unknown[]) => log("Audio", ...args),
  transcription: (...args: unknown[]) => log("Transcription", ...args),
  clinicalUpdate: (...args: unknown[]) => log("ClinicalUpdate", ...args),
  clinicalFinalize: (...args: unknown[]) => log("ClinicalFinalize", ...args),
  auth: (...args: unknown[]) => log("Auth", ...args),
  error: (...args: unknown[]) => {
    if (typeof window === "undefined") {
      console.error("[Error]", ...args.map(summarize));
      return;
    }
    if (!isDev) return;
    console.warn("[Error]", ...args.map(summarize));
  },
};
