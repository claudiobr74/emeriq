import { NextResponse } from "next/server";
import { loginBodySchema } from "@/lib/auth/login-schema";
import { clientKeyFromRequest, consumeLoginAttempt } from "@/lib/auth/rate-limit";
import {
  createEmailPasswordSession,
  mapAuthError,
} from "@/lib/appwrite/auth";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/appwrite/config";
import { Account } from "node-appwrite";
import { createSessionClient, toAuthUser } from "@/lib/appwrite/session";
import {
  ensureJsonContentType,
  errorResponse,
  readJsonLimited,
} from "@/lib/http";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    ensureJsonContentType(request);
    const limited = consumeLoginAttempt(clientKeyFromRequest(request));
    if (!limited.ok) {
      return NextResponse.json(
        {
          error: "Muitas tentativas. Aguarde alguns instantes.",
          code: "rate_limited",
        },
        {
          status: 429,
          headers: {
            "retry-after": String(Math.ceil(limited.retryAfterMs / 1000)),
          },
        },
      );
    }

    const body = await readJsonLimited(request, 8_192);
    const parsed = loginBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "E-mail ou senha inválidos.", code: "invalid_credentials" },
        { status: 401 },
      );
    }

    const session = await createEmailPasswordSession(parsed.data);
    const account = new Account(createSessionClient(session.secret));
    const user = toAuthUser(await account.get());

    const response = NextResponse.json({ user });
    const expires = session.expire ? new Date(session.expire) : undefined;
    response.cookies.set({
      name: SESSION_COOKIE,
      value: session.secret,
      ...SESSION_COOKIE_OPTIONS,
      expires,
    });
    return response;
  } catch (error) {
    const mapped = mapAuthError(error);
    if (error instanceof AppError && error.code === "appwrite_not_configured") {
      return errorResponse(error, {
        message: "Não foi possível entrar agora. Tente novamente.",
        code: "unknown_error",
      });
    }
    return NextResponse.json(
      { error: mapped.message, code: mapped.code },
      { status: mapped.status },
    );
  }
}
