import { NextResponse } from "next/server";
import {
  appwriteReady,
  findActiveConsultationForUser,
} from "@/lib/appwrite/consultations";
import { requireUser } from "@/lib/appwrite/session";
import { ensureSameOrigin, errorResponse } from "@/lib/http";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    ensureSameOrigin(request);
    const user = await requireUser();
    if (!appwriteReady()) {
      throw new AppError("Appwrite não configurado.", "appwrite_not_configured", 503);
    }
    const consultation = await findActiveConsultationForUser(user.id);
    return NextResponse.json({ consultation });
  } catch (error) {
    return errorResponse(error, {
      message: "Não foi possível carregar o atendimento.",
      code: "consultation_active_failed",
    });
  }
}
