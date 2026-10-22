import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './errors.js';

export function registerErrorHandler(app: {
  setErrorHandler: (
    handler: (error: unknown, request: FastifyRequest, reply: FastifyReply) => void,
  ) => void;
}) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: 'validation_failed',
          message: 'Проверьте правильность заполнения полей',
          details: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      });
    }

    const fastifyError = error as { statusCode?: number; message?: string; code?: string };
    const statusCode = fastifyError.statusCode ?? 500;

    if (statusCode >= 500) {
      request.log.error({ err: error }, 'Внутренняя ошибка');
      return reply.status(500).send({
        error: { code: 'internal_error', message: 'Внутренняя ошибка сервера' },
      });
    }

    return reply.status(statusCode).send({
      error: {
        code: fastifyError.code ?? 'request_error',
        message: fastifyError.message ?? 'Ошибка запроса',
      },
    });
  });
}
