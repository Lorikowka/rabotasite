import type { FastifyInstance } from 'fastify';

/**
 * Базовые заголовки безопасности для API.
 * API отдаёт только JSON, поэтому политики загрубые и жёсткие.
 */
export async function registerSecurityHeaders(app: FastifyInstance): Promise<void> {
  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    reply.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
    reply.header('Cross-Origin-Resource-Policy', 'same-site');
    reply.removeHeader('X-Powered-By');
    return payload;
  });
}
