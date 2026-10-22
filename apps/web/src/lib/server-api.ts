import { cookies } from 'next/headers';
import { toApiError } from './api';

/**
 * Адрес API для серверных запросов (Server Components).
 * На сервере нужен абсолютный URL — по умолчанию локальный адрес API.
 */
const SERVER_API_URL =
  process.env.API_INTERNAL_URL ??
  (process.env.NEXT_PUBLIC_API_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_API_URL
    : 'http://127.0.0.1:4000');

/**
 * Серверные запросы к API: cookie сессии проксируются автоматически.
 * Используется только в Server Components.
 */
export async function serverApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const cookie = cookieStore
    .getAll()
    .map((entry) => `${entry.name}=${entry.value}`)
    .join('; ');

  const response = await fetch(`${SERVER_API_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(init.headers ?? {}),
      ...(cookie ? { cookie } : {}),
    },
  });

  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as T;
}
