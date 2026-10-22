import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { getDb, listings, nowIso } from '@teenwork/db';
import {
  createListingSchema,
  listingQuerySchema,
  moderateListingSchema,
  updateListingSchema,
} from '@teenwork/shared';
import { forbidden, notFound } from '../lib/errors.js';
import { optionalSession } from '../plugins/auth.js';
import {
  buildCompliance,
  createListing,
  getListingById,
  listListings,
} from '../services/listing.service.js';
import { getEmployerProfile } from '../services/user.service.js';

const db = getDb();

export async function listingRoutes(app: FastifyInstance): Promise<void> {
  /** Лента объявлений с фильтрами. */
  app.get('/api/listings', async (request) => {
    const query = listingQuerySchema.parse(request.query);
    const session = await optionalSession(request);

    const items = await listListings(query, {
      viewer: session ? { id: session.sub, role: session.role } : null,
    });

    return { items, total: items.length, limit: query.limit, offset: query.offset ?? 0 };
  });

  /** Карточка объявления. */
  app.get('/api/listings/:id', async (request) => {
    const { id } = request.params as { id: string };
    const session = await optionalSession(request);

    const listing = await getListingById(id, session ? { id: session.sub, role: session.role } : null);
    if (!listing) throw notFound('Объявление не найдено');
    return listing;
  });

  /** Создание объявления с проверкой по ТК РФ. */
  app.post(
    '/api/listings',
    { preHandler: app.requireRole('business', 'individual', 'admin') },
    async (request, reply) => {
      const input = createListingSchema.parse(request.body);
      const { sub, role } = request.user as { sub: string; role: 'business' | 'individual' | 'admin' };

      const profile = await getEmployerProfile(sub);
      const result = await createListing(input, {
        userId: sub,
        role,
        verificationStatus: profile?.verificationStatus ?? 'none',
      });

      return reply.status(201).send(result);
    },
  );

  /** Обновление объявления (только автор). */
  app.patch(
    '/api/listings/:id',
    { preHandler: app.requireRole('business', 'individual', 'admin') },
    async (request) => {
      const { id } = request.params as { id: string };
      const { sub, role } = request.user as { sub: string; role: 'business' | 'individual' | 'admin' };

      const current = (await db.select().from(listings).where(eq(listings.id, id)).limit(1))[0];
      if (!current) throw notFound('Объявление не найдено');
      if (current.employerId !== sub && role !== 'admin') {
        throw forbidden('Можно редактировать только свои объявления');
      }

      const input = updateListingSchema.parse(request.body);
      const profile = await getEmployerProfile(sub);

      const merged = {
        type: input.type ?? current.type,
        categoryId: input.categoryId ?? current.categoryId,
        title: input.title ?? current.title,
        description: input.description ?? current.description,
        minAge: input.minAge ?? current.minAge,
        format: input.format ?? current.format,
        paymentAmount: input.paymentAmount ?? current.paymentAmount,
        paymentType: input.paymentType ?? current.paymentType,
        maxHoursPerDay: input.maxHoursPerDay ?? current.maxHoursPerDay,
        shiftStart: input.shiftStart ?? current.shiftStart,
        shiftEnd: input.shiftEnd ?? current.shiftEnd,
        worksDuringStudyTime: input.worksDuringStudyTime ?? current.worksDuringStudyTime,
        locationType: input.locationType ?? current.locationType,
        locationAddress: input.locationAddress ?? current.locationAddress,
        hasSeniorSupervisor: input.hasSeniorSupervisor ?? current.hasSeniorSupervisor,
        handlesCash: input.handlesCash ?? current.handlesCash,
      };

      const report = await buildCompliance({
        ...current,
        ...merged,
      } as typeof current);

      if (report.blocked) {
        return {
          error: {
            code: 'validation_failed',
            message: 'Изменения не прошли проверку безопасности',
            details: { violations: report.violations },
          },
        };
      }

      await db
        .update(listings)
        .set({ ...merged, updatedAt: nowIso() })
        .where(eq(listings.id, id));

      const updated = await getListingById(id, { id: sub, role });
      return updated;
    },
  );

  /** Закрытие объявления. */
  app.delete(
    '/api/listings/:id',
    { preHandler: app.requireRole('business', 'individual', 'admin') },
    async (request) => {
      const { id } = request.params as { id: string };
      const { sub, role } = request.user as { sub: string; role: 'business' | 'individual' | 'admin' };

      const current = (await db.select().from(listings).where(eq(listings.id, id)).limit(1))[0];
      if (!current) throw notFound('Объявление не найдено');
      if (current.employerId !== sub && role !== 'admin') {
        throw forbidden('Можно закрывать только свои объявления');
      }

      await db
        .update(listings)
        .set({ status: 'closed', updatedAt: nowIso() })
        .where(eq(listings.id, id));

      return { ok: true };
    },
  );

  /** Модерация объявления (админ). */
  app.post(
    '/api/admin/listings/:id/moderate',
    { preHandler: app.requireRole('admin') },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = moderateListingSchema.parse(request.body);

      const current = (await db.select().from(listings).where(eq(listings.id, id)).limit(1))[0];
      if (!current) throw notFound('Объявление не найдено');

      const status =
        body.action === 'approve' ? 'active' : body.action === 'block' ? 'blocked' : 'closed';

      await db
        .update(listings)
        .set({
          status,
          moderationReason: body.reason ?? null,
          publishedAt: status === 'active' ? (current.publishedAt ?? nowIso()) : current.publishedAt,
          updatedAt: nowIso(),
        })
        .where(eq(listings.id, id));

      return { ok: true, status };
    },
  );
}
