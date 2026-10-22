import type { AuthResponse } from '@teenwork/shared';
import { ApiError } from './api';
import { serverApi } from './server-api';

/** Текущая сессия пользователя (или null, если пользователь не авторизован). */
export async function getSession(): Promise<AuthResponse | null> {
  try {
    return await serverApi<AuthResponse>('/api/auth/me');
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
    return null;
  }
}
