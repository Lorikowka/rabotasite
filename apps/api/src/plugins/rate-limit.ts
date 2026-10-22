import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Сколько запросов разрешено за окно. */
  max: number;
  /** Длина окна в миллисекундах. */
  windowMs: number;
  /** Ключ группировки (по умолчанию — IP клиента). */
  key?: (request: FastifyRequest) => string;
  /** Текст ошибки. */
  message?: string;
  /** Имя ограничителя — разные лимитеры не должны делить один счётчик. */
  name?: string;
}

let limiterCounter = 0;

/** Чистит протухшие окна (чтобы память не росла). */
function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Ограничитель частоты запросов (in-memory, без внешних зависимостей).
 *
 * Защищает от перебора кода подтверждения и от флуда по IP.
 * Для нескольких инстансов API понадобится общее хранилище (Redis),
 * но для одной ноды на ноутбуке/локальной сети этого достаточно.
 */
export function rateLimit(options: RateLimitOptions) {
  const { max, windowMs, key, message = 'Слишком много запросов. Попробуйте позже' } = options;
  // У каждого ограничителя своё пространство счётчиков, иначе лимиты
  // разных маршрутов складывались бы в один счётчик.
  const namespace = options.name ?? `limiter-${(limiterCounter += 1)}`;

  return async function rateLimitHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const now = Date.now();
    const bucketKey = `${namespace}:${key ? key(request) : request.ip}`;

    let bucket = buckets.get(bucketKey);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(bucketKey, bucket);
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      reply.header('Retry-After', String(retryAfter));
      await reply.status(429).send({
        error: { code: 'rate_limited', message },
      });
    }
  };
}

/** Сбрасывает все счётчики (используется в тестах). */
export function resetRateLimits(): void {
  buckets.clear();
}

/** Периодическая уборка протухших окон. */
export function registerRateLimitCleanup(app: FastifyInstance): void {
  const timer = setInterval(() => prune(Date.now()), 60_000);
  timer.unref();
  app.addHook('onClose', async () => {
    clearInterval(timer);
  });
}
