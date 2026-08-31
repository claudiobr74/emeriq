import { NextResponse } from "next/server";
import { requireUser } from "@/lib/appwrite/session";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ user });
  } catch (error) {
    return errorResponse(error, {
      message: "Não autenticado.",
      code: "unauthorized",
    });
  }
}
