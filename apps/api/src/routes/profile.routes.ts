import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { getDb, employerProfiles, nowIso, teenProfiles, users } from '@teenwork/db';
import { employerProfileUpdateSchema, teenProfileUpdateSchema } from '@teenwork/shared';
import { badRequest, notFound } from '../lib/errors.js';
import { toEmployerProfileDTO, toTeenProfileDTO, toUserDTO } from '../lib/dto.js';
import {
  getAuthPayload,
  getEmployerProfile,
  getTeenProfile,
  getUserById,
} from '../services/user.service.js';
import { listReviewsForUser } from '../services/review.service.js';

const db = getDb();

export async function profileRoutes(app: FastifyInstance): Promise<void> {
  /** Профиль текущего пользователя. */
  app.get('/api/profile', { preHandler: app.authenticate }, async (request) => {
    const { sub } = request.user as { sub: string };
    const payload = await getAuthPayload(sub);
    if (!payload) throw notFound('Пользователь не найден');
    return payload;
  });

  /** Обновление профиля. */
  app.patch('/api/profile', { preHandler: app.authenticate }, async (request) => {
    const { sub } = request.user as { sub: string };
    const user = await getUserById(sub);
    if (!user) throw notFound('Пользователь не найден');

    if (user.role === 'teen') {
      const input = teenProfileUpdateSchema.parse(request.body);
      const existing = await getTeenProfile(sub);
      if (!existing) throw notFound('Профиль не найден');

      await db
        .update(teenProfiles)
        .set({
          bio: input.bio ?? existing.bio,
          skills: input.skills ?? existing.skills,
          schoolType: input.schoolType ?? existing.schoolType,
          schoolShift: input.schoolShift ?? existing.schoolShift,
          availableHours: input.availableHours ?? existing.availableHours,
          radiusKm: input.radiusKm ?? existing.radiusKm,
          locationLat:
            input.locationLat === undefined ? existing.locationLat : input.locationLat,
          locationLng:
            input.locationLng === undefined ? existing.locationLng : input.locationLng,
          parentConsentUploaded: input.parentConsentUploaded ?? existing.parentConsentUploaded,
          isSelfEmployed: input.isSelfEmployed ?? existing.isSelfEmployed,
          updatedAt: nowIso(),
        })
        .where(eq(teenProfiles.userId, sub));
    } else if (user.role === 'business' || user.role === 'individual') {
      const input = employerProfileUpdateSchema.parse(request.body);
      const existing = await getEmployerProfile(sub);
      if (!existing) throw notFound('Профиль не найден');

      await db
        .update(employerProfiles)
        .set({
          companyName: input.companyName ?? existing.companyName,
          inn: input.inn ?? existing.inn,
          description: input.description ?? existing.description,
          website: input.website ?? existing.website,
          updatedAt: nowIso(),
        })
        .where(eq(employerProfiles.userId, sub));
    } else {
      throw badRequest('Профиль изменяется только для соискателей и заказчиков');
    }

    const payload = await getAuthPayload(sub);
    return payload;
  });

  /** Публичная карточка заказчика — «родительский виджет». */
  app.get('/api/employers/:id', async (request) => {
    const { id } = request.params as { id: string };
    const user = await getUserById(id);
    if (!user) throw notFound('Заказчик не найден');

    const profile = await getEmployerProfile(id);
    const reviews = await listReviewsForUser(id, 20);

    return {
      user: toUserDTO(user),
      employerProfile: profile ? toEmployerProfileDTO(profile) : null,
      reviews,
      safety: {
        isBusiness: user.role === 'business',
        isVerified: user.isVerified,
        verificationStatus: profile?.verificationStatus ?? 'none',
        inn: profile?.inn ?? null,
        rating: user.rating,
        ratingCount: user.ratingCount,
      },
    };
  });
}
