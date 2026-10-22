import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { getDb, newId, nowIso, reports } from '@teenwork/db';
import { reportCreateSchema } from '@teenwork/shared';
import { notFound } from '../lib/errors.js';
import { getUserById } from '../services/user.service.js';

const db = getDb();

export async function reportRoutes(app: FastifyInstance): Promise<void> {
  /** Жалоба на объявление, пользователя или сообщение. */
  app.post('/api/reports', { preHandler: app.authenticate }, async (request, reply) => {
    const input = reportCreateSchema.parse(request.body);
    const { sub } = request.user as { sub: string };

    const reporter = await getUserById(sub);
    if (!reporter) throw notFound('Пользователь не найден');

    const id = newId();
    await db.insert(reports).values({
      id,
      reporterId: sub,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      urgent: input.urgent,
      status: 'new',
      createdAt: nowIso(),
    });

    return reply.status(201).send({
      id,
      urgent: input.urgent,
      message: input.urgent
        ? 'Жалоба отправлена. Мы свяжемся с вами и вашими родителями в приоритетном порядке.'
        : 'Жалоба отправлена модераторам.',
    });
  });

  /** Список жалоб (админ). */
  app.get('/api/admin/reports', { preHandler: app.requireRole('admin') }, async (request) => {
    const { status } = request.query as { status?: string };

    const rows = status
      ? await db.select().from(reports).where(eq(reports.status, status as never))
      : await db.select().from(reports);

    return { items: rows, total: rows.length };
  });
}
