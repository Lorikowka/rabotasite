import { cookies } from 'next/headers';
import { toApiError } from './api';

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

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}${path}`, {
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
