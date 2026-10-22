/**
 * Типизированные ошибки приложения.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string = 'app_error',
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message: string, code = 'bad_request', details?: unknown) =>
  new AppError(400, message, code, details);

export const unauthorized = (message = 'Требуется авторизация', code = 'unauthorized') =>
  new AppError(401, message, code);

export const forbidden = (message = 'Недостаточно прав', code = 'forbidden') =>
  new AppError(403, message, code);

export const notFound = (message = 'Не найдено', code = 'not_found') =>
  new AppError(404, message, code);

export const conflict = (message: string, code = 'conflict') => new AppError(409, message, code);

export const unprocessable = (message: string, details?: unknown, code = 'validation_failed') =>
  new AppError(422, message, code, details);
