import { z } from 'zod';

/**
 * Конфигурация окружения. Значения по умолчанию — только для локальной разработки.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  JWT_SECRET: z.string().min(16).default('dev-secret-key-change-me-in-production-0123456789'),
  JWT_TTL: z.string().default('30d'),
  SESSION_COOKIE: z.string().default('teenwork_session'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  /** Фиксированный код подтверждения для dev-режима. В проде — случайный. */
  OTP_FIXED_CODE: z.string().default('111111'),
  OTP_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  LOG_LEVEL: z.string().default('info'),
  /** Отдавать код подтверждения в ответе (только для dev). */
  EXPOSE_OTP: z.coerce.boolean().default(true),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Некорректные переменные окружения:');
  console.error(parsed.error.issues);
  process.exit(1);
}

export const env = parsed.data;
export const isDev = env.NODE_ENV !== 'production';
export const isProd = env.NODE_ENV === 'production';
