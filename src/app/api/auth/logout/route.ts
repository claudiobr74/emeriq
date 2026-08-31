import { NextResponse } from "next/server";
import { deleteCurrentSession } from "@/lib/appwrite/auth";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/appwrite/config";
import { getSessionSecret } from "@/lib/appwrite/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const secret = await getSessionSecret();
  if (secret) {
    await deleteCurrentSession(secret);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    ...SESSION_COOKIE_OPTIONS,
    expires: new Date(0),
    maxAge: 0,
  });
  return response;
}
