import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { allowedOrigins, allowPrivateOrigins, env, isDev } from './config/env.js';
import { registerErrorHandler } from './lib/error-handler.js';
import { isAllowedOrigin } from './lib/origins.js';
import { registerAuth } from './plugins/auth.js';
import { rateLimit, registerRateLimitCleanup } from './plugins/rate-limit.js';
import { registerSecurityHeaders } from './plugins/security-headers.js';
import { adminRoutes } from './routes/admin.routes.js';
import { applicationRoutes } from './routes/applications.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { chatRoutes } from './routes/chat.routes.js';
import { documentRoutes } from './routes/documents.routes.js';
import { listingRoutes } from './routes/listings.routes.js';
import { profileRoutes } from './routes/profile.routes.js';
import { reportRoutes } from './routes/reports.routes.js';
import { reviewRoutes } from './routes/reviews.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: isDev
      ? {
          level: env.LOG_LEVEL,
          transport: {
            target: 'pino-pretty',
            options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname,reqId' },
          },
        }
      : { level: env.LOG_LEVEL },
    // Доверяем только локальному прокси (Next.js) — иначе X-Forwarded-For
    // можно подделать и обойти лимиты по IP.
    trustProxy: env.TRUST_PROXY,
    bodyLimit: 1_000_000,
  });

  registerErrorHandler(app);
  await registerSecurityHeaders(app);
  registerRateLimitCleanup(app);

  await app.register(cors, {
    // Разрешаем и origin из локальной сети, чтобы сайт открывался
    // с телефона/планшета в одной сети с ноутбуком.
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      return callback(null, isAllowedOrigin(origin, allowedOrigins, allowPrivateOrigins));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Общий лимит на весь API: защита от флуда и перебора.
  app.addHook(
    'onRequest',
    rateLimit({
      name: 'global',
      max: 600,
      windowMs: 60_000,
      message: 'Слишком много запросов. Попробуйте через минуту',
    }),
  );

  await registerAuth(app);

  app.get('/api/health', async () => ({
    ok: true,
    service: 'teenwork-api',
    env: env.NODE_ENV,
    time: new Date().toISOString(),
  }));

  await authRoutes(app);
  await profileRoutes(app);
  await listingRoutes(app);
  await applicationRoutes(app);
  await reviewRoutes(app);
  await chatRoutes(app);
  await documentRoutes(app);
  await reportRoutes(app);
  await adminRoutes(app);

  return app;
}
