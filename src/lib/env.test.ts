import { afterEach, describe, expect, it } from "vitest";
import { missingOpenAiKeyMessage } from "@/lib/env";

const originalVercel = process.env.VERCEL;
const originalNetlify = process.env.NETLIFY;

afterEach(() => {
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
  if (originalNetlify === undefined) delete process.env.NETLIFY;
  else process.env.NETLIFY = originalNetlify;
});

describe("missingOpenAiKeyMessage", () => {
  it("explica o caminho local quando não está em host de deploy", () => {
    delete process.env.VERCEL;
    delete process.env.NETLIFY;
    expect(missingOpenAiKeyMessage()).toContain(".env.local");
    expect(missingOpenAiKeyMessage()).not.toContain("Vercel");
  });

  it("explica que Cloud Agent ≠ Vercel quando VERCEL está definido", () => {
    process.env.VERCEL = "1";
    delete process.env.NETLIFY;
    const message = missingOpenAiKeyMessage();
    expect(message).toContain("Vercel");
    expect(message).toContain("Cloud Agent");
    expect(message).toContain("Redeploy");
  });
});
