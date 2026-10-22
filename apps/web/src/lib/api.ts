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
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await response.json().catch(() => null);
    if (body && typeof body === 'object') {
      const errorBody = body as { error?: { message?: string; details?: unknown }; message?: string };
      if (errorBody.error?.message) {
        return new ApiError(response.status, errorBody.error.message, errorBody.error.details);
      }
      if (errorBody.message) {
        return new ApiError(response.status, errorBody.message, errorBody.error?.details);
      }
    }
    return new ApiError(response.status, `Ошибка запроса (${response.status})`);
  }

  const text = await response.text().catch(() => '');
  return new ApiError(response.status, text.trim() || `Ошибка запроса (${response.status})`);
}

/** Запрос к API из браузера — с передачей httpOnly-куки сессии. */
export async function clientApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers as HeadersInit);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Content-Type: application/json нужно только когда есть тело запроса.
  // Иначе браузер/сервер падают с "Body cannot be empty when content-type is set to 'application/json'".
  const hasBody = init.body !== undefined && init.body !== null;
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text().catch(() => '');
    if (!text.trim()) return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      return {} as T;
    }
  }

  const text = await response.text().catch(() => '');
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
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
