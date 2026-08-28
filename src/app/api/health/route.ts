import { NextResponse } from "next/server";
import { getGroqApiKey } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    groqConfigured: Boolean(getGroqApiKey()),
  });
}
