/**
 * Сквозной smoke-тест API: регистрация, логин, лента, отклик, чат,
 * проверка ТК РФ при создании объявления и генерация PDF-документов.
 *
 * Запуск: node scripts/smoke.mjs
 */
const BASE = process.env.API_URL ?? 'http://localhost:4000';

let passed = 0;
let failed = 0;

function ok(name, condition, extra = '') {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    console.log(`  ✗ ${name}${extra ? ` — ${extra}` : ''}`);
  }
}

/** Простейшая корзина печенек: хранит одну сессионную куку. */
function makeClient() {
  let cookie = '';
  return {
    get cookie() {
      return cookie;
    },
    async request(path, options = {}) {
      const headers = { 'Content-Type': 'application/json', ...(options.headers ?? {}) };
      if (cookie) headers.Cookie = cookie;

      const response = await fetch(`${BASE}${path}`, { ...options, headers, redirect: 'manual' });

      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';')[0];

      const text = await response.text();
      let body = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      return { status: response.status, body, raw: text };
    },
  };
}

/**
 * Подключается к WebSocket-чату и ждёт сообщения.
 * Служебный кадр `ready` пропускается — нас интересуют только сообщения.
 */
function waitForSocketMessage(cookie, applicationId) {
  const queue = [];
  const waiters = [];

  const socket = new WebSocket(
    `${BASE.replace(/^http/, 'ws')}/api/chat/ws?applicationId=${applicationId}`,
    { headers: { Cookie: cookie } },
  );

  const opened = new Promise((resolve) => {
    socket.addEventListener('open', () => resolve(true));
    socket.addEventListener('error', () => resolve(false));
  });

  socket.addEventListener('message', (event) => {
    const data = JSON.parse(String(event.data));
    if (data.type === 'ready') return;
    if (waiters.length > 0) waiters.shift()(data);
    else queue.push(data);
  });

  return {
    opened,
    send(body) {
      socket.send(JSON.stringify({ body }));
    },
    next(timeoutMs = 5000) {
      if (queue.length > 0) return Promise.resolve(queue.shift());
      return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), timeoutMs);
        waiters.push((data) => {
          clearTimeout(timer);
          resolve(data);
        });
      });
    },
    close() {
      socket.close();
    },
  };
}

async function main() {
  console.log(`Smoke-тест API: ${BASE}\n`);

  // --- Здоровье ---
  console.log('Здоровье');
  const health = await fetch(`${BASE}/api/health`).then((r) => r.json());
  ok('GET /api/health', health.ok === true);

  // --- Регистрация подростка ---
  console.log('\nПодросток');
  const teen = makeClient();
  const phone = `+79${String(Date.now()).slice(-9)}`;
  const registration = await teen.request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      role: 'teen',
      phone,
      fullName: 'Тест Тестов',
      birthDate: '2010-05-10',
    }),
  });
  ok('POST /api/auth/register (teen)', registration.status === 201, `status=${registration.status}`);
  ok('сессия выдана', Boolean(teen.cookie));

  const tooYoung = await makeClient().request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      role: 'teen',
      phone: `+79${String(Date.now() + 1).slice(-9)}`,
      fullName: 'Маленький',
      birthDate: '2018-05-10',
    }),
  });
  ok('регистрация младше 14 лет отклонена', tooYoung.status === 400);

  // --- Логин по OTP ---
  const login = await makeClient().request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
  ok('POST /api/auth/login', login.status === 200);
  ok('код подтверждения выдан', Boolean(login.body?.devCode), JSON.stringify(login.body));

  const verify = await teen.request('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code: login.body?.devCode ?? '111111' }),
  });
  ok('POST /api/auth/verify', verify.status === 200 && verify.body?.user?.phone === phone);

  const me = await teen.request('/api/auth/me');
  ok('GET /api/auth/me', me.status === 200 && me.body?.user?.role === 'teen');

  // --- Лента ---
  console.log('\nЛента');
  const feed = await fetch(`${BASE}/api/listings?type=gig&limit=5`).then((r) => r.json());
  ok('GET /api/listings', Array.isArray(feed.items));
  ok('в ленте есть объявления', feed.items.length > 0, `items=${feed.items.length}`);

  const filtered = await fetch(`${BASE}/api/listings?type=vacancy&categoryId=cafe`).then((r) =>
    r.json(),
  );
  ok(
    'фильтр по категории',
    filtered.items.every((item) => item.categoryId === 'cafe'),
  );

  // --- Отклик ---
  console.log('\nОтклик');
  const target = feed.items.find((item) => item.minAge === 14);
  if (!target) {
    console.log('  ! нет объявления для отклика — пропускаю');
  } else {
    const application = await teen.request('/api/applications', {
      method: 'POST',
      body: JSON.stringify({ listingId: target.id, message: 'Хочу попробовать' }),
    });
    ok('POST /api/applications', application.status === 201, `status=${application.status}`);
    const applicationId = application.body?.id;

    const duplicate = await teen.request('/api/applications', {
      method: 'POST',
      body: JSON.stringify({ listingId: target.id }),
    });
    ok('повторный отклик запрещён', duplicate.status === 409, `status=${duplicate.status}`);

    const list = await teen.request('/api/applications');
    ok('GET /api/applications', list.status === 200 && list.body.items.length >= 1);

    // --- Чат ---
    const message = await teen.request(`/api/applications/${applicationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body: 'Здравствуйте! Когда можно выйти на смену?' }),
    });
    ok('POST /api/applications/:id/messages', message.status === 201);

    const scam = await teen.request(`/api/applications/${applicationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body: 'Пишите мне в телеграм @zvonok123' }),
    });
    ok(
      'антифрод помечает внешние контакты',
      scam.status === 201 && (scam.body?.warnings?.length ?? 0) > 0,
      JSON.stringify(scam.body?.warnings),
    );

    const history = await teen.request(`/api/applications/${applicationId}/messages`);
    ok('GET /api/applications/:id/messages', history.status === 200 && history.body.items.length >= 2);

    // --- PDF согласия родителей ---
    const pdf = await teen.request(`/api/documents/parent-consent?applicationId=${applicationId}`);
    ok(
      'GET /api/documents/parent-consent отдаёт PDF',
      pdf.status === 200 && String(pdf.raw).startsWith('%PDF'),
      `status=${pdf.status}`,
    );
  }

  // --- Работодатель: публикация с проверкой ТК РФ ---
  console.log('\nРаботодатель');
  const employer = makeClient();
  const employerRegistration = await employer.request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      role: 'business',
      phone: `+79${String(Date.now() + 3).slice(-9)}`,
      fullName: 'Иван Работодатель',
      companyName: 'ООО Ромашка',
      inn: '7701234567',
    }),
  });
  ok(
    'POST /api/auth/register (business)',
    employerRegistration.status === 201,
    `status=${employerRegistration.status}`,
  );
  const badListing = await employer.request('/api/listings', {
    method: 'POST',
    body: JSON.stringify({
      type: 'vacancy',
      categoryId: 'production',
      title: 'Ночная смена на заводе',
      description: 'Работа в ночную смену на производстве, 18+ лет только.',
      minAge: 14,
      format: 'offline',
      paymentAmount: 50000,
      paymentType: 'per_month',
      maxHoursPerDay: 10,
      shiftStart: '22:00',
      shiftEnd: '06:00',
      locationAddress: 'Завод',
    }),
  });
  ok(
    'объявление с нарушениями ТК РФ заблокировано',
    badListing.status === 422,
    `status=${badListing.status}`,
  );

  const goodListing = await employer.request('/api/listings', {
    method: 'POST',
    body: JSON.stringify({
      type: 'gig',
      categoryId: 'promo',
      title: 'Раздать листовки у метро',
      description:
        'Раздаём листовки кафе у метро. Работа 3 часа, оплата сразу после смены, материалы выдаём.',
      minAge: 14,
      format: 'offline',
      paymentAmount: 900,
      paymentType: 'fixed_task',
      maxHoursPerDay: 3,
      shiftStart: '16:00',
      shiftEnd: '19:00',
      worksDuringStudyTime: true,
      locationType: 'public_place',
      locationAddress: 'выход из метро, у фонтана',
    }),
  });
  ok(
    'корректное объявление создаётся',
    goodListing.status === 201,
    `status=${goodListing.status} ${JSON.stringify(goodListing.body?.error ?? '')}`,
  );
  ok(
    'бизнес-объявление уходит на модерацию',
    goodListing.body?.listing?.status === 'moderation',
    `status=${goodListing.body?.listing?.status}`,
  );

  const listingId = goodListing.body?.listing?.id;
  if (listingId) {
    const own = await employer.request(`/api/listings/${listingId}`);
    ok('своё объявление видно с отчётом проверки', own.status === 200);
    const foreign = await teen.request(`/api/listings/${listingId}`);
    ok('чужое объявление в модерации скрыто', foreign.status === 404, `status=${foreign.status}`);
  }

  // --- Профиль ---
  console.log('\nПрофиль');
  const profileUpdate = await teen.request('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify({ bio: 'Свободен после 17:00', skills: ['capcut', 'promo'] }),
  });
  ok('PATCH /api/profile', profileUpdate.status === 200);
  ok('навыки сохранены', profileUpdate.body?.teenProfile?.skills?.includes('capcut') === true);

  // --- Жалоба ---
  const report = await teen.request('/api/reports', {
    method: 'POST',
    body: JSON.stringify({
      targetType: 'listing',
      targetId: '11111111-2222-4333-8444-555555555555',
      reason: 'Похоже на мошенничество',
      urgent: true,
    }),
  });
  ok('POST /api/reports', report.status === 201, `status=${report.status}`);

  // --- Полный цикл: частный заказчик → отклик → чат по WebSocket → отзыв ---
  console.log('\nПолный цикл (заказчик → подросток → чат → отзыв)');
  const individual = makeClient();
  const individualRegistration = await individual.request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      role: 'individual',
      phone: `+79${String(Date.now() + 7).slice(-9)}`,
      fullName: 'Мария ЧастныйЗаказчик',
    }),
  });
  ok(
    'POST /api/auth/register (individual)',
    individualRegistration.status === 201,
    `status=${individualRegistration.status}`,
  );

  const gig = await individual.request('/api/listings', {
    method: 'POST',
    body: JSON.stringify({
      type: 'gig',
      categoryId: 'promo',
      title: 'Помочь раздать листовки',
      description:
        'Нужна помощь с раздачей листовок в парке. Работа 2 часа, оплата наличными сразу, материалы выдаём.',
      minAge: 14,
      format: 'offline',
      paymentAmount: 700,
      paymentType: 'fixed_task',
      maxHoursPerDay: 2,
      locationType: 'public_place',
      locationAddress: 'парк у фонтана, вход со стороны улицы',
    }),
  });
  ok(
    'объявление физлица публикуется сразу',
    gig.status === 201 && gig.body?.listing?.status === 'active',
    `status=${gig.status} listing=${gig.body?.listing?.status}`,
  );

  const gigId = gig.body?.listing?.id;
  if (!gigId) {
    console.log('  ! объявление не создано — пропускаю цикл');
  } else {
    const apply = await teen.request('/api/applications', {
      method: 'POST',
      body: JSON.stringify({ listingId: gigId, message: 'Готов помочь' }),
    });
    ok('подросток откликается на объявление физлица', apply.status === 201, `status=${apply.status}`);
    const applicationId = apply.body?.id;

    const accept = await individual.request(`/api/applications/${applicationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'accepted' }),
    });
    ok(
      'заказчик принимает отклик',
      accept.status === 200 && accept.body?.status === 'accepted',
      `status=${accept.status}`,
    );

    // WebSocket: подросток слушает чат, заказчик пишет через REST.
    const socket = waitForSocketMessage(teen.cookie, applicationId);
    ok('WebSocket-чат принимает соединение', await socket.opened);

    await individual.request(`/api/applications/${applicationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body: 'Приходи в 16:00 к фонтану' }),
    });

    const message = await socket.next();
    ok(
      'сообщение заказчика доходит по WebSocket',
      Boolean(message) && message.type === 'message',
      JSON.stringify(message),
    );

    // Отправка прямо через сокет: сервер сохраняет и рассылает сообщение.
    socket.send('Здравствуйте, я подойду');
    const echoed = await socket.next();
    ok(
      'сообщение из WebSocket сохраняется и рассылается',
      Boolean(echoed) && echoed.type === 'message' && echoed.payload?.body === 'Здравствуйте, я подойду',
      JSON.stringify(echoed),
    );
    socket.close();

    const chatHistory = await teen.request(`/api/applications/${applicationId}/messages`);
    ok(
      'история чата доступна участнику',
      chatHistory.status === 200 && chatHistory.body.items.length >= 1,
    );

    const contract = await individual.request(
      `/api/documents/employment-contract?applicationId=${applicationId}`,
    );
    ok(
      'GET /api/documents/employment-contract отдаёт PDF',
      contract.status === 200 && String(contract.raw).startsWith('%PDF'),
      `status=${contract.status}`,
    );

    const review = await individual.request('/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        applicationId,
        score: 5,
        comment: 'Отлично отработал, пришёл вовремя',
        badges: ['punctual'],
      }),
    });
    ok('POST /api/reviews', review.status === 201, `status=${review.status}`);

    const duplicateReview = await individual.request('/api/reviews', {
      method: 'POST',
      body: JSON.stringify({ applicationId, score: 4 }),
    });
    ok(
      'повторный отзыв по отклику запрещён',
      duplicateReview.status === 409,
      `status=${duplicateReview.status}`,
    );

    const teenReviews = await teen.request(`/api/users/${review.body?.to?.id}/reviews`);
    ok(
      'отзыв виден в профиле получателя',
      teenReviews.status === 200 && teenReviews.body.items.length >= 1,
      `status=${teenReviews.status}`,
    );
  }

  console.log(`\nИтог: ${passed} успешно, ${failed} неудачно`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('Smoke-тест упал:', error);
  process.exit(1);
});
