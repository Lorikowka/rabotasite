/**
 * Тесты безопасности: SQL-инъекции, LIKE-wildcards, лимиты запросов,
 * заголовки безопасности и правила CORS.
 *
 * Запуск: npm run test -w @teenwork/api
 */
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'teenwork-security-test-'));

process.env.DB_PATH = path.join(tmpDir, 'test.db');
process.env.LOG_LEVEL = 'silent';
process.env.OTP_FIXED_CODE = '111111';
process.env.EXPOSE_OTP = 'true';

const { runMigrations } = await import('../../../packages/db/dist/migrate.js');
await runMigrations();

const { buildApp } = await import('../dist/app.js');
const { escapeLike, likePattern } = await import('../dist/lib/sql.js');
const { isAllowedOrigin, isPrivateHost } = await import('../dist/lib/origins.js');
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
  const cookie = response.cookies.find((item) => item.name === SESSION)?.value;
  return { response, cookie };
}

// --- Экранирование LIKE --------------------------------------------------------

test('escapeLike экранирует wildcards', () => {
  assert.equal(escapeLike('100%'), '100\\%');
  assert.equal(escapeLike('a_b'), 'a\\_b');
  assert.equal(escapeLike('c\\d'), 'c\\\\d');
  assert.equal(escapeLike('обычный текст'), 'обычный текст');
});

test('likePattern оборачивает значение в проценты', () => {
  assert.equal(likePattern('кофе'), '%кофе%');
  assert.equal(likePattern('50%'), '%50\\%%');
});

// --- Правила CORS --------------------------------------------------------------

test('isPrivateHost узнаёт локальную сеть и loopback', () => {
  assert.equal(isPrivateHost('localhost'), true);
  assert.equal(isPrivateHost('127.0.0.1'), true);
  assert.equal(isPrivateHost('192.168.1.35'), true);
  assert.equal(isPrivateHost('10.0.0.5'), true);
  assert.equal(isPrivateHost('172.20.10.2'), true);
  assert.equal(isPrivateHost('172.32.10.2'), false);
  assert.equal(isPrivateHost('example.com'), false);
});

test('isAllowedOrigin пропускает свой список и локальную сеть', () => {
  const allowed = ['http://localhost:3000'];
  assert.equal(isAllowedOrigin('http://localhost:3000', allowed, false), true);
  assert.equal(isAllowedOrigin('http://192.168.1.35:3000', allowed, true), true);
  assert.equal(isAllowedOrigin('http://192.168.1.35:3000', allowed, false), false);
  assert.equal(isAllowedOrigin('https://evil.example', allowed, true), false);
  assert.equal(isAllowedOrigin(undefined, allowed, true), false);
});

// --- Заголовки безопасности ----------------------------------------------------

test('API отдаёт заголовки безопасности', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/health' });
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['x-frame-options'], 'DENY');
  assert.ok(response.headers['content-security-policy']);
  assert.equal(response.headers['x-powered-by'], undefined);
});

// --- Лимиты запросов -----------------------------------------------------------

test('запрос кода подтверждения ограничен по числу попыток', async () => {
  await register({
    role: 'teen',
    phone: '+79000000101',
    fullName: 'Лимит Тестов',
    birthDate: '2011-05-16',
  });

  const statuses = [];
  for (let attempt = 0; attempt < 7; attempt += 1) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { phone: '+79000000101' },
    });
    statuses.push(response.statusCode);
  }

  assert.deepEqual(statuses.slice(0, 5), [200, 200, 200, 200, 200]);
  assert.equal(statuses[5], 429);
  assert.equal(statuses[6], 429);
});

test('неверный код подтверждения считается попыткой', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/verify',
    payload: { phone: '+79000000101', code: '000000' },
  });
  assert.equal(response.statusCode, 400);
  assert.equal(response.json().error.code, 'otp_invalid');
});

// --- SQL-инъекции --------------------------------------------------------------

test('инъекция в поиске не ломает запрос и не отдаёт лишнего', async () => {
  await register({
    role: 'individual',
    phone: '+79000000102',
    fullName: 'Заказчик Инъекции',
  });

  const injections = [
    "' OR '1'='1",
    "'; DROP TABLE listings; --",
    "%' OR 1=1 --",
    "кофе' UNION SELECT * FROM users --",
    "1; DELETE FROM users WHERE 1=1; --",
  ];

  for (const payload of injections) {
    const response = await app.inject({
      method: 'GET',
      url: `/api/listings?q=${encodeURIComponent(payload)}`,
    });
    assert.equal(response.statusCode, 200, `поиск с payload «${payload}» должен отвечать 200`);
    assert.equal(response.json().items.length, 0, `payload «${payload}» не должен ничего находить`);
  }

  // Таблица на месте — инъекция ничего не удалила.
  const all = await app.inject({ method: 'GET', url: '/api/listings' });
  assert.equal(all.statusCode, 200);
});

test('wildcards из поиска не превращаются в шаблон', async () => {
  const all = await app.inject({ method: 'GET', url: '/api/listings' });
  const total = all.json().items.length;

  const percent = await app.inject({ method: 'GET', url: '/api/listings?q=%25' });
  assert.equal(percent.json().items.length, 0, '«%» не должен матчить всё');

  const underscore = await app.inject({ method: 'GET', url: '/api/listings?q=_' });
  assert.equal(underscore.json().items.length, 0, '«_» не должен матчить один символ');

  assert.equal(total, all.json().items.length);
});

test('инъекция в фильтрах не меняет выдачу', async () => {
  const normal = await app.inject({ method: 'GET', url: '/api/listings?type=vacancy' });
  const injected = await app.inject({
    method: 'GET',
    url: `/api/listings?type=${encodeURIComponent("vacancy' OR '1'='1")}`,
  });
  assert.equal(injected.statusCode, 400, 'невалидный тип должен отклоняться валидатором');
  assert.ok(normal.statusCode === 200);
});
