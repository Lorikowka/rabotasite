/**
 * Проверка origin для CORS.
 *
 * Список разрешённых origin задаётся переменной CORS_ORIGIN (через запятую).
 * Дополнительно (по умолчанию только в dev-режиме) разрешаются origin
 * из локальной сети — это нужно, чтобы сайт открывался с телефона/планшета
 * в одной Wi-Fi сети с ноутбуком.
 */

const PRIVATE_IPV4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']);

/** Хост из локальной сети или loopback. */
export function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (LOOPBACK_HOSTS.has(host)) return true;
  if (host.endsWith('.local') || host.endsWith('.localhost')) return true;
  return PRIVATE_IPV4.test(host);
}

/**
 * Разрешён ли origin.
 * @param origin значение заголовка Origin (может быть пустым)
 * @param allowed список origin из конфигурации
 * @param allowPrivate разрешать ли origin из локальной сети
 */
export function isAllowedOrigin(
  origin: string | undefined | null,
  allowed: string[],
  allowPrivate = false,
): boolean {
  if (!origin) return false;
  const value = origin.trim();
  if (allowed.includes(value)) return true;
  if (!allowPrivate) return false;
  try {
    return isPrivateHost(new URL(value).hostname);
  } catch {
    return false;
  }
}
