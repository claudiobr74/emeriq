/**
 * Atribui owner_user_id a consultas antigas (owner vazio) para UM usuário.
 * Não roda automaticamente.
 *
 * Uso:
 *   pnpm migrate:consultation-ownership --user=<APPWRITE_USER_ID>
 */
import {
  getAppwriteAdminApiKey,
  getAppwriteDatabaseId,
  getAppwriteEndpoint,
  getAppwriteProjectId,
  getAppwriteTableId,
} from "../src/lib/env";

function argUserId(): string {
  const match = process.argv.find((item) => item.startsWith("--user="));
  const value = match?.slice("--user=".length)?.trim();
  if (!value) {
    throw new Error("Informe --user=<APPWRITE_USER_ID>");
  }
  return value;
}

async function main() {
  const userId = argUserId();
  const endpoint = getAppwriteEndpoint()?.replace(/\/$/, "");
  const projectId = getAppwriteProjectId();
  const apiKey = getAppwriteAdminApiKey();
  if (!endpoint || !projectId || !apiKey) {
    throw new Error("Appwrite admin não configurado.");
  }
  const databaseId = getAppwriteDatabaseId();
  const tableId = getAppwriteTableId();

  const list = await fetch(
    `${endpoint}/tablesdb/${databaseId}/tables/${tableId}/rows?queries[]=${encodeURIComponent(
      JSON.stringify({ method: "limit", values: [100] }),
    )}`,
    {
      headers: {
        Accept: "application/json",
        "X-Appwrite-Project": projectId,
        "X-Appwrite-Key": apiKey,
      },
    },
  );
  if (!list.ok) {
    throw new Error(`Falha ao listar consultas (${list.status}).`);
  }
  const json = (await list.json()) as { rows?: Array<Record<string, unknown>> };
  const rows = json.rows ?? [];
  let updated = 0;
  for (const row of rows) {
    const owner = String(row.owner_user_id ?? "");
    if (owner) continue;
    const id = String(row.$id ?? "");
    if (!id) continue;
    const patch = await fetch(
      `${endpoint}/tablesdb/${databaseId}/tables/${tableId}/rows/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Appwrite-Project": projectId,
          "X-Appwrite-Key": apiKey,
        },
        body: JSON.stringify({
          data: { owner_user_id: userId },
          permissions: [
            `read("user:${userId}")`,
            `update("user:${userId}")`,
            `delete("user:${userId}")`,
          ],
        }),
      },
    );
    if (!patch.ok) {
      console.warn("falha ao migrar", id, patch.status);
      continue;
    }
    updated += 1;
  }
  console.log(`Migradas ${updated} consultas para o usuário ${userId}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
