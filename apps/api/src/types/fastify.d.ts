import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserRole } from '@teenwork/shared';

declare module 'fastify' {
  interface FastifyInstance {
    /** PreHandler: требует валидную сессию. */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** PreHandler: требует сессию с одной из ролей. */
    requireRole: (
      ...roles: UserRole[]
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
