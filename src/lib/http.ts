import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export const BODY_LIMITS = {
  jsonBytes: 512_000,
  audioBytes: 8_000_000,
  transcriptChars: 60_000,
  newSegmentChars: 12_000,
} as const;

/** Origin válida = mesma origem (ou ausente, ex.: navegação same-origin). */
export function ensureSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("host");
  try {
    if (new URL(origin).host !== host) {
      throw new AppError("Origem não permitida.", "forbidden_origin", 403);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Origem inválida.", "forbidden_origin", 403);
  }
}

export function ensureJsonContentType(request: Request): void {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new AppError(
      "Content-Type inválido; esperado application/json.",
      "invalid_content_type",
      415,
    );
  }
}

export async function readJsonLimited(
  request: Request,
  maxBytes: number = BODY_LIMITS.jsonBytes,
): Promise<unknown> {
  const text = await request.text();
  if (text.length > maxBytes) {
    throw new AppError("Payload grande demais.", "payload_too_large", 413);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError("JSON inválido.", "invalid_json", 400);
  }
}

/** Resposta de erro segura: sem stack trace, código estável. */
export function errorResponse(error: unknown, fallback: {
  message: string;
  code: string;
}): NextResponse {
  if (error instanceof AppError) {
    logger.error(`[api] ${error.code}`, error.message);
    const headers = error.retryAfterMs
      ? { "retry-after": String(Math.ceil(error.retryAfterMs / 1000)) }
      : undefined;
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status, headers },
    );
  }
  logger.error(`[api] ${fallback.code}`, error);
  return NextResponse.json(
    { error: fallback.message, code: fallback.code },
    { status: 502 },
  );
}
