import type { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { messageCreateSchema } from '@teenwork/shared';
import { forbidden, notFound } from '../lib/errors.js';
import { chatHub } from '../services/chat-hub.js';
import { getApplicationForParticipant } from '../services/application.service.js';
import { listMessages, markMessagesRead, sendMessage } from '../services/chat.service.js';
import { getUserById } from '../services/user.service.js';

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  await app.register(websocket);

  /** История переписки. */
  app.get(
    '/api/applications/:id/messages',
    { preHandler: app.authenticate },
    async (request) => {
      const { id } = request.params as { id: string };
      const { sub } = request.user as { sub: string };

      const items = await listMessages(id, sub);
      return { items, total: items.length };
    },
  );

  /** Отправка сообщения. */
  app.post(
    '/api/applications/:id/messages',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { sub } = request.user as { sub: string };
      const { body } = messageCreateSchema.parse(request.body);

      const user = await getUserById(sub);
      if (!user) throw notFound('Пользователь не найден');

      const message = await sendMessage(id, user, body);
      chatHub.broadcast(id, { type: 'message', applicationId: id, payload: message });

      return reply.status(201).send(message);
    },
  );

  /** Отметить сообщения прочитанными. */
  app.post(
    '/api/applications/:id/read',
    { preHandler: app.authenticate },
    async (request) => {
      const { id } = request.params as { id: string };
      const { sub } = request.user as { sub: string };
      await markMessagesRead(id, sub);
      return { ok: true };
    },
  );

  /** WebSocket-чат. */
  app.get(
    '/api/chat/ws',
    { websocket: true, preHandler: app.authenticate },
    async (socket, request) => {
      const { sub } = request.user as { sub: string };
      const query = request.query as { applicationId?: string };
      const applicationId = query.applicationId;

      if (!applicationId) {
        socket.close(1008, 'applicationId обязателен');
        return;
      }

      try {
        await getApplicationForParticipant(applicationId, sub);
      } catch {
        socket.close(1008, 'Нет доступа к этому отклику');
        return;
      }

      chatHub.join(applicationId, socket);

      socket.send(
        JSON.stringify({
          type: 'ready',
          applicationId,
          payload: { online: chatHub.participants(applicationId) },
        }),
      );

      socket.on('message', async (raw: Buffer) => {
        try {
          const parsed = JSON.parse(raw.toString()) as { body?: string };
          if (!parsed.body) return;

          const user = await getUserById(sub);
          if (!user) return;

          const message = await sendMessage(applicationId, user, parsed.body);
          chatHub.broadcast(applicationId, {
            type: 'message',
            applicationId,
            payload: message,
          });
        } catch {
          socket.send(
            JSON.stringify({
              type: 'error',
              applicationId,
              payload: { message: 'Не удалось отправить сообщение' },
            }),
          );
        }
      });

      socket.on('close', () => {
        chatHub.leave(applicationId, socket);
      });
    },
  );
}
