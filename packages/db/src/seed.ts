/**
 * Наполнение базы демо-данными: подростки, заказчики, вакансии, задания,
 * отклики, отзывы и переписка.
 *
 * Запуск: npm run db:seed
 */
import {
  applications,
  employerProfiles,
  getDb,
  listings,
  messages,
  newId,
  nowIso,
  reviews,
  teenProfiles,
  users,
} from './index.js';
import { isMainModule } from './is-main.js';

const db = getDb();

const MOSCOW = {
  tverskaya: { lat: 55.7642, lng: 37.6056 },
  arbat: { lat: 55.7522, lng: 37.6056 },
  tsvetnoy: { lat: 55.7716, lng: 37.6203 },
  sokolniki: { lat: 55.8023, lng: 37.6603 },
  otradne: { lat: 55.8269, lng: 37.6398 },
  avtozavodskaya: { lat: 55.7075, lng: 37.6628 },
  izmaylovo: { lat: 55.7867, lng: 37.6456 },
  novogireevo: { lat: 55.8103, lng: 37.6541 },
  prospektMira: { lat: 55.7798, lng: 37.6333 },
};

function iso(daysAgo: number, hour = 12): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

async function reset() {
  await db.delete(messages).run();
  await db.delete(reviews).run();
  await db.delete(applications).run();
  await db.delete(listings).run();
  await db.delete(teenProfiles).run();
  await db.delete(employerProfiles).run();
  await db.delete(users).run();
}

export async function seed() {
  await reset();

  const created = nowIso();

  // --- Подростки ------------------------------------------------------------
  const teens = [
    {
      id: '11111111-1111-4111-8111-111111111111',
      phone: '+79001234567',
      fullName: 'Аня Смирнова',
      birthDate: '2011-05-16',
      rating: 4.9,
      ratingCount: 5,
      verified: true,
      profile: {
        ageCohort: '14_15' as const,
        skills: ['capcut', 'design', 'responsible', 'punctual'],
        bio: 'Умею монтировать Reels и делать карточки товаров. Ищу подработку после школы.',
        schoolType: 'school',
        schoolShift: '2 смена',
        availableHours: [
          { from: '16:00', to: '20:00' },
          { from: '10:00', to: '14:00' },
        ],
        radiusKm: 3,
        location: MOSCOW.arbat,
        parentConsentUploaded: true,
        isSelfEmployed: false,
        completedGigs: 5,
        onTimeStreak: 5,
        avgResponseMinutes: 4,
      },
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      phone: '+79007654321',
      fullName: 'Илья Волков',
      birthDate: '2011-11-02',
      rating: 4.6,
      ratingCount: 3,
      verified: true,
      profile: {
        ageCohort: '14_15' as const,
        skills: ['dogs', 'endurance', 'promo'],
        bio: 'Люблю животных, готов к выгулу в любую погоду.',
        schoolType: 'school',
        schoolShift: '1 смена',
        availableHours: [{ from: '17:00', to: '21:00' }],
        radiusKm: 5,
        location: MOSCOW.prospektMira,
        parentConsentUploaded: false,
        isSelfEmployed: false,
        completedGigs: 3,
        onTimeStreak: 3,
        avgResponseMinutes: 12,
      },
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      phone: '+79001112233',
      fullName: 'Катя Морозова',
      birthDate: '2009-08-20',
      rating: 4.8,
      ratingCount: 8,
      verified: true,
      profile: {
        ageCohort: '16_17' as const,
        skills: ['help_kids', 'english_b1', 'cafe', 'friendly'],
        bio: 'Сижу с младшими школьниками, готовлю кофе — делала летом в кофейне.',
        schoolType: 'school',
        schoolShift: '1 смена',
        availableHours: [{ from: '15:00', to: '20:00' }],
        radiusKm: 2,
        location: MOSCOW.tsvetnoy,
        parentConsentUploaded: true,
        isSelfEmployed: true,
        completedGigs: 8,
        onTimeStreak: 6,
        avgResponseMinutes: 7,
      },
    },
    {
      id: '44444444-4444-4444-8444-444444444444',
      phone: '+79004445566',
      fullName: 'Даня Петров',
      birthDate: '2008-02-10',
      rating: 5,
      ratingCount: 11,
      verified: true,
      profile: {
        ageCohort: '18' as const,
        skills: ['warehouse', 'delivery', 'responsible', 'endurance'],
        bio: 'Сборка заказов, готов брать смены в выходные.',
        schoolType: 'college',
        schoolShift: '2 смена',
        availableHours: [{ from: '18:00', to: '23:00' }],
        radiusKm: 10,
        location: MOSCOW.avtozavodskaya,
        parentConsentUploaded: true,
        isSelfEmployed: true,
        completedGigs: 11,
        onTimeStreak: 11,
        avgResponseMinutes: 3,
      },
    },
  ];

  for (const teen of teens) {
    await db
      .insert(users)
      .values({
        id: teen.id,
        role: 'teen',
        phone: teen.phone,
        fullName: teen.fullName,
        birthDate: teen.birthDate,
        isVerified: teen.verified,
        rating: teen.rating,
        ratingCount: teen.ratingCount,
        createdAt: iso(30),
      })
      .run();

    await db
      .insert(teenProfiles)
      .values({
        userId: teen.id,
        ageCohort: teen.profile.ageCohort,
        skills: teen.profile.skills,
        bio: teen.profile.bio,
        schoolType: teen.profile.schoolType,
        schoolShift: teen.profile.schoolShift,
        availableHours: teen.profile.availableHours,
        radiusKm: teen.profile.radiusKm,
        locationLat: teen.profile.location.lat,
        locationLng: teen.profile.location.lng,
        parentConsentUploaded: teen.profile.parentConsentUploaded,
        isSelfEmployed: teen.profile.isSelfEmployed,
        completedGigs: teen.profile.completedGigs,
        onTimeStreak: teen.profile.onTimeStreak,
        avgResponseMinutes: teen.profile.avgResponseMinutes,
        createdAt: iso(30),
        updatedAt: iso(1),
      })
      .run();
  }

  // --- Заказчики ------------------------------------------------------------
  const employers = [
    {
      id: '55555555-5555-4555-8555-555555555555',
      role: 'business' as const,
      phone: '+79001110000',
      fullName: 'Ирина Соколова',
      companyName: 'Кофейня «Зёрна»',
      inn: '7701234567',
      verificationStatus: 'verified' as const,
      rating: 4.7,
      ratingCount: 32,
      description: 'Небольшая кофейня в центре. Учим с нуля, график — 2 смены в неделю.',
    },
    {
      id: '66666666-6666-4666-8666-666666666666',
      role: 'business' as const,
      phone: '+79002220000',
      fullName: 'Пётр Савельев',
      companyName: 'ПВЗ «Точка»',
      inn: '771234567890',
      verificationStatus: 'pending' as const,
      rating: 4.2,
      ratingCount: 11,
      description: 'Пункт выдачи заказов, нужен сборщик на вечерние смены.',
    },
    {
      id: '77777777-7777-4777-8777-777777777777',
      role: 'individual' as const,
      phone: '+79003330000',
      fullName: 'Мария Нестерова',
      companyName: null,
      inn: null,
      verificationStatus: 'none' as const,
      rating: 5,
      ratingCount: 4,
      description: null,
    },
  ];

  for (const employer of employers) {
    await db
      .insert(users)
      .values({
        id: employer.id,
        role: employer.role,
        phone: employer.phone,
        fullName: employer.fullName,
        isVerified: employer.verificationStatus === 'verified',
        rating: employer.rating,
        ratingCount: employer.ratingCount,
        createdAt: iso(20),
      })
      .run();

    await db
      .insert(employerProfiles)
      .values({
        userId: employer.id,
        companyName: employer.companyName,
        inn: employer.inn,
        verificationStatus: employer.verificationStatus,
        description: employer.description,
        createdAt: iso(20),
        updatedAt: iso(20),
      })
      .run();
  }

  // --- Модератор платформы ---------------------------------------------------
  await db
    .insert(users)
    .values({
      id: '99999999-9999-4999-8999-999999999999',
      role: 'admin',
      phone: '+79009990000',
      fullName: 'Модератор Платформы',
      isVerified: true,
      rating: 0,
      ratingCount: 0,
      createdAt: iso(20),
    })
    .run();

  // --- Объявления -----------------------------------------------------------
  const listingsSeed = [
    {
      id: 'a1111111-1111-4111-8111-111111111111',
      employerId: '55555555-5555-4555-8555-555555555555',
      type: 'vacancy' as const,
      categoryId: 'cafe',
      title: 'Помощник бариста на выходные',
      description:
        'Ищем помощника бариста в кофейню в центре. Обучим работать с кофемашиной, общаться с гостями, готовить напитки. Смена 4 часа, оплата сразу после смены.',
      minAge: 16,
      format: 'offline' as const,
      paymentAmount: 250,
      paymentType: 'per_hour' as const,
      maxHoursPerDay: 4,
      shiftStart: '10:00',
      shiftEnd: '14:00',
      locationType: 'workplace' as const,
      locationAddress: 'Москва, ул. Тверская, 12',
      location: MOSCOW.tverskaya,
      hasSeniorSupervisor: true,
      handlesCash: true,
      status: 'active' as const,
      createdAt: iso(3),
      publishedAt: iso(3),
    },
    {
      id: 'a2222222-2222-4222-8222-222222222222',
      employerId: '55555555-5555-4555-8555-555555555555',
      type: 'vacancy' as const,
      categoryId: 'promo',
      title: 'Промоутер у метро «Отрадное»',
      description:
        'Раздача листовок и приглашение на мастер-классы. 3 часа в день, гибкий график, оплата на карту в тот же день.',
      minAge: 14,
      format: 'offline' as const,
      paymentAmount: 220,
      paymentType: 'per_hour' as const,
      maxHoursPerDay: 3,
      shiftStart: '16:00',
      shiftEnd: '19:00',
      locationType: 'public_place' as const,
      locationAddress: 'Москва, выход из метро «Отрадное», ул. Хачатуряна',
      location: MOSCOW.otradne,
      hasSeniorSupervisor: true,
      handlesCash: false,
      status: 'active' as const,
      createdAt: iso(2),
      publishedAt: iso(2),
    },
    {
      id: 'a3333333-3333-4333-8333-333333333333',
      employerId: '77777777-7777-4777-8777-777777777777',
      type: 'gig' as const,
      categoryId: 'it',
      title: 'Сделать 5 карточек товара для маркетплейса',
      description:
        'Нужно сделать 5 карточек товара в Canva по моему примеру. Товар — чехлы для телефонов, фото и размеры пришлю. Срок — 3 дня.',
      minAge: 14,
      format: 'online' as const,
      paymentAmount: 1000,
      paymentType: 'fixed_task' as const,
      maxHoursPerDay: 4,
      locationType: 'online' as const,
      locationAddress: null,
      location: MOSCOW.prospektMira,
      hasSeniorSupervisor: false,
      handlesCash: false,
      status: 'active' as const,
      createdAt: iso(1),
      publishedAt: iso(1),
    },
    {
      id: 'a4444444-4444-4444-8444-444444444444',
      employerId: '77777777-7777-4777-8777-777777777777',
      type: 'gig' as const,
      categoryId: 'pets',
      title: 'Выгул собаки после 18:00',
      description:
        'Нужно забрать собаку от подъезда на Цветном бульваре и погулять 40 минут. Собака спокойная, ремень и пакет для экскрементов дам.',
      minAge: 14,
      format: 'offline' as const,
      paymentAmount: 800,
      paymentType: 'fixed_task' as const,
      maxHoursPerDay: 2,
      shiftStart: '18:00',
      shiftEnd: '20:00',
      locationType: 'public_place' as const,
      locationAddress: 'Москва, Цветной бульвар, 20 (у фонтана)',
      location: MOSCOW.tsvetnoy,
      hasSeniorSupervisor: false,
      handlesCash: false,
      status: 'active' as const,
      createdAt: iso(1),
      publishedAt: iso(1),
    },
    {
      id: 'a5555555-5555-4555-8555-555555555555',
      employerId: '66666666-6666-4666-8666-666666666666',
      type: 'vacancy' as const,
      categoryId: 'warehouse',
      title: 'Сборщик заказов на ПВЗ (вечерние смены)',
      description:
        'Сборка заказов на пункте выдачи, 5 часов в смену, работа с терминалом. Оплата ежедневно.',
      minAge: 16,
      format: 'offline' as const,
      paymentAmount: 300,
      paymentType: 'per_hour' as const,
      maxHoursPerDay: 5,
      shiftStart: '14:00',
      shiftEnd: '19:00',
      locationType: 'workplace' as const,
      locationAddress: 'Москва, ул. Автозаводская, 18',
      location: MOSCOW.avtozavodskaya,
      hasSeniorSupervisor: true,
      handlesCash: false,
      status: 'moderation' as const,
      createdAt: iso(0),
      publishedAt: null,
    },
    {
      id: 'a6666666-6666-4666-8666-666666666666',
      employerId: '77777777-7777-4777-8777-777777777777',
      type: 'gig' as const,
      categoryId: 'office',
      title: 'Работа в офисе, залог 500 рублей',
      description:
        'Нужно охранять склад ночью. Внесём залог 500 рублей на карту, отработаете — вернём.',
      minAge: 14,
      format: 'offline' as const,
      paymentAmount: 2000,
      paymentType: 'fixed_task' as const,
      maxHoursPerDay: 8,
      shiftStart: '22:00',
      shiftEnd: '06:00',
      locationType: 'private_place' as const,
      locationAddress: 'Москва, ул. Сокольническая, 5, кв. 12',
      location: MOSCOW.sokolniki,
      hasSeniorSupervisor: false,
      handlesCash: false,
      status: 'blocked' as const,
      moderationReason: 'Требование залога, ночная смена для несовершеннолетнего, адрес жилого помещения',
      createdAt: iso(4),
      publishedAt: null,
    },
  ];

  for (const listing of listingsSeed) {
    await db
      .insert(listings)
      .values({
        id: listing.id,
        employerId: listing.employerId,
        type: listing.type,
        categoryId: listing.categoryId,
        title: listing.title,
        description: listing.description,
        minAge: listing.minAge,
        format: listing.format,
        paymentAmount: listing.paymentAmount,
        paymentType: listing.paymentType,
        maxHoursPerDay: listing.maxHoursPerDay,
        shiftStart: listing.shiftStart,
        shiftEnd: listing.shiftEnd,
        worksDuringStudyTime: false,
        locationType: listing.locationType,
        locationAddress: listing.locationAddress,
        locationLat: listing.location.lat,
        locationLng: listing.location.lng,
        hasSeniorSupervisor: listing.hasSeniorSupervisor,
        handlesCash: listing.handlesCash,
        status: listing.status,
        moderationReason: listing.moderationReason ?? null,
        publishedAt: listing.publishedAt,
        createdAt: listing.createdAt,
        updatedAt: listing.createdAt,
      })
      .run();
  }

  // --- Отклики, отзывы, переписка ------------------------------------------
  const applicationRows = [
    {
      id: 'b1111111-1111-4111-8111-111111111111',
      listingId: 'a1111111-1111-4111-8111-111111111111',
      teenId: '33333333-3333-4333-8333-333333333333',
      status: 'accepted' as const,
      message: 'Здравствуйте! Готова выйти на выходные, есть опыт в кофейне.',
      createdAt: iso(2),
    },
    {
      id: 'b2222222-2222-4222-8222-222222222222',
      listingId: 'a2222222-2222-4222-8222-222222222222',
      teenId: '11111111-1111-4111-8111-111111111111',
      status: 'pending' as const,
      message: 'Хочу попробовать себя в промоушене, готова прийти в субботу.',
      createdAt: iso(1),
    },
    {
      id: 'b3333333-3333-4333-8333-333333333333',
      listingId: 'a3333333-3333-4333-8333-333333333333',
      teenId: '11111111-1111-4111-8111-111111111111',
      status: 'completed' as const,
      message: 'Беру задание, карточки сделаю за два дня.',
      createdAt: iso(5),
    },
    {
      id: 'b4444444-4444-4444-8444-444444444444',
      listingId: 'a4444444-4444-4444-8444-444444444444',
      teenId: '22222222-2222-4222-8222-222222222222',
      status: 'completed' as const,
      message: 'Готов гулять, живу рядом.',
      createdAt: iso(6),
    },
  ];

  for (const application of applicationRows) {
    await db
      .insert(applications)
      .values({ ...application, updatedAt: application.createdAt })
      .run();
  }

  await db
    .insert(reviews)
    .values({
      id: 'c1111111-1111-4111-8111-111111111111',
      applicationId: 'b3333333-3333-4333-8333-333333333333',
      fromUserId: '77777777-7777-4777-8777-777777777777',
      toUserId: '11111111-1111-4111-8111-111111111111',
      score: 5,
      badges: ['punctual', 'responsible'],
      comment: 'Аня сделала карточки быстро и аккуратно, всё согласовала заранее.',
      createdAt: iso(4),
    })
    .run();

  await db
    .insert(reviews)
    .values({
      id: 'c2222222-2222-4222-8222-222222222222',
      applicationId: 'b4444444-4444-4444-8444-444444444444',
      fromUserId: '77777777-7777-4777-8777-777777777777',
      toUserId: '22222222-2222-4222-8222-222222222222',
      score: 5,
      badges: ['dogs', 'punctual'],
      comment: 'Илья пришёл вовремя, собака довольна.',
      createdAt: iso(5),
    })
    .run();

  await db
    .insert(reviews)
    .values({
      id: 'c3333333-3333-4333-8333-333333333333',
      applicationId: 'b3333333-3333-4333-8333-333333333333',
      fromUserId: '11111111-1111-4111-8111-111111111111',
      toUserId: '77777777-7777-4777-8777-777777777777',
      score: 5,
      badges: ['friendly'],
      comment: 'Оплата вовремя, задача понятная.',
      createdAt: iso(4),
    })
    .run();

  const messageRows = [
    {
      id: 'd1111111-1111-4111-8111-111111111111',
      applicationId: 'b1111111-1111-4111-8111-111111111111',
      senderId: '55555555-5555-4555-8555-555555555555',
      body: 'Катя, привет! Выходи в субботу к 10:00, обучим на месте.',
      createdAt: iso(2),
    },
    {
      id: 'd2222222-2222-4222-8222-222222222222',
      applicationId: 'b1111111-1111-4111-8111-111111111111',
      senderId: '33333333-3333-4333-8333-333333333333',
      body: 'Договорились! Могу в субботу и в воскресенье.',
      createdAt: iso(2),
    },
    {
      id: 'd3333333-3333-4333-8333-333333333333',
      applicationId: 'b2222222-2222-4222-8222-222222222222',
      senderId: '11111111-1111-4111-8111-111111111111',
      body: 'Здравствуйте! Я Анна, можно узнать, сколько листовок в час нужно раздать?',
      createdAt: iso(1),
    },
    {
      id: 'd4444444-4444-4444-8444-444444444444',
      applicationId: 'b2222222-2222-4222-8222-222222222222',
      senderId: '55555555-5555-4555-8555-555555555555',
      body: 'Привет! Около 300 листовок за смену, детали выдадим на месте.',
      createdAt: iso(1),
    },
  ];

  for (const message of messageRows) {
    await db
      .insert(messages)
      .values({
        id: message.id,
        applicationId: message.applicationId,
        senderId: message.senderId,
        body: message.body,
        warnings: [],
        flagged: false,
        readAt: null,
        createdAt: message.createdAt,
      })
      .run();
  }

  const counts = {
    users: (await db.select().from(users)).length,
    listings: (await db.select().from(listings)).length,
    applications: (await db.select().from(applications)).length,
    reviews: (await db.select().from(reviews)).length,
    messages: (await db.select().from(messages)).length,
  };

  console.log('✓ Демо-данные загружены:', counts);
  console.log('');
  console.log('  Тестовые аккаунты (код подтверждения — 111111 в dev-режиме):');
  console.log('  Подросток 15 лет:  +79001234567 (Аня Смирнова)');
  console.log('  Подросток 14 лет:  +79007654321 (Илья Волков)');
  console.log('  Подросток 17 лет:  +79001112233 (Катя Морозова)');
  console.log('  Подросток 18 лет:  +79004445566 (Даня Петров)');
  console.log('  Бизнес (ИП/ООО):   +79001110000 (Кофейня «Зёрна»)');
  console.log('  Частный заказчик:  +79003330000 (Мария Нестерова)');
  console.log('  Модератор:         +79009990000 (Модератор Платформы)');
}

// Автозапуск только когда файл запущен как скрипт.
// При импорте (например, из `db:reset`) сид вызывает вызывающий код.
if (isMainModule(import.meta.url)) {
  seed()
    .then(() => {
      console.log('');
      console.log('Вход: POST /api/auth/login { "phone": "+79001234567" } → код 111111');
    })
    .catch((error) => {
      console.error('Ошибка загрузки демо-данных:', error);
      process.exit(1);
    });
}
