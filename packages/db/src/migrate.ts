/**
 * Применение миграций.
 *
 * SQL-файлы генерируются командой `npm run db:generate` (drizzle-kit),
 * а применяются этим раннером через libsql — чтобы не тянуть нативный
 * better-sqlite3 (на Windows требует Visual Studio Build Tools).
 */
import { createClient } from '@libsql/client';
import { mkdirSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { REPO_ROOT, resolveDbPath, toFileUrl } from './client.js';
import { isMainModule } from './is-main.js';

const MIGRATIONS_DIR = path.join(REPO_ROOT, 'packages', 'db', 'drizzle');

function splitStatements(sql: string): string[] {
  return sql
    .split('--> statement-breakpoint')
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !/^--/.test(part.split('\n')[0] ?? ''));
}

export async function runMigrations(): Promise<void> {
  const dbPath = resolveDbPath();
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const client = createClient({ url: toFileUrl(dbPath) });

  await client.execute(
    `CREATE TABLE IF NOT EXISTS __migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )`,
  );

  let files: string[] = [];
  try {
    files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  } catch {
    console.error(`Каталог миграций не найден: ${MIGRATIONS_DIR}`);
    console.error('Сначала выполните: npm run db:generate');
    client.close();
    process.exit(1);
  }

  let applied = 0;
  for (const file of files) {
    const existing = await client.execute({
      sql: 'SELECT name FROM __migrations WHERE name = ?',
      args: [file],
    });
    if (existing.rows.length > 0) continue;

    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    for (const statement of splitStatements(sql)) {
      await client.execute(statement);
    }
    await client.execute({
      sql: 'INSERT INTO __migrations (name, applied_at) VALUES (?, ?)',
      args: [file, new Date().toISOString()],
    });
    console.log(`  ✓ применена миграция ${file}`);
    applied += 1;
  }

  client.close();
  console.log(
    applied === 0
      ? `База актуальна (${files.length} миграций, файл ${dbPath})`
      : `Применено миграций: ${applied} (файл ${dbPath})`,
  );
}

// Автозапуск только когда файл запущен как скрипт.
// При импорте (например, из `db:reset`) миграции вызывает вызывающий код.
if (isMainModule(import.meta.url)) {
  runMigrations().catch((error) => {
    console.error('Ошибка миграции:', error);
    process.exit(1);
  });
}
