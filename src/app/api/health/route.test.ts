import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getOpenAiApiKey: () => "sk-test",
  isSupabaseConfigured: () => false,
}));

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("reports provider configuration without leaking secrets", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      openaiConfigured: true,
      supabaseConfigured: false,
    });
  });
});
