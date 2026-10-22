/**
 * Интеграционные тесты API: Fastify в памяти + временная база SQLite.
 *
 * Тесты не поднимают сервер на порту — используется app.inject(),
 * поэтому их можно гонять параллельно с dev-сервером.
 *
 * Запуск: npm run test -w @teenwork/api
 */
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'teenwork-api-test-'));

// Окружение настраиваем до импорта приложения: конфиг и БД читаются при загрузке модулей.
process.env.DB_PATH = path.join(tmpDir, 'test.db');
process.env.LOG_LEVEL = 'silent';
process.env.OTP_FIXED_CODE = '111111';
process.env.EXPOSE_OTP = 'true';

const { runMigrations } = await import('../../../packages/db/dist/migrate.js');
await runMigrations();

const { buildApp } = await import('../dist/app.js');
const app = await buildApp();

after(async () => {
  await app.close();
  try {
    rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // файл может остаться занят соединением — это не критично для тестов
  }
});

const SESSION = 'teenwork_session';

async function register(payload) {
  const response = await app.inject({ method: 'POST', url: '/api/auth/register', payload });
  if (response.statusCode !== 201) return { response, cookie: undefined };
  const body = response.json();
  const verify = await app.inject({
    method: 'POST',
    url: '/api/auth/verify',
    payload: { phone: payload.phone, code: body.devCode ?? '111111' },
  });
  const cookie = verify.cookies.find((item) => item.name === SESSION)?.value;
  return { response, cookie, verify };
}

function auth(cookie) {
  return { headers: { cookie: `${SESSION}=${cookie}` } };
}

// --- Здоровье и авторизация --------------------------------------------------

test('GET /api/health отвечает', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/health' });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().ok, true);
});

test('регистрация подростка требует подтверждения и после OTP выдаёт сессию', async () => {
  const { response, cookie } = await register({
    role: 'teen',
    phone: '+79000000001',
    fullName: 'Тест Тестов',
    birthDate: '2011-05-16',
  });
  assert.equal(response.statusCode, 201);
  assert.equal(response.json().needsVerification, true);
  assert.ok(cookie, 'сессионная кука должна быть выдана после OTP');
});

test('регистрация младше 14 лет отклоняется', async () => {
  const { response } = await register({
    role: 'teen',
    phone: '+79000000002',
    fullName: 'Слишком Молодой',
    birthDate: '2016-01-01',
  });
  assert.equal(response.statusCode, 400);
  assert.equal(response.json().error.code, 'too_young');
});

test('дублирующийся телефон отклоняется', async () => {
  const { response } = await register({
    role: 'teen',
    phone: '+79000000001',
    fullName: 'Второй Тест',
    birthDate: '2010-05-16',
  });
  assert.equal(response.statusCode, 409);
  assert.equal(response.json().error.code, 'phone_taken');
});

test('без сессии /api/auth/me недоступен', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/auth/me' });
  assert.equal(response.statusCode, 401);
});

test('с сессией /api/auth/me возвращает профиль', async () => {
  const { cookie } = await register({
    role: 'teen',
    phone: '+79000000003',
    fullName: 'Аня Тестова',
    birthDate: '2011-05-16',
  });
  const response = await app.inject({ method: 'GET', url: '/api/auth/me', ...auth(cookie) });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().user.fullName, 'Аня Тестова');
  assert.equal(response.json().teenProfile.ageCohort, '14_15');
});

// --- Объявления --------------------------------------------------------------

test('подросток не может создавать объявления', async () => {
  const { cookie } = await register({
    role: 'teen',
    phone: '+79000000004',
    fullName: 'Подросток Тестов',
    birthDate: '2011-05-16',
  });
  const response = await app.inject({
    method: 'POST',
    url: '/api/listings',
    ...auth(cookie),
    payload: {
      type: 'vacancy',
      categoryId: 'cafe',
      title: 'Помощник в кофейне',
      description: 'Помогать на кухне и в зале, обучение на месте.',
      minAge: 16,
      format: 'offline',
      paymentAmount: 200,
      paymentType: 'per_hour',
      maxHoursPerDay: 4,
      shiftStart: '10:00',
      shiftEnd: '16:00',
      locationType: 'workplace',
      locationAddress: 'ул. Тверская, 12',
    },
  });
  assert.equal(response.statusCode, 403);
  assert.equal(response.json().error.code, 'role_required');
});

test('нарушение ТК РФ блокирует публикацию', async () => {
  const { cookie } = await register({
    role: 'individual',
    phone: '+79000000005',
    fullName: 'Заказчик Тестов',
  });
  const response = await app.inject({
    method: 'POST',
    url: '/api/listings',
    ...auth(cookie),
    payload: {
      type: 'gig',
      categoryId: 'promo',
      title: 'Ночная раздача листовок',
      description: 'Раздаём листовки ночью, оплата наличными сразу.',
      minAge: 16,
      format: 'offline',
      paymentAmount: 900,
      paymentType: 'fixed_task',
      maxHoursPerDay: 3,
      shiftStart: '22:00',
      shiftEnd: '02:00',
      locationType: 'public_place',
      locationAddress: 'парк у фонтана',
    },
  });
  assert.equal(response.statusCode, 422);
  const violations = response.json().error.details.violations.map((v) => v.code);
  assert.ok(violations.includes('night_shift_blocked'));
});

test('корректное задание физлица публикуется сразу', async () => {
  const { cookie } = await register({
    role: 'individual',
    phone: '+79000000006',
    fullName: 'Заказчик Нормальный',
  });
  const response = await app.inject({
    method: 'POST',
    url: '/api/listings',
    ...auth(cookie),
    payload: {
      type: 'gig',
      categoryId: 'promo',
      title: 'Помочь раздать листовки',
      description: 'Нужна помощь с раздачей листовок в парке. Работа 2 часа, материалы выдаём.',
      minAge: 14,
      format: 'offline',
      paymentAmount: 800,
      paymentType: 'fixed_task',
      maxHoursPerDay: 2,
      shiftStart: '12:00',
      shiftEnd: '14:00',
      locationType: 'public_place',
      locationAddress: 'парк у фонтана, вход со стороны улицы',
    },
  });
  assert.equal(response.statusCode, 201);
  assert.equal(response.json().listing.status, 'active');
  assert.equal(response.json().listing.employer.companyName, null);
});

test('в ленте нет объявлений в модерации', async () => {
  const { cookie } = await register({
    role: 'business',
    phone: '+79000000007',
    fullName: 'Компания Тестовая',
    companyName: 'ООО Тест',
    inn: '7701234567',
  });
  const created = await app.inject({
    method: 'POST',
    url: '/api/listings',
    ...auth(cookie),
    payload: {
      type: 'vacancy',
      categoryId: 'cafe',
      title: 'Помощник в кофейне',
      description: 'Помогать на кухне и в зале, обучение на месте.',
      minAge: 16,
      format: 'offline',
      paymentAmount: 200,
      paymentType: 'per_hour',
      maxHoursPerDay: 4,
      shiftStart: '10:00',
      shiftEnd: '14:00',
      locationType: 'workplace',
      locationAddress: 'ул. Тверская, 12',
    },
  });
  assert.equal(created.statusCode, 201);
  const listingId = created.json().listing.id;
  assert.equal(created.json().listing.status, 'moderation');

  // Автор видит своё объявление.
  const own = await app.inject({ method: 'GET', url: `/api/listings/${listingId}`, ...auth(cookie) });
  assert.equal(own.statusCode, 200);

  // Остальные — нет.
  const foreign = await app.inject({ method: 'GET', url: `/api/listings/${listingId}` });
  assert.equal(foreign.statusCode, 404);
});

// --- Отклики и чат -----------------------------------------------------------

test('отклик, повторный отклик и антифрод в чате', async () => {
  const employer = await register({
    role: 'individual',
    phone: '+79000000008',
    fullName: 'Заказчик Отклика',
  });
  const listing = await app.inject({
    method: 'POST',
    url: '/api/listings',
    ...auth(employer.cookie),
    payload: {
      type: 'gig',
      categoryId: 'promo',
      title: 'Помочь раздать листовки',
      description: 'Нужна помощь с раздачей листовок в парке. Работа 2 часа, материалы выдаём.',
      minAge: 14,
      format: 'offline',
      paymentAmount: 800,
      paymentType: 'fixed_task',
      maxHoursPerDay: 2,
      shiftStart: '12:00',
      shiftEnd: '14:00',
      locationType: 'public_place',
      locationAddress: 'парк у фонтана, вход со стороны улицы',
    },
  });
  const listingId = listing.json().listing.id;

  const teen = await register({
    role: 'teen',
    phone: '+79000000009',
    fullName: 'Подросток Отклика',
    birthDate: '2011-05-16',
  });

  const applied = await app.inject({
    method: 'POST',
    url: '/api/applications',
    ...auth(teen.cookie),
    payload: { listingId, message: 'Готов помочь' },
  });
  assert.equal(applied.statusCode, 201);
  const applicationId = applied.json().id;

  const again = await app.inject({
    method: 'POST',
    url: '/api/applications',
    ...auth(teen.cookie),
    payload: { listingId, message: 'Готов помочь' },
  });
  assert.equal(again.statusCode, 409);

  // В объявлении нет контактов заказчика.
  const feed = await app.inject({ method: 'GET', url: `/api/listings/${listingId}` });
  assert.equal(feed.json().employer.phone, undefined);

  // Сообщение с внешним контактом помечается, но отправляется.
  const message = await app.inject({
    method: 'POST',
    url: `/api/applications/${applicationId}/messages`,
    ...auth(teen.cookie),
    payload: { body: 'Пишите мне на +7 900 123-45-67' },
  });
  assert.equal(message.statusCode, 201);
  assert.ok(message.json().warnings.length > 0);
  assert.equal(message.json().flagged, true);
});

test('работодатель принимает отклик, а подросток оставляет отзыв', async () => {
  const employer = await register({
    role: 'individual',
    phone: '+79000000010',
    fullName: 'Заказчик Отзыва',
  });
  const listing = await app.inject({
    method: 'POST',
    url: '/api/listings',
    ...auth(employer.cookie),
    payload: {
      type: 'gig',
      categoryId: 'promo',
      title: 'Помочь раздать листовки',
      description: 'Нужна помощь с раздачей листовок в парке. Работа 2 часа, материалы выдаём.',
      minAge: 14,
      format: 'offline',
      paymentAmount: 800,
      paymentType: 'fixed_task',
      maxHoursPerDay: 2,
      shiftStart: '12:00',
      shiftEnd: '14:00',
      locationType: 'public_place',
      locationAddress: 'парк у фонтана, вход со стороны улицы',
    },
  });
  const listingId = listing.json().listing.id;

  const teen = await register({
    role: 'teen',
    phone: '+79000000011',
    fullName: 'Подросток Отзыва',
    birthDate: '2011-05-16',
  });

  const applied = await app.inject({
    method: 'POST',
    url: '/api/applications',
    ...auth(teen.cookie),
    payload: { listingId },
  });
  const applicationId = applied.json().id;

  const accepted = await app.inject({
    method: 'PATCH',
    url: `/api/applications/${applicationId}`,
    ...auth(employer.cookie),
    payload: { status: 'accepted' },
  });
  assert.equal(accepted.statusCode, 200);
  assert.equal(accepted.json().status, 'accepted');

  const review = await app.inject({
    method: 'POST',
    url: '/api/reviews',
    ...auth(teen.cookie),
    payload: { applicationId, score: 5, comment: 'Отлично отработал' },
  });
  assert.equal(review.statusCode, 201);

  const duplicate = await app.inject({
    method: 'POST',
    url: '/api/reviews',
    ...auth(teen.cookie),
    payload: { applicationId, score: 4 },
  });
  assert.equal(duplicate.statusCode, 409);

  const reviews = await app.inject({
    method: 'GET',
    url: `/api/users/${review.json().to.id}/reviews`,
  });
  assert.equal(reviews.statusCode, 200);
  assert.ok(reviews.json().items.length >= 1);
});
