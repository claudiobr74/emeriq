const isDev = process.env.NODE_ENV === "development";

function log(scope: string, ...args: unknown[]) {
  if (!isDev) return;
  console.info(`[${scope}]`, ...args);
}

export const logger = {
  audio: (...args: unknown[]) => log("Audio", ...args),
  transcription: (...args: unknown[]) => log("Transcription", ...args),
  clinicalUpdate: (...args: unknown[]) => log("ClinicalUpdate", ...args),
  clinicalFinalize: (...args: unknown[]) => log("ClinicalFinalize", ...args),
  error: (...args: unknown[]) => {
    if (!isDev) return;
    console.error("[Error]", ...args);
  },
};
