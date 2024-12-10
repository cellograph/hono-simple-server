import { Env } from "@/types";
import { Context } from "hono";
import { Surreal } from "surrealdb";

// highlight-start
let db: Surreal | undefined;

export async function initDb(
  c: Context<Env>,
  namespace: string,
  database: string
): Promise<Surreal | undefined> {
  if (db) return db;
  db = new Surreal();

  try {
    await db.connect(c.env.DB_ENDPOINT + "/rpc", {
      auth: `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJTVVJSRUFMIiwiaWF0IjoxNzMxMzU2OTMwLCJleHAiOjE3NjI4OTI5MzAsImF1ZCI6IiIsInN1YiI6IiIsImFjIjoibnRkZXZjZWxscm9vdCJ9.LSz4AOhSghjXYq-kVw9cv7qvPYhqyHQBOn4E-SV6wEpvrz0l618s-vczKawr8S5xMIUe_7lPPv0AF3E8SfaQPA`,
    });
    await db.use({ namespace, database });
    return db;
  } catch (err) {
    console.error("Failed to connect to SurrealDB:", err);
    throw err;
  }
}

export async function closeDb(): Promise<void> {
  if (!db) return;
  await db.close();
  db = undefined;
}

export function getDb(): Surreal | undefined {
  return db;
}
