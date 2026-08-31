import { NextResponse } from "next/server";
import { recoverBodySchema } from "@/lib/auth/login-schema";
import { requestPasswordRecovery } from "@/lib/appwrite/auth";
import { getAppwriteRecoveryUrl } from "@/lib/env";
import {
  ensureJsonContentType,
  errorResponse,
  readJsonLimited,
} from "@/lib/http";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    ensureJsonContentType(request);
    const body = await readJsonLimited(request, 8_192);
    const parsed = recoverBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: true });
    }

    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    const fallback =
      origin && host && new URL(origin).host === host
        ? `${origin}/recuperar`
        : undefined;
    const url = getAppwriteRecoveryUrl() ?? fallback;
    if (url) {
      await requestPasswordRecovery({ email: parsed.data.email, url });
    } else {
      logger.error("password recovery skipped: missing APPWRITE_RECOVERY_URL and origin");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, {
      message: "Não foi possível enviar as instruções agora.",
      code: "recovery_failed",
    });
  }
}
