import { Account, Client } from "node-appwrite";
import { cookies } from "next/headers";
import { UnauthorizedError } from "@/lib/errors";
import {
  getAppwriteEndpoint,
  getAppwriteProjectId,
} from "@/lib/env";
import { SESSION_COOKIE } from "@/lib/appwrite/config";
import type { AuthUser } from "@/lib/auth/types";
import { logger } from "@/lib/logger";

export function createSessionClient(secret: string): Client {
  const endpoint = getAppwriteEndpoint();
  const projectId = getAppwriteProjectId();
  if (!endpoint || !projectId) {
    throw new UnauthorizedError();
  }
  return new Client().setEndpoint(endpoint).setProject(projectId).setSession(secret);
}

export async function getSessionSecret(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value?.trim();
  return value || null;
}

export function toAuthUser(account: {
  $id: string;
  name?: string;
  email?: string;
}): AuthUser {
  return {
    id: account.$id,
    name: account.name ?? "",
    email: account.email ?? "",
  };
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const secret = await getSessionSecret();
  if (!secret) return null;
  try {
    const account = new Account(createSessionClient(secret));
    const user = await account.get();
    return toAuthUser(user);
  } catch (error) {
    logger.auth("session invalid");
    logger.error("getSessionUser", error);
    return null;
  }
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
