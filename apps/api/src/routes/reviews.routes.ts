import type { FastifyInstance } from 'fastify';
import { reviewCreateSchema } from '@teenwork/shared';
import { notFound } from '../lib/errors.js';
import { createReview, listReviewsForUser } from '../services/review.service.js';
import { getUserById } from '../services/user.service.js';

export async function reviewRoutes(app: FastifyInstance): Promise<void> {
  /** Оставить отзыв. */
  app.post('/api/reviews', { preHandler: app.authenticate }, async (request, reply) => {
    const input = reviewCreateSchema.parse(request.body);
    const { sub } = request.user as { sub: string };

    const user = await getUserById(sub);
    if (!user) throw notFound('Пользователь не найден');

    const review = await createReview(input, user);
    return reply.status(201).send(review);
  });

  /** Отзывы о пользователе. */
  app.get('/api/users/:id/reviews', async (request) => {
    const { id } = request.params as { id: string };
    const items = await listReviewsForUser(id);
    return { items, total: items.length };
  });
}
