/**
 * Юнит-тесты доменного ядра @teenwork/shared:
 * возрастные когорты и ТК РФ, категории, антифрод, бейджи, форматирование.
 *
 * Запуск: npm run test -w @teenwork/shared
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ageFromBirthDate,
  cohortForAge,
  cohortRule,
  computeBadges,
  evaluateListing,
  getCategory,
  initials,
  isNightShift,
  looksLikePrivateAddress,
  maskPhone,
  parseTimeToMinutes,
  scanForExternalContacts,
  scanForScam,
  shiftDurationHours,
  truncate,
} from '../dist/index.js';

// --- Вспомогательные конструкторы -------------------------------------------

const NOW = new Date('2026-10-22T12:00:00Z');

const business = { role: 'business', verificationStatus: 'verified' };
const businessPending = { role: 'business', verificationStatus: 'pending' };
const individual = { role: 'individual', verificationStatus: 'none' };

function draft(overrides = {}) {
  return {
    type: 'vacancy',
    categoryId: 'cafe',
    title: 'Помощник в кофейне',
    description: 'Помогать на кухне и в зале, обучение на месте, опыт не нужен.',
    minAge: 16,
    format: 'offline',
    paymentAmount: 200,
    paymentType: 'per_hour',
    maxHoursPerDay: 4,
    shiftStart: '10:00',
    shiftEnd: '14:00',
    locationType: 'workplace',
    locationAddress: 'ул. Тверская, 12',
    ...overrides,
  };
}

function codes(report) {
  return report.violations.map((violation) => violation.code);
}

// --- Возраст и ТК РФ ---------------------------------------------------------

test('возраст считается по дате рождения с учётом дня рождения', () => {
  assert.equal(ageFromBirthDate(new Date('2011-05-16T00:00:00'), NOW), 15);
  assert.equal(ageFromBirthDate(new Date('2011-11-02T00:00:00'), NOW), 14);
  assert.equal(ageFromBirthDate(new Date('2008-02-10T00:00:00'), NOW), 18);
});

test('возрастные когорты и лимиты ст. 94', () => {
  assert.equal(cohortForAge(14), '14_15');
  assert.equal(cohortForAge(15), '14_15');
  assert.equal(cohortForAge(16), '16_17');
  assert.equal(cohortForAge(17), '16_17');
  assert.equal(cohortForAge(18), '18');

  assert.equal(cohortRule('14_15').maxHoursPerDay, 4);
  assert.equal(cohortRule('16_17').maxHoursPerDay, 5);
  assert.equal(cohortRule('18').maxHoursPerDay, 8);

  assert.equal(cohortRule('14_15').requiresParentConsent, true);
  assert.equal(cohortRule('18').requiresParentConsent, false);
  assert.equal(cohortRule('14_15').allowNightShift, false);
  assert.equal(cohortRule('18').allowNightShift, true);
});

test('ночная смена определяется по ст. 95', () => {
  assert.equal(isNightShift('22:00', '23:59'), true);
  assert.equal(isNightShift('05:00', '07:00'), true);
  assert.equal(isNightShift('20:00', '02:00'), true);
  assert.equal(isNightShift('10:00', '16:00'), false);
  assert.equal(isNightShift(null, null), false);
});

test('длительность смены считается с переходом через полночь', () => {
  assert.equal(shiftDurationHours('10:00', '16:00'), 6);
  assert.equal(shiftDurationHours('20:00', '02:00'), 6);
  assert.equal(shiftDurationHours('10:00', '10:00'), 24);
  assert.equal(shiftDurationHours(null, null), null);
});

test('время разбирается и валидируется', () => {
  assert.equal(parseTimeToMinutes('10:30'), 630);
  assert.equal(parseTimeToMinutes('00:00'), 0);
  assert.equal(parseTimeToMinutes('25:00'), null);
  assert.equal(parseTimeToMinutes('abc'), null);
});

// --- Категории ---------------------------------------------------------------

test('категории хранят ограничения по возрасту', () => {
  assert.equal(getCategory('production').minAllowedAge, 18);
  assert.equal(getCategory('delivery').minAllowedAge, 16);
  assert.equal(getCategory('cafe').minAllowedAge, 14);
  assert.equal(getCategory('unknown-category'), undefined);
});

test('частный адрес распознаётся по стоп-словам', () => {
  assert.equal(looksLikePrivateAddress('ул. Мира, д. 12, кв. 4'), true);
  assert.equal(looksLikePrivateAddress('ТЦ Атриум, 3 этаж'), false);
  assert.equal(looksLikePrivateAddress(null), false);
});

// --- Проверка объявлений по ТК РФ --------------------------------------------

test('корректное объявление проходит без нарушений', () => {
  const report = evaluateListing(draft(), business);
  assert.equal(report.blocked, false);
  assert.deepEqual(report.violations, []);
  assert.equal(report.needsModeration, false);
});

test('некорректный минимальный возраст блокируется', () => {
  const report = evaluateListing(draft({ minAge: 15 }), business);
  assert.equal(report.blocked, true);
  assert.ok(codes(report).includes('min_age_invalid'));
});

test('частный заказчик не может публиковать вакансию', () => {
  const report = evaluateListing(draft({ type: 'vacancy' }), individual);
  assert.ok(codes(report).includes('individual_cannot_post_vacancy'));
});

test('категория с ограничением по возрасту недоступна младшим', () => {
  const report = evaluateListing(
    draft({ categoryId: 'production', minAge: 14, shiftStart: null, shiftEnd: null }),
    business,
  );
  assert.ok(codes(report).includes('category_age_restriction'));
});

test('категория, недоступная физлицам, блокируется', () => {
  const report = evaluateListing(draft({ categoryId: 'cafe' }), individual);
  assert.ok(codes(report).includes('category_not_for_individuals'));
});

test('слишком длинная смена блокируется по ст. 94', () => {
  const report = evaluateListing(draft({ minAge: 14, maxHoursPerDay: 6 }), business);
  assert.ok(codes(report).includes('daily_hours_limit'));
});

test('ночная смена несовершеннолетнему блокируется по ст. 95', () => {
  const report = evaluateListing(
    draft({ minAge: 16, shiftStart: '22:00', shiftEnd: '02:00' }),
    business,
  );
  assert.ok(codes(report).includes('night_shift_blocked'));
});

test('работа в учебное время ограничена 4 часами по ст. 92', () => {
  const report = evaluateListing(
    draft({ minAge: 14, maxHoursPerDay: 5, shiftStart: '10:00', shiftEnd: '15:00', worksDuringStudyTime: true }),
    business,
  );
  assert.ok(codes(report).includes('study_time_limit'));
});

test('недельная норма — предупреждение, а не блокировка', () => {
  const report = evaluateListing(
    draft({ minAge: 16, maxHoursPerDay: 6, shiftStart: '10:00', shiftEnd: '16:00' }),
    business,
  );
  const weekly = report.violations.find((v) => v.code === 'weekly_hours_limit');
  assert.ok(weekly);
  assert.equal(weekly.severity, 'warn');
});

test('подсказка предлагает безопасное число часов', () => {
  const report = evaluateListing(
    draft({ minAge: 16, maxHoursPerDay: 8, shiftStart: '10:00', shiftEnd: '14:00' }),
    business,
  );
  assert.ok(codes(report).includes('daily_hours_limit'));
  assert.equal(report.suggestions.maxHoursPerDay, 5);
});

test('частное помещение запрещено подростку и физлицу', () => {
  const minor = evaluateListing(draft({ minAge: 14, locationType: 'private_place' }), business);
  assert.ok(codes(minor).includes('private_place_for_minor'));

  const person = evaluateListing(
    draft({ type: 'gig', categoryId: 'promo', paymentType: 'fixed_task', locationType: 'private_place' }),
    individual,
  );
  assert.ok(codes(person).includes('individual_requires_public_place'));
});

test('адрес похожий на квартиру блокируется', () => {
  const report = evaluateListing(
    draft({ type: 'gig', categoryId: 'promo', paymentType: 'fixed_task', locationType: 'public_place', locationAddress: 'ул. Мира, д. 12, кв. 4' }),
    individual,
  );
  assert.ok(codes(report).includes('private_address_detected'));
});

test('работа с наличными в 14 лет требует старшего сотрудника', () => {
  const report = evaluateListing(
    draft({ minAge: 14, handlesCash: true, hasSeniorSupervisor: false }),
    business,
  );
  assert.ok(codes(report).includes('cash_without_senior'));

  const ok = evaluateListing(
    draft({ minAge: 14, handlesCash: true, hasSeniorSupervisor: true }),
    business,
  );
  assert.equal(ok.blocked, false);
});

test('низкая оплата — предупреждение', () => {
  const report = evaluateListing(draft({ paymentAmount: 100 }), business);
  const payment = report.violations.find((v) => v.code === 'payment_below_floor');
  assert.ok(payment);
  assert.equal(payment.severity, 'warn');
});

test('быстрое задание оплачивается за выполнение', () => {
  const report = evaluateListing(
    draft({ type: 'gig', categoryId: 'promo', paymentType: 'per_hour' }),
    business,
  );
  assert.ok(codes(report).includes('gig_payment_type_mismatch'));
});

test('объявление с залогом блокируется антифродом', () => {
  const report = evaluateListing(
    draft({ description: 'Нужно внести залог 500 рублей, потом вернём.' }),
    business,
  );
  assert.ok(codes(report).includes('scam_deposit'));
  assert.equal(report.blocked, true);
});

test('непроверенная компания отправляет объявление на модерацию', () => {
  const report = evaluateListing(draft(), businessPending);
  assert.equal(report.blocked, false);
  assert.equal(report.needsModeration, true);
  assert.ok(codes(report).includes('business_not_verified'));
});

test('задание физлица в общественном месте публикуется сразу', () => {
  const report = evaluateListing(
    draft({
      type: 'gig',
      categoryId: 'promo',
      paymentType: 'fixed_task',
      paymentAmount: 800,
      maxHoursPerDay: 2,
      shiftStart: '12:00',
      shiftEnd: '14:00',
      locationType: 'public_place',
      locationAddress: 'парк у фонтана, вход со стороны улицы',
    }),
    individual,
  );
  assert.equal(report.blocked, false);
  assert.equal(report.needsModeration, false);
});

// --- Антифрод ----------------------------------------------------------------

test('сканер объявлений ловит мошеннические формулировки', () => {
  assert.ok(scanForScam('Внесите залог перед началом работы').some((h) => h.code === 'deposit'));
  assert.ok(scanForScam('Оплата за обучение перед выходом на работу').some((h) => h.code === 'paid_training'));
  assert.ok(scanForScam('Пишите в телеграм').some((h) => h.code === 'offplatform'));
  assert.equal(scanForScam('Обычная вакансия в кофейне, обучение на месте').length, 0);
});

test('в чате ловятся внешние контакты', () => {
  assert.ok(scanForExternalContacts('Пишите +7 900 123-45-67').some((h) => h.code === 'phone'));
  assert.ok(scanForExternalContacts('Мой профиль @teenwork_help').some((h) => h.code === 'messenger'));
  assert.ok(scanForExternalContacts('Ссылка https://example.com').some((h) => h.code === 'external_url'));
  assert.equal(scanForExternalContacts('Во сколько прийти?').length, 0);
});

// --- Бейджи и форматирование -------------------------------------------------

test('бейджи считаются по профилю', () => {
  const badges = computeBadges({
    parentConsentUploaded: true,
    isSelfEmployed: false,
    completedGigs: 1,
    onTimeStreak: 5,
    avgResponseMinutes: 10,
    rating: 5,
    ratingCount: 4,
  });
  assert.deepEqual(badges.sort(), [
    'first_job',
    'five_stars',
    'on_line',
    'punctual',
    'verified_profile',
  ]);
});

test('телефон маскируется, имя сокращается до инициалов', () => {
  assert.equal(maskPhone('+79001234567'), '+7 90 ••• •• 67');
  assert.equal(initials('Аня Смирнова'), 'АС');
  assert.equal(initials('  Пётр  Савельев '), 'ПС');
});

test('длинный текст обрезается с многоточием', () => {
  assert.equal(truncate('а'.repeat(20), 10), `${'а'.repeat(9)}…`);
  assert.equal(truncate('коротко', 10), 'коротко');
});
