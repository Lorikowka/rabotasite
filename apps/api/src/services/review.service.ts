import { and, desc, eq, sql } from 'drizzle-orm';
import { applications, getDb, listings, newId, nowIso, reviews, teenProfiles, users } from '@teenwork/db';
import type { ReviewRow, UserRow } from '@teenwork/db';
import type { ReviewCreateInput, ReviewDTO } from '@teenwork/shared';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors.js';
import { toReviewDTO } from '../lib/dto.js';
import { usersByIds } from './user.service.js';

const db = getDb();

export async function createReview(
  input: ReviewCreateInput,
  actor: UserRow,
): Promise<ReviewDTO> {
  const application = (
    await db.select().from(applications).where(eq(applications.id, input.applicationId)).limit(1)
  )[0];
  if (!application) throw notFound('Отклик не найден');

  const listing = (
    await db.select().from(listings).where(eq(listings.id, application.listingId)).limit(1)
  )[0];
  if (!listing) throw notFound('Объявление не найдено');

  const isParticipant = application.teenId === actor.id || listing.employerId === actor.id;
  if (!isParticipant) throw forbidden('Оставлять отзыв может только участник отклика');

  if (application.status !== 'completed' && application.status !== 'accepted') {
    throw badRequest('Отзыв можно оставить после выполнения работы');
  }

  const existing = (
    await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.applicationId, input.applicationId), eq(reviews.fromUserId, actor.id)))
      .limit(1)
  )[0];
  if (existing) throw conflict('Вы уже оставили отзыв по этому отклику', 'review_exists');

  const toUserId = actor.id === application.teenId ? listing.employerId : application.teenId;

  await db.insert(reviews).values({
    id: newId(),
    applicationId: input.applicationId,
    fromUserId: actor.id,
    toUserId,
    score: input.score,
    badges: input.badges ?? [],
    comment: input.comment ?? null,
    createdAt: nowIso(),
  });

  await recalcUserRating(toUserId);

  const row = (
    await db.select().from(reviews).where(eq(reviews.applicationId, input.applicationId)).limit(1)
  )[0];
  if (!row) throw notFound('Отзыв не найден');

  const userMap = await usersByIds([row.fromUserId, row.toUserId]);
  const from = userMap.get(row.fromUserId);
  const to = userMap.get(row.toUserId);
  if (!from || !to) throw notFound('Пользователь не найден');

  return toReviewDTO(row, from, to);
}

/** Пересчёт среднего рейтинга пользователя. */
export async function recalcUserRating(userId: string): Promise<void> {
  const stats = await db
    .select({
      avg: sql<number>`coalesce(avg(${reviews.score}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(reviews)
    .where(eq(reviews.toUserId, userId));

  const average = Math.round(Number(stats[0]?.avg ?? 0) * 100) / 100;
  const count = Number(stats[0]?.count ?? 0);

  await db
    .update(users)
    .set({ rating: average, ratingCount: count })
    .where(eq(users.id, userId));
}

export async function listReviewsForUser(userId: string, limit = 50): Promise<ReviewDTO[]> {
  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.toUserId, userId))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);

  const users = await usersByIds(rows.flatMap((row) => [row.fromUserId, row.toUserId]));

  return rows.map((row) =>
    toReviewDTO(
      row,
      users.get(row.fromUserId)!,
      users.get(row.toUserId)!,
    ),
  );
}
