/**
 * Cria database + tabela consultations no Appwrite (TablesDB).
 * Uso: pnpm appwrite:setup  (requer APPWRITE_PROJECT_ID e APPWRITE_API_KEY)
 */
import {
  getAppwriteApiKey,
  getAppwriteDatabaseId,
  getAppwriteEndpoint,
  getAppwriteProjectId,
  getAppwriteTableId,
} from "../src/lib/env";

async function req(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const endpoint = getAppwriteEndpoint();
  const projectId = getAppwriteProjectId();
  const apiKey = getAppwriteApiKey();
  if (!endpoint || !projectId || !apiKey) {
    throw new Error("Defina APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID e APPWRITE_API_KEY.");
  }
  const response = await fetch(`${endpoint}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, json };
}

async function ensureOk(
  label: string,
  result: { ok: boolean; status: number; json: unknown },
) {
  if (result.ok || result.status === 409) {
    console.log(`${label}: ${result.status === 409 ? "já existe" : "ok"}`);
    return;
  }
  console.error(label, result.status, result.json);
  throw new Error(`Falha em ${label}`);
}

async function main() {
  const databaseId = getAppwriteDatabaseId();
  const tableId = getAppwriteTableId();

  await ensureOk(
    "database",
    await req("POST", "/tablesdb", {
      databaseId,
      name: "EmerIQ",
      enabled: true,
      specification: "serverless",
    }),
  );

  await ensureOk(
    "table",
    await req("POST", `/tablesdb/${databaseId}/tables`, {
      tableId,
      name: "consultations",
      permissions: [],
      rowSecurity: false,
      enabled: true,
    }),
  );

  const columns: Array<{ path: string; body: Record<string, unknown> }> = [
    {
      path: "enum",
      body: {
        key: "status",
        elements: ["active", "finalized"],
        required: true,
      },
    },
    { path: "text", body: { key: "transcript", required: true } },
    { path: "text", body: { key: "clinical_state", required: true } },
    { path: "text", body: { key: "soap", required: false, default: "" } },
    {
      path: "varchar",
      body: { key: "finalize_warning", size: 500, required: false, default: "" },
    },
  ];

  for (const column of columns) {
    await ensureOk(
      `column ${column.body.key}`,
      await req(
        "POST",
        `/tablesdb/${databaseId}/tables/${tableId}/columns/${column.path}`,
        column.body,
      ),
    );
  }

  console.log(`Pronto: ${databaseId}/${tableId}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
