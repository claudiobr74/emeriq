import { NextResponse } from "next/server";
import { getOpenAiApiKey } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    openaiConfigured: Boolean(getOpenAiApiKey()),
  });
}
