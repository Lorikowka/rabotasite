import type { FastifyInstance } from 'fastify';
import { and, count, desc, eq, like, or, sql } from 'drizzle-orm';
import { getDb, applications, listings, messages, reports, reviews, users } from '@teenwork/db';
import { listingQuerySchema } from '@teenwork/shared';
import { listListings } from '../services/listing.service.js';

const db = getDb();

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  /** Сводка по платформе. */
  app.get('/api/admin/stats', { preHandler: app.requireRole('admin') }, async () => {
    const [usersTotal, listingsTotal, moderation, applicationsTotal, reportsNew, flaggedMessages] =
      await Promise.all([
        db.select({ value: count() }).from(users),
        db.select({ value: count() }).from(listings),
        db.select({ value: count() }).from(listings).where(eq(listings.status, 'moderation')),
        db.select({ value: count() }).from(applications),
        db.select({ value: count() }).from(reports).where(eq(reports.status, 'new')),
        db.select({ value: count() }).from(messages).where(eq(messages.flagged, true)),
      ]);

    return {
      users: Number(usersTotal[0]?.value ?? 0),
      listings: Number(listingsTotal[0]?.value ?? 0),
      moderation: Number(moderation[0]?.value ?? 0),
      applications: Number(applicationsTotal[0]?.value ?? 0),
      newReports: Number(reportsNew[0]?.value ?? 0),
      flaggedMessages: Number(flaggedMessages[0]?.value ?? 0),
    };
  });

  /** Очередь модерации. */
  app.get('/api/admin/listings', { preHandler: app.requireRole('admin') }, async (request) => {
    const query = listingQuerySchema.parse(request.query);
    const status = (request.query as { status?: string }).status as
      | 'moderation'
      | 'active'
      | 'closed'
      | 'blocked'
      | undefined;

    const items = await listListings(query, {
      viewer: { id: 'admin', role: 'admin' },
      status,
    });

    return { items, total: items.length };
  });

  /** Поиск пользователей. */
  app.get('/api/admin/users', { preHandler: app.requireRole('admin') }, async (request) => {
    const { q } = request.query as { q?: string };

    const rows = q
      ? await db
          .select()
          .from(users)
          .where(
            or(
              like(sql`lower(${users.fullName})`, `%${q.toLowerCase()}%`),
              like(users.phone, `%${q}%`),
            )!,
          )
          .orderBy(desc(users.createdAt))
          .limit(50)
      : await db.select().from(users).orderBy(desc(users.createdAt)).limit(50);

    return { items: rows, total: rows.length };
  });

  /** Все отзывы (для контроля качества). */
  app.get('/api/admin/reviews', { preHandler: app.requireRole('admin') }, async () => {
    const rows = await db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(100);
    return { items: rows, total: rows.length };
  });

  /** Все сообщения (для расследования жалоб). */
  app.get('/api/admin/messages', { preHandler: app.requireRole('admin') }, async (request) => {
    const { applicationId, flagged } = request.query as {
      applicationId?: string;
      flagged?: string;
    };
    const onlyFlagged = flagged === 'true' || flagged === '1';

    const conditions = [
      applicationId ? eq(messages.applicationId, applicationId) : undefined,
      onlyFlagged ? eq(messages.flagged, true) : undefined,
    ].filter((condition): condition is NonNullable<typeof condition> => Boolean(condition));

    const rows = conditions.length
      ? await db
          .select()
          .from(messages)
          .where(and(...conditions))
          .orderBy(desc(messages.createdAt))
          .limit(100)
      : await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(100);

    return { items: rows, total: rows.length };
  });
}
