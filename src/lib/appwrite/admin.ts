import { Account, Client } from "node-appwrite";
import { AppError } from "@/lib/errors";
import {
  getAppwriteAdminApiKey,
  getAppwriteEndpoint,
  getAppwriteProjectId,
} from "@/lib/env";

export function createAdminClient(): Client {
  const endpoint = getAppwriteEndpoint();
  const projectId = getAppwriteProjectId();
  const key = getAppwriteAdminApiKey();
  if (!endpoint || !projectId || !key) {
    throw new AppError("Appwrite não configurado.", "appwrite_not_configured", 503);
  }
  return new Client().setEndpoint(endpoint).setProject(projectId).setKey(key);
}

export function createAdminAccount(): Account {
  return new Account(createAdminClient());
}

/** Client de projeto sem API key — endpoints públicos (recovery). */
export function createProjectClient(): Client {
  const endpoint = getAppwriteEndpoint();
  const projectId = getAppwriteProjectId();
  if (!endpoint || !projectId) {
    throw new AppError("Appwrite não configurado.", "appwrite_not_configured", 503);
  }
  return new Client().setEndpoint(endpoint).setProject(projectId);
}
