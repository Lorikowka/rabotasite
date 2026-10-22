import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { env, isDev } from './config/env.js';
import { registerErrorHandler } from './lib/error-handler.js';
import { registerAuth } from './plugins/auth.js';
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
    trustProxy: true,
    bodyLimit: 1_000_000,
  });

  registerErrorHandler(app);

  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((value) => value.trim()),
    credentials: true,
  });

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
