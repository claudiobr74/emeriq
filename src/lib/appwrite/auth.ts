import { Account, AppwriteException } from "node-appwrite";
import { createAdminAccount, createProjectClient } from "@/lib/appwrite/admin";
import { createSessionClient } from "@/lib/appwrite/session";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { LoginFailureCode } from "@/lib/auth/types";

export interface CreatedSession {
  secret: string;
  expire: string;
  userId: string;
}

export function mapAuthError(error: unknown): {
  code: LoginFailureCode;
  message: string;
  status: number;
} {
  if (error instanceof AppError && error.code === "appwrite_not_configured") {
    return {
      code: "unknown_error",
      message: "Não foi possível entrar agora. Tente novamente.",
      status: 503,
    };
  }

  const status =
    error instanceof AppwriteException
      ? error.code
      : (error as { status?: number; code?: number }).status ??
        (error as { code?: number }).code;

  const type =
    error instanceof AppwriteException
      ? error.type
      : String((error as { type?: string }).type ?? "");

  if (status === 429 || /rate.?limit/i.test(type)) {
    return {
      code: "rate_limited",
      message: "Muitas tentativas. Aguarde alguns instantes.",
      status: 429,
    };
  }

  if (
    status === 401 ||
    status === 400 ||
    /invalid.?credentials|user_invalid_credentials|user_blocked/i.test(type)
  ) {
    return {
      code: "invalid_credentials",
      message: "E-mail ou senha inválidos.",
      status: 401,
    };
  }

  if (
    error instanceof TypeError ||
    /fetch|network|ECONN|ENOTFOUND|ETIMEDOUT/i.test(
      error instanceof Error ? error.message : String(error),
    )
  ) {
    return {
      code: "network_error",
      message: "Falha de conexão. Verifique a rede e tente novamente.",
      status: 503,
    };
  }

  logger.error("auth unmapped error", error);
  return {
    code: "unknown_error",
    message: "Não foi possível entrar agora. Tente novamente.",
    status: 502,
  };
}

export async function createEmailPasswordSession(input: {
  email: string;
  password: string;
}): Promise<CreatedSession> {
  const account = createAdminAccount();
  const session = await account.createEmailPasswordSession({
    email: input.email,
    password: input.password,
  });
  if (!session.secret) {
    logger.error("session.secret empty — admin key needs sessions.write");
    throw new AppError(
      "Não foi possível entrar agora. Tente novamente.",
      "session_secret_missing",
      503,
    );
  }
  return {
    secret: session.secret,
    expire: session.expire,
    userId: session.userId,
  };
}

export async function deleteCurrentSession(secret: string): Promise<void> {
  try {
    const account = new Account(createSessionClient(secret));
    await account.deleteSession({ sessionId: "current" });
  } catch (error) {
    logger.error("logout session destroy", error);
  }
}

export async function requestPasswordRecovery(input: {
  email: string;
  url: string;
}): Promise<void> {
  const account = new Account(createProjectClient());
  try {
    await account.createRecovery({ email: input.email, url: input.url });
  } catch (error) {
    logger.error("createRecovery", error);
  }
}

export async function confirmPasswordRecovery(input: {
  userId: string;
  secret: string;
  password: string;
}): Promise<void> {
  const account = new Account(createProjectClient());
  await account.updateRecovery({
    userId: input.userId,
    secret: input.secret,
    password: input.password,
  });
}
