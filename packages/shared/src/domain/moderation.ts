/**
 * Антифрод: стоп-слова и паттерны мошеннических объявлений + детектор внешних контактов.
 */

export type ModerationSeverity = 'block' | 'review' | 'warn';

export interface ModerationRule {
  code: string;
  severity: ModerationSeverity;
  pattern: RegExp;
  message: string;
}

/**
 * Жёсткие правила: объявление не публикуется, уходит на ручную проверку модератору.
 */
export const SCAM_RULES: ModerationRule[] = [
  {
    code: 'deposit',
    severity: 'block',
    pattern: /(залог|депозит|взнос|обеспечительный пла[тё]ж|перечислите залог|внес[тиё] (деньги|сумму))/i,
    message: 'Требование залога или взноса — признак мошеннической схемы.',
  },
  {
    code: 'paid_training',
    severity: 'block',
    pattern: /(оплат[аи]?\s+(за\s+)?(обучени|инструктаж|стажировк|доступ к)|взнос за обучение|учебный взнос|заплатите за обучение)/i,
    message: 'Платное обучение или доступ к заданиям запрещены и являются признаком мошенничества.',
  },
  {
    code: 'crypto',
    severity: 'block',
    pattern: /(крипт[а-я]*|bitcoin|btc\b|usdt|ethereum|ton\b|toncoin|web3|блокчейн|переведи на крипту)/i,
    message: 'Оплата в криптовалюте — признак мошеннической схемы.',
  },
  {
    code: 'no_inspection',
    severity: 'block',
    pattern: /(без досмотра|без проверки|без собеседования|без оформления|не нужен договор|документы не нужны|без трудового договора)/i,
    message: 'Отказ от оформления и проверки — типичный признак нелегальной работы.',
  },
  {
    code: 'substances',
    severity: 'block',
    pattern: /(кальян|вейп|вейпы|сигарет[а-я]* для продажи|торговать\s+(алкогол|сигарет)|продажа алкоголя|ночной клуб|18\+|интим[- ]?клуб|клубы 18)/i,
    message: 'Сфера деятельности запрещена для несовершеннолетних.',
  },
  {
    code: 'dangerous',
    severity: 'block',
    pattern: /(пиротехник|взрывчатк|оружие|оружейн|а Ozon?)/i,
    message: 'Объявление связано с опасными товарами или деятельностью.',
  },
  {
    code: 'personal_data',
    severity: 'block',
    pattern: /(отправьте паспорт|пришлите паспорт|фото паспорта|отправьте карту|переведите на карту|с карты на карту|реквизиты карты)/i,
    message: 'Требование переслать документы или реквизиты карты — признак мошенничества.',
  },
  {
    code: 'earnings_guarantee',
    severity: 'review',
    pattern: /(гарантированный доход|заработок от [0-9]|до [0-9]{4,}\s?₽\s?в день|чистая прибыль|доход от [0-9])/i,
    message: 'Заявлены необычно высокие гарантированные доходы — нужна проверка модератора.',
  },
  {
    code: 'offplatform',
    severity: 'review',
    pattern: /(пишите в телеграм|напишите в тг|пишите в whatsapp|whatsapp|пишите в вк|в директ|добавляйтесь в)/i,
    message: 'Общение предлагается вне платформы — это лишает подростка защиты.',
  },
];

/**
 * Паттерны внешних контактов внутри чата.
 * Используются для предупреждения о попытке увести переписку на сторону.
 */
export const EXTERNAL_CONTACT_RULES: ModerationRule[] = [
  {
    code: 'phone',
    severity: 'warn',
    pattern: /(?:\+7|8)[\s\-()]*\d{3}[\s\-()]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}/,
    message: 'В сообщении указан номер телефона. Общайтесь только в чате платформы.',
  },
  {
    code: 'messenger',
    severity: 'warn',
    pattern: /(@[a-z0-9_]{4,}|t\.me\/|telegram\.me\/|wa\.me\/|https?:\/\/(?:www\.)?(?:vk\.com|ok\.ru|instagram\.com|t\.me|wa\.me))/i,
    message: 'Попытка перевести общение в сторонний мессенджер.',
  },
  {
    code: 'external_url',
    severity: 'warn',
    pattern: /https?:\/\/[^\s]+/i,
    message: 'В сообщении есть внешняя ссылка. Не переходите по неизвестным ссылкам.',
  },
];

export interface ModerationHit {
  code: string;
  severity: ModerationSeverity;
  message: string;
  matched: string;
}

function collectHits(text: string, rules: ModerationRule[]): ModerationHit[] {
  const hits: ModerationHit[] = [];
  for (const rule of rules) {
    const match = rule.pattern.exec(text);
    if (match) {
      hits.push({
        code: rule.code,
        severity: rule.severity,
        message: rule.message,
        matched: match[0].slice(0, 60),
      });
    }
  }
  return hits;
}

/** Проверка текста объявления на признаки мошенничества. */
export function scanForScam(text: string): ModerationHit[] {
  return collectHits(text, SCAM_RULES);
}

/** Проверка сообщения на попытку увести общение на сторону. */
export function scanForExternalContacts(text: string): ModerationHit[] {
  return collectHits(text, EXTERNAL_CONTACT_RULES);
}

/** Стоп-слова, которые показываются пользователю в интерфейсе. */
export const STOP_WORDS: string[] = [
  'залог',
  'взнос за обучение',
  'перевод на крипту',
  'без досмотра',
  'написать в телеграм сразу',
  'работа с кальянами',
  'вейпы',
  'пиротехника',
];
