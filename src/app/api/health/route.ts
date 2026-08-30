import { NextResponse } from "next/server";
import { getOpenAiApiKey, isAppwriteConfigured } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    openaiConfigured: Boolean(getOpenAiApiKey()),
    appwriteConfigured: isAppwriteConfigured(),
  });
}
