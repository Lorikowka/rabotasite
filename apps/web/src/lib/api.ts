/**
 * Клиентская часть API-клиента: безопасна для импорта из client-компонентов.
 * Серверные запросы с проксированием cookie — в ./server-api.ts
 */

/**
 * Базовый адрес API для браузера.
 *
 * По умолчанию пусто — запросы идут на тот же origin (/api/...) и проксируются
 * Next-сервером на API. Так сайт работает и с localhost, и с телефона
 * в локальной сети, без ручной настройки IP и CORS.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as
    | { error?: { message?: string; details?: unknown } }
    | null;
  return new ApiError(
    response.status,
    body?.error?.message ?? `Ошибка запроса (${response.status})`,
    body?.error?.details,
  );
}

/** Запрос к API из браузера — с передачей httpOnly-куки сессии. */
export async function clientApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as T;
}

/** Сборка query-строки из параметров (без пустых значений). */
export function toQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}
