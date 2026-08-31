import { NextResponse } from "next/server";
import { recoverConfirmBodySchema } from "@/lib/auth/login-schema";
import { confirmPasswordRecovery, mapAuthError } from "@/lib/appwrite/auth";
import {
  ensureJsonContentType,
  readJsonLimited,
} from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    ensureJsonContentType(request);
    const body = await readJsonLimited(request, 8_192);
    const parsed = recoverConfirmBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Não foi possível redefinir a senha.", code: "invalid_payload" },
        { status: 400 },
      );
    }
    await confirmPasswordRecovery(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const mapped = mapAuthError(error);
    return NextResponse.json(
      { error: "Não foi possível redefinir a senha.", code: mapped.code },
      { status: mapped.status === 401 ? 400 : mapped.status },
    );
  }
}
