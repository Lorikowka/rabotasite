import type { FastifyInstance } from 'fastify';
import { and, count, desc, eq } from 'drizzle-orm';
import { getDb, newId, notifications, nowIso, users } from '@teenwork/db';

const db = getDb();

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  /** Получить уведомления пользователя */
  app.get('/api/notifications', { preHandler: app.authenticate }, async (request) => {
    const { sub } = request.user as { sub: string };
    
    const items = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, sub))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    const unreadCount = (
      await db
        .select({ value: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, sub), eq(notifications.readAt, null as any)))
    )[0];

    return { items, unreadCount: Number(unreadCount?.value ?? 0) };
  });

  /** Отметить уведомление как прочитанное */
  app.patch('/api/notifications/:id/read', { preHandler: app.authenticate }, async (request) => {
    const { sub } = request.user as { sub: string };
    const { id } = request.params as { id: string };

    await db
      .update(notifications)
      .set({ readAt: nowIso() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, sub)));

    return { ok: true };
  });

  /** Отметить все уведомления как прочитанные */
  app.post('/api/notifications/read-all', { preHandler: app.authenticate }, async (request) => {
    const { sub } = request.user as { sub: string };

    await db.update(notifications).set({ readAt: nowIso() }).where(eq(notifications.userId, sub));

    return { ok: true };
  });
}

/** Создать уведомление для пользователя */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body?: string,
  link?: string,
  payload?: Record<string, unknown>,
) {
  await db.insert(notifications).values({
    id: newId(),
    userId,
    type,
    payload: payload ?? { title, body, link },
    readAt: null,
    createdAt: nowIso(),
  });
}

/** Создать уведомления для всех админов */
export async function notifyAllAdmins(
  type: string,
  title: string,
  body?: string,
  link?: string,
  payload?: Record<string, unknown>,
) {
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin'));
  for (const admin of admins) {
    await createNotification(admin.id, type, title, body, link, payload);
  }
}
