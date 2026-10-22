import type { FastifyInstance } from 'fastify';
import { and, desc, eq } from 'drizzle-orm';
import { getDb, employerProfiles, newId, nowIso, otpCodes, teenProfiles, users } from '@teenwork/db';
import {
  cohortFromBirthDate,
  loginSchema,
  otpSchema,
  registerSchema,
  MIN_HIRING_AGE,
} from '@teenwork/shared';
import { badRequest, conflict, notFound, unauthorized } from '../lib/errors.js';
import { issueSession } from '../plugins/auth.js';
import { rateLimit } from '../plugins/rate-limit.js';
import { env, isDev } from '../config/env.js';
import { getAuthPayload, getUserByPhone } from '../services/user.service.js';

const db = getDb();

/** Ключ лимитера запросов по номеру телефона из тела запроса. */
function phoneKey(request: { body?: unknown }): string {
  const body = request.body as { phone?: unknown } | undefined;
  return typeof body?.phone === 'string' ? `phone:${body.phone}` : 'phone:unknown';
}

function generateCode(): string {
  if (isDev && env.OTP_FIXED_CODE) return env.OTP_FIXED_CODE;
  return String(Math.floor(100000 + Math.random() * 900000));
}

function ageFromBirthDate(birthDate: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) age -= 1;
  return age;
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  /** Регистрация: подросток, бизнес или частный заказчик. */
  app.post(
    '/api/auth/register',
    {
      // Защита от массовой регистрации аккаунтов с одного IP.
      preHandler: rateLimit({
        name: 'register',
        max: 20,
        windowMs: 60 * 60_000,
        message: 'Слишком много регистраций с одного устройства. Попробуйте позже',
      }),
    },
    async (request, reply) => {
      const body = registerSchema.parse(request.body);

      const existing = await getUserByPhone(body.phone);
      if (existing) throw conflict('Аккаунт с таким номером уже существует', 'phone_taken');

      const id = newId();
      const timestamp = nowIso();

      if (body.role === 'teen') {
        const birthDate = new Date(body.birthDate + 'T00:00:00');
        const age = ageFromBirthDate(birthDate);

        if (age < MIN_HIRING_AGE) {
          throw badRequest(`Платформа доступна с ${MIN_HIRING_AGE} лет`, 'too_young');
        }

        await db.insert(users).values({
          id,
          role: 'teen',
          phone: body.phone,
          fullName: body.fullName,
          birthDate: body.birthDate,
          isVerified: false,
          rating: 0,
          ratingCount: 0,
          createdAt: timestamp,
        });

        await db.insert(teenProfiles).values({
          userId: id,
          ageCohort: cohortFromBirthDate(birthDate),
          skills: [],
          availableHours: [],
          radiusKm: 2,
          parentConsentUploaded: false,
          isSelfEmployed: false,
          completedGigs: 0,
          onTimeStreak: 0,
          avgResponseMinutes: 0,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      } else {
        await db.insert(users).values({
          id,
          role: body.role,
          phone: body.phone,
          fullName: body.fullName,
          isVerified: false,
          rating: 0,
          ratingCount: 0,
          createdAt: timestamp,
        });

        await db.insert(employerProfiles).values({
          userId: id,
          companyName: body.role === 'business' ? body.companyName : null,
          inn: body.role === 'business' ? body.inn : null,
          verificationStatus: body.role === 'business' ? 'pending' : 'none',
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }

      await issueSession(app, reply, { sub: id, role: body.role });

      const payload = await getAuthPayload(id);
      return reply.status(201).send(payload);
    },
  );

  /** Запрос кода подтверждения. */
  app.post(
    '/api/auth/login',
    {
      // Не больше 5 кодов на один номер за 10 минут — защита от SMS-флуда
      // и от перебора кода подтверждения.
      preHandler: rateLimit({
        name: 'otp-request',
        max: 5,
        windowMs: 10 * 60_000,
        key: phoneKey,
        message: 'Слишком много запросов кода. Попробуйте через несколько минут',
      }),
    },
    async (request) => {
      const { phone } = loginSchema.parse(request.body);

      const user = await getUserByPhone(phone);
      if (!user) throw notFound('Аккаунт с таким номером не найден');

      const code = generateCode();
      const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60_000).toISOString();

      await db.insert(otpCodes).values({
        id: newId(),
        phone,
        code,
        attempts: 0,
        consumed: false,
        expiresAt,
        createdAt: nowIso(),
      });

      return {
        sent: true,
        phone,
        expiresInSeconds: env.OTP_TTL_MINUTES * 60,
        // В dev-режиме код возвращается в ответе, чтобы не поднимать SMS-шлюз.
        ...(isDev && env.EXPOSE_OTP ? { devCode: code } : {}),
      };
    },
  );

  /** Подтверждение кода и вход. */
  app.post(
    '/api/auth/verify',
    {
      // Дополнительный лимит поверх OTP_MAX_ATTEMPTS: даже с новыми кодами
      // перебрать шестизначный код не получится.
      preHandler: rateLimit({
        name: 'otp-verify',
        max: 20,
        windowMs: 10 * 60_000,
        key: phoneKey,
        message: 'Слишком много попыток ввода кода. Попробуйте позже',
      }),
    },
    async (request, reply) => {
      const { phone, code } = otpSchema.parse(request.body);

      const record = (
        await db
          .select()
          .from(otpCodes)
          .where(eq(otpCodes.phone, phone))
          .orderBy(desc(otpCodes.createdAt))
          .limit(1)
      )[0];

      if (!record || record.consumed) throw badRequest('Запросите код подтверждения заново');
      if (new Date(record.expiresAt).getTime() < Date.now()) {
        throw badRequest('Код истёк, запросите новый', 'otp_expired');
      }
      if (record.attempts >= env.OTP_MAX_ATTEMPTS) {
        throw badRequest('Слишком много попыток, запросите новый код', 'otp_attempts_exceeded');
      }

      if (record.code !== code) {
        await db
          .update(otpCodes)
          .set({ attempts: record.attempts + 1 })
          .where(eq(otpCodes.id, record.id));
        throw badRequest('Неверный код подтверждения', 'otp_invalid');
      }

      await db.update(otpCodes).set({ consumed: true }).where(eq(otpCodes.id, record.id));

      const user = await getUserByPhone(phone);
      if (!user) throw unauthorized();

      await issueSession(app, reply, { sub: user.id, role: user.role });

      const payload = await getAuthPayload(user.id);
      return payload;
    },
  );

  /** Текущий пользователь. */
  app.get('/api/auth/me', { preHandler: app.authenticate }, async (request) => {
    const { sub } = request.user as { sub: string };
    const payload = await getAuthPayload(sub);
    if (!payload) throw unauthorized();
    return payload;
  });

  /** Выход. */
  app.post('/api/auth/logout', async (_request, reply) => {
    reply.clearCookie(env.SESSION_COOKIE, { path: '/' });
    return { ok: true };
  });
}
