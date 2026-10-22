/**
 * Полный сброс базы: удаление файла данных → миграции → демо-данные.
 *
 * Запуск: npm run db:reset
 *
 * Важно: перед сбросом API должен быть остановлен — работающий процесс
 * держит файл базы открытым, и удаление на Windows не даст эффекта.
 */
import { rm, stat } from 'node:fs/promises';
import { resolveDbPath } from './client.js';

const dbPath = resolveDbPath();

/** Удаляет файл базы вместе со служебными файлами SQLite. */
async function removeDb(): Promise<void> {
  const targets = [dbPath, `${dbPath}-wal`, `${dbPath}-shm`];

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    let removed = true;
    for (const target of targets) {
      try {
        await rm(target, { force: true });
      } catch (error) {
        removed = false;
        if (attempt === 5) throw error;
      }
    }

    // Проверяем, что основной файл действительно исчез.
    try {
      await stat(dbPath);
    } catch {
      return; // файла больше нет — всё чисто
    }

    if (removed) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    } else {
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
  }

  throw new Error(
    `Не удалось удалить ${dbPath}. Остановите запущенный API (процесс держит файл базы) и повторите.`,
  );
}

await removeDb();
console.log(`Удалена база: ${dbPath}`);

const { runMigrations } = await import('./migrate.js');
await runMigrations();

const { seed } = await import('./seed.js');
await seed();

console.log('');
console.log('База пересоздана и заполнена демо-данными.');
