import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from './schema.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** Корень монорепозитория (packages/db/dist -> packages/db -> packages -> root). */
export const REPO_ROOT = path.resolve(HERE, '..', '..', '..');

export const DEFAULT_DB_PATH = path.join(REPO_ROOT, 'data', 'teenwork.db');

export function resolveDbPath(): string {
  const configured = process.env.DB_PATH;
  if (!configured) return DEFAULT_DB_PATH;
  return path.isAbsolute(configured) ? configured : path.resolve(REPO_ROOT, configured);
}

/** Преобразует путь к файлу в URL, понятный libsql (Windows требует прямых слэшей). */
export function toFileUrl(dbPath: string): string {
  const normalized = dbPath.replace(/\\/g, '/');
  return `file:${normalized}`;
}

export function createDb(dbPath: string = resolveDbPath()) {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const client = createClient({ url: toFileUrl(dbPath) });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;

let instance: Db | null = null;

/** Синглтон подключения к БД. */
export function getDb(): Db {
  if (!instance) {
    instance = createDb();
  }
  return instance;
}

export function closeDb(): void {
  instance = null;
}

/** Текущее время в ISO-8601 (UTC) — единый формат хранения дат. */
export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(): string {
  return crypto.randomUUID();
}
