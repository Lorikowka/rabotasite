import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb, notifications, newId, nowIso } from '@teenwork/db';
import type { NotificationDTO } from '@teenwork/shared';

const db = getDb();

export async function createNotification(
  userId: string,
  type: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await db.insert(notifications).values({
    id: newId(),
    userId,
    type,
    payload,
    readAt: null,
    createdAt: nowIso(),
  });
}

export async function listNotifications(userId: string, limit = 30): Promise<NotificationDTO[]> {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    payload: row.payload,
    readAt: row.readAt,
    createdAt: row.createdAt,
  }));
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: nowIso() })
    .where(and(eq(notifications.userId, userId), sql`${notifications.readAt} is null`));
}
