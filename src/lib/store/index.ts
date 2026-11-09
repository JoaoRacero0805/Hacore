import "server-only";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createPostgresStore } from "./postgres";
import type { Query, Store } from "./types";
import { isDemo } from "../config";
import { seedDemo } from "./demo";

const g = globalThis as unknown as { __hacoreStore?: Promise<Store> };

function neonQuery(url: string): Query {
  const sql = neon(url);
  return (text, params = []) => sql.query(text, params) as Promise<Record<string, unknown>[]>;
}

async function demoStore(): Promise<Store> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { unaccent } = await import("@electric-sql/pglite/contrib/unaccent");
  const db = new PGlite({ extensions: { unaccent } });
  await db.exec(readFileSync(path.join(process.cwd(), "db/schema.sql"), "utf8"));
  const store = createPostgresStore(async (t, p) => (await db.query(t, p)).rows as Record<string, unknown>[]);
  await seedDemo(store);
  return store;
}

export function getStore(): Promise<Store> {
  if (g.__hacoreStore) return g.__hacoreStore;
  const url = process.env.DATABASE_URL?.trim();
  if (url && isDemo()) throw new Error("DATABASE_URL configurado sem login Google: configure AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET.");
  g.__hacoreStore = url ? Promise.resolve(createPostgresStore(neonQuery(url))) : demoStore();
  return g.__hacoreStore;
}
