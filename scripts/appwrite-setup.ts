/**
 * Cria/verifica database + tabela consultations no Appwrite (TablesDB).
 * Não cria usuários. Uso: pnpm appwrite:setup
 */
import { Permission, Role } from "node-appwrite";
import {
  getAppwriteAdminApiKey,
  getAppwriteDatabaseId,
  getAppwriteEndpoint,
  getAppwriteProjectId,
  getAppwriteTableId,
} from "../src/lib/env";

const STATUS_VALUES = ["active", "finalizing", "finalized", "discarded"];

async function req(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const endpoint = getAppwriteEndpoint();
  const projectId = getAppwriteProjectId();
  const apiKey = getAppwriteAdminApiKey();
  if (!endpoint || !projectId || !apiKey) {
    throw new Error(
      "Defina APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID e APPWRITE_ADMIN_API_KEY (ou APPWRITE_API_KEY).",
    );
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

async function exists(path: string): Promise<boolean> {
  const result = await req("GET", path);
  return result.ok;
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
  const tablePath = `/tablesdb/${databaseId}/tables/${tableId}`;

  if (await exists(`/tablesdb/${databaseId}`)) {
    console.log("database: já existe");
  } else {
    await ensureOk(
      "database",
      await req("POST", "/tablesdb", {
        databaseId,
        name: "EmerIQ",
        enabled: true,
        specification: "serverless",
      }),
    );
  }

  const tablePermissions = [
    Permission.create(Role.users()),
    Permission.read(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
  ];

  if (await exists(tablePath)) {
    console.log("table: já existe");
    const updated = await req("PUT", tablePath, {
      name: "consultations",
      permissions: tablePermissions,
      rowSecurity: true,
      enabled: true,
    });
    if (updated.ok) {
      console.log("table permissions/rowSecurity: ok");
    } else {
      console.warn("table permissions: não atualizado", updated.status, updated.json);
    }
  } else {
    await ensureOk(
      "table",
      await req("POST", `/tablesdb/${databaseId}/tables`, {
        tableId,
        name: "consultations",
        permissions: tablePermissions,
        rowSecurity: true,
        enabled: true,
      }),
    );
  }

  const columns: Array<{ path: string; body: Record<string, unknown> }> = [
    {
      path: "enum",
      body: {
        key: "status",
        elements: STATUS_VALUES,
        required: true,
      },
    },
    {
      path: "varchar",
      body: { key: "owner_user_id", size: 36, required: false, default: "" },
    },
    { path: "text", body: { key: "transcript", required: true } },
    { path: "text", body: { key: "clinical_state", required: true } },
    { path: "text", body: { key: "soap", required: false, default: "" } },
    {
      path: "varchar",
      body: { key: "finalize_warning", size: 500, required: false, default: "" },
    },
    {
      path: "varchar",
      body: { key: "started_at", size: 40, required: false, default: "" },
    },
    {
      path: "varchar",
      body: { key: "finalized_at", size: 40, required: false, default: "" },
    },
    {
      path: "varchar",
      body: {
        key: "transcription_integrity",
        size: 16,
        required: false,
        default: "",
      },
    },
  ];

  const existingColumns = await req("GET", `${tablePath}/columns`);
  const existingKeys = new Set(
    Array.isArray((existingColumns.json as { columns?: { key?: string }[] })?.columns)
      ? (existingColumns.json as { columns: { key?: string }[] }).columns
          .map((column) => column.key)
          .filter((key): key is string => Boolean(key))
      : [],
  );

  for (const column of columns) {
    const key = String(column.body.key);
    if (existingKeys.has(key)) {
      if (key === "status") {
        const patched = await req("PATCH", `${tablePath}/columns/enum/${key}`, {
          elements: STATUS_VALUES,
          required: true,
          default: null,
        });
        if (patched.ok) {
          console.log("column status: enum atualizado");
        } else {
          console.warn(
            "column status: enum não atualizado (linhas antigas permanecem)",
            patched.status,
          );
        }
      } else {
        console.log(`column ${key}: já existe`);
      }
      continue;
    }
    await ensureOk(
      `column ${key}`,
      await req("POST", `${tablePath}/columns/${column.path}`, column.body),
    );
  }

  const indexes = [
    { key: "owner_user_id", columns: ["owner_user_id"] },
    { key: "status", columns: ["status"] },
    { key: "owner_status", columns: ["owner_user_id", "status"] },
  ];

  const existingIndexes = await req("GET", `${tablePath}/indexes`);
  const existingIndexKeys = new Set(
    Array.isArray((existingIndexes.json as { indexes?: { key?: string }[] })?.indexes)
      ? (existingIndexes.json as { indexes: { key?: string }[] }).indexes
          .map((index) => index.key)
          .filter((key): key is string => Boolean(key))
      : [],
  );

  for (const index of indexes) {
    if (existingIndexKeys.has(index.key)) {
      console.log(`index ${index.key}: já existe`);
      continue;
    }
    const created = await req("POST", `${tablePath}/indexes`, {
      key: index.key,
      type: "key",
      columns: index.columns,
    });
    if (created.ok || created.status === 409) {
      console.log(`index ${index.key}: ok`);
    } else {
      console.warn(`index ${index.key}: não criado`, created.status, created.json);
    }
  }

  console.log(`Pronto: ${databaseId}/${tableId}`);
  console.log("Usuários de teste: criar no Appwrite Console. Este script não cria contas.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
