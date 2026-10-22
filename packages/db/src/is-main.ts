import { pathToFileURL } from 'node:url';

/**
 * Проверяет, что текущий модуль запущен как точка входа.
 *
 * Нужна, чтобы скрипты можно было импортировать из других скриптов
 * (например, `db:reset` вызывает миграции и сид) без побочного
 * автозапуска при импорте — иначе работа выполнялась бы дважды.
 */
export function isMainModule(metaUrl: string): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return pathToFileURL(entry).href === metaUrl;
  } catch {
    return false;
  }
}
