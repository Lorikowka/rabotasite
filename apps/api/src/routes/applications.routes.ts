import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { getDb, listings } from '@teenwork/db';
import { applicationCreateSchema, applicationUpdateSchema } from '@teenwork/shared';
import { forbidden, notFound } from '../lib/errors.js';
import {
  applyToListing,
  getApplicationDTO,
  listApplicationsForUser,
  updateApplicationStatus,
} from '../services/application.service.js';
import { getUserById } from '../services/user.service.js';

const db = getDb();

export async function applicationRoutes(app: FastifyInstance): Promise<void> {
  /** Отклик на объявление. */
  app.post('/api/applications', { preHandler: app.requireRole('teen') }, async (request, reply) => {
    const input = applicationCreateSchema.parse(request.body);
    const { sub } = request.user as { sub: string };

    const teen = await getUserById(sub);
    if (!teen) throw notFound('Пользователь не найден');

    const application = await applyToListing(input.listingId, teen, input.message);
    return reply.status(201).send(application);
  });

  /** Мои отклики (для подростка и для работодателя). */
  app.get('/api/applications', { preHandler: app.authenticate }, async (request) => {
    const { sub } = request.user as { sub: string };
    const user = await getUserById(sub);
    if (!user) throw notFound('Пользователь не найден');

    const items = await listApplicationsForUser(user);
    return { items, total: items.length };
  });

  /** Отклики по конкретному объявлению (только его автор). */
  app.get('/api/listings/:id/applications', { preHandler: app.authenticate }, async (request) => {
    const { id } = request.params as { id: string };
    const { sub, role } = request.user as { sub: string; role: string };

    const listing = (await db.select().from(listings).where(eq(listings.id, id)).limit(1))[0];
    if (!listing) throw notFound('Объявление не найдено');
    if (listing.employerId !== sub && role !== 'admin') {
      throw forbidden('Отклики по объявлению доступны только его автору');
    }

    const user = await getUserById(sub);
    if (!user) throw notFound('Пользователь не найден');

    const all = await listApplicationsForUser(user);
    return { items: all.filter((item) => item.listingId === id), total: all.length };
  });

  /** Карточка отклика. */
  app.get('/api/applications/:id', { preHandler: app.authenticate }, async (request) => {
    const { id } = request.params as { id: string };
    const { sub } = request.user as { sub: string };

    const application = await getApplicationDTO(id);
    if (!application) throw notFound('Отклик не найден');

    const user = await getUserById(sub);
    if (!user) throw notFound('Пользователь не найден');
    const isParticipant =
      application.teen.id === sub || application.employer.id === sub;
    if (!isParticipant) throw forbidden('Отклик вам не доступен');

    return application;
  });

  /** Смена статуса отклика. */
  app.patch('/api/applications/:id', { preHandler: app.authenticate }, async (request) => {
    const { id } = request.params as { id: string };
    const { sub } = request.user as { sub: string };
    const { status } = applicationUpdateSchema.parse(request.body);

    const user = await getUserById(sub);
    if (!user) throw notFound('Пользователь не найден');

    const updated = await updateApplicationStatus(id, status, user);
    return updated;
  });
}
