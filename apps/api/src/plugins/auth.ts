import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import type { UserRole } from '@teenwork/shared';
import { env } from '../config/env.js';
import { forbidden, unauthorized } from '../lib/errors.js';

export interface SessionPayload {
  sub: string;
  role: UserRole;
}

export function readSession(request: FastifyRequest): SessionPayload {
  const payload = request.user as SessionPayload | undefined;
  if (!payload?.sub) throw unauthorized();
  return payload;
}

/** Мягкая проверка сессии: возвращает null, если пользователь не авторизован. */
export async function optionalSession(request: FastifyRequest): Promise<SessionPayload | null> {
  try {
    await request.jwtVerify();
    const payload = request.user as SessionPayload | undefined;
    return payload?.sub ? payload : null;
  } catch {
    return null;
  }
}

export async function registerAuth(app: FastifyInstance): Promise<void> {
  await app.register(cookie);
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_TTL },
    // Сессия хранится в httpOnly-куке — jwtVerify должен её читать.
    cookie: { cookieName: env.SESSION_COOKIE, signed: false },
  });

  /** Требует действующую сессию. */
  app.decorate('authenticate', async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch {
      throw unauthorized('Сессия истекла, войдите заново', 'session_expired');
    }
  });

  /** Требует сессию с одной из указанных ролей. */
  app.decorate(
    'requireRole',
    (...roles: UserRole[]) =>
      async function requireRole(request: FastifyRequest, reply: FastifyReply) {
        try {
          await request.jwtVerify();
        } catch {
          throw unauthorized('Сессия истекла, войдите заново', 'session_expired');
        }
        const payload = request.user as SessionPayload;
        if (!roles.includes(payload.role)) {
          throw forbidden('Недостаточно прав для этого действия', 'role_required');
        }
      },
  );
}

/** Выставляет httpOnly-куку с сессией. */
export async function issueSession(
  app: FastifyInstance,
  reply: FastifyReply,
  payload: SessionPayload,
): Promise<string> {
  const token = app.jwt.sign(payload);
  reply.setCookie(env.SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return token;
}

export async function clearSession(app: FastifyInstance, reply: FastifyReply): Promise<void> {
  reply.clearCookie(env.SESSION_COOKIE, { path: '/' });
}
