/**
 * «Умный фильтр» объявлений: проверка объявления на соответствие ТК РФ и правил безопасности.
 *
 * Результат проверки возвращается и в API (запрет публикации), и в интерфейс
 * (подсказки работодателю, что нужно исправить).
 */
import {
  cohortForMinAge,
  cohortRule,
  isNightShift,
  isValidMinAge,
  shiftDurationHours,
} from './age.js';
import { getCategory, looksLikePrivateAddress, type LocationType } from './categories.js';
import { scanForScam } from './moderation.js';
import { isIndividualEmployer, type UserRole } from './roles.js';

export type ViolationSeverity = 'block' | 'review' | 'warn';

export interface ComplianceViolation {
  code: string;
  severity: ViolationSeverity;
  message: string;
  field?: string;
  /** Что конкретно исправить. */
  hint?: string;
}

export interface ComplianceReport {
  violations: ComplianceViolation[];
  /** Есть блокирующие нарушения — публикация невозможна. */
  blocked: boolean;
  /** Требуется ручная проверка модератором. */
  needsModeration: boolean;
  /** Автоматически исправленные/подсказанные значения полей. */
  suggestions: Record<string, unknown>;
}

export interface EmployerContext {
  role: UserRole;
  verificationStatus: 'none' | 'pending' | 'verified' | 'rejected';
}

export interface ListingDraft {
  type: 'vacancy' | 'gig';
  categoryId: string;
  title: string;
  description: string;
  minAge: number;
  format: 'online' | 'offline';
  paymentAmount: number;
  paymentType: 'per_hour' | 'per_month' | 'fixed_task';
  maxHoursPerDay: number;
  shiftStart?: string | null;
  shiftEnd?: string | null;
  /** Задача выполняется в учебное время. */
  worksDuringStudyTime?: boolean;
  locationType?: LocationType | null;
  locationAddress?: string | null;
  /** На смене есть старший сотрудник. */
  hasSeniorSupervisor?: boolean;
  /** Подросток работает с наличными / кассой. */
  handlesCash?: boolean;
}

/** Минимальные суммы — продуктовое правило, а не требование закона. */
export const PAYMENT_FLOORS: Record<'per_hour' | 'per_month' | 'fixed_task', number> = {
  per_hour: 150,
  per_month: 5000,
  fixed_task: 300,
};

function violation(
  code: string,
  severity: ViolationSeverity,
  message: string,
  extra?: { field?: string; hint?: string },
): ComplianceViolation {
  return { code, severity, message, ...extra };
}

/**
 * Основная проверка объявления.
 */
export function evaluateListing(draft: ListingDraft, employer: EmployerContext): ComplianceReport {
  const violations: ComplianceViolation[] = [];
  const suggestions: Record<string, unknown> = {};
  const individual = isIndividualEmployer(employer.role);
  const category = getCategory(draft.categoryId);

  // --- 1. Минимальный возраст ---------------------------------------------
  if (!isValidMinAge(draft.minAge)) {
    violations.push(
      violation(
        'min_age_invalid',
        'block',
        'Минимальный возраст можно указать только 14, 16 или 18 лет.',
        { field: 'minAge', hint: 'Выберите 14, 16 или 18.' },
      ),
    );
  }

  const minAge = isValidMinAge(draft.minAge) ? draft.minAge : 18;
  const cohort = cohortForMinAge(minAge);
  const rules = cohortRule(cohort);
  const isMinor = minAge < 18;

  // --- 2. Тип объявления и роль работодателя ------------------------------
  if (individual && draft.type === 'vacancy') {
    violations.push(
      violation(
        'individual_cannot_post_vacancy',
        'block',
        'Частные заказчики могут публиковать только быстрые задания.',
        { field: 'type', hint: 'Переключите тип на «Быстрое задание».' },
      ),
    );
  }

  if (!individual && draft.type === 'gig' && employer.role === 'business') {
    // Бизнес может публиковать и задания — ограничений нет.
  }

  // --- 3. Категория -------------------------------------------------------
  if (!category) {
    violations.push(
      violation('category_unknown', 'block', 'Выберите категорию задания.', { field: 'categoryId' }),
    );
  } else {
    if (category.minAllowedAge !== null && minAge < category.minAllowedAge) {
      violations.push(
        violation(
          'category_age_restriction',
          'block',
          `Категория «${category.title}» недоступна для подростков младше ${category.minAllowedAge} лет.`,
          {
            field: 'minAge',
            hint:
              category.restrictionReason ??
              `Укажите минимальный возраст от ${category.minAllowedAge} лет или выберите другую категорию.`,
          },
        ),
      );
    }
    if (individual && !category.allowedForIndividuals) {
      violations.push(
        violation(
          'category_not_for_individuals',
          'block',
          `Категория «${category.title}» доступна только юридическим лицам и ИП.`,
          { field: 'categoryId', hint: 'Выберите онлайн-задачу или другую подходящую категорию.' },
        ),
      );
    }
  }

  // --- 4. Продолжительность смены (ТК РФ ст. 94) ---------------------------
  const shiftHours = shiftDurationHours(draft.shiftStart, draft.shiftEnd);
  const effectiveDailyHours = shiftHours ?? draft.maxHoursPerDay;

  if (isMinor && effectiveDailyHours > rules.maxHoursPerDay) {
    violations.push(
      violation(
        'daily_hours_limit',
        'block',
        `Для возраста ${rules.label} максимальная продолжительность смены — ${rules.maxHoursPerDay} часа в день (ТК РФ ст. 94).`,
        {
          field: 'maxHoursPerDay',
          hint: `Укажите не более ${rules.maxHoursPerDay} часов.`,
        },
      ),
    );
  } else if (isMinor && draft.maxHoursPerDay > rules.maxHoursPerDay) {
    violations.push(
      violation(
        'daily_hours_limit',
        'block',
        `Для возраста ${rules.label} максимальная продолжительность смены — ${rules.maxHoursPerDay} часа в день (ТК РФ ст. 94).`,
        { field: 'maxHoursPerDay', hint: `Укажите не более ${rules.maxHoursPerDay} часов.` },
      ),
    );
    suggestions.maxHoursPerDay = rules.maxHoursPerDay;
  }

  // Работа в учебное время — сокращённый день (PRD: до 4 часов).
  if (isMinor && draft.worksDuringStudyTime && effectiveDailyHours > 4) {
    violations.push(
      violation(
        'study_time_limit',
        'block',
        'Во время учебных занятий смена может длиться не более 4 часов (ТК РФ ст. 92).',
        { field: 'maxHoursPerDay', hint: 'Сократите смену до 4 часов или уберите галочку «в учебное время».' },
      ),
    );
  }

  // Недельная норма при 6 рабочих днях.
  if (isMinor && effectiveDailyHours * 6 > rules.maxHoursPerWeek) {
    violations.push(
      violation(
        'weekly_hours_limit',
        'warn',
        `При 6 рабочих днях недельная норма превышена: ${rules.maxHoursPerWeek} часов (ТК РФ ст. 94).`,
        { field: 'maxHoursPerDay', hint: `Не более ${Math.floor(rules.maxHoursPerWeek / 6)} часов в день.` },
      ),
    );
  }

  // --- 5. Ночные смены -----------------------------------------------------
  if (isMinor && isNightShift(draft.shiftStart, draft.shiftEnd)) {
    violations.push(
      violation(
        'night_shift_blocked',
        'block',
        `Ночные смены подросткам до 18 лет запрещены: смена не должна начинаться позже 22:00 или заканчиваться раньше 06:00 (ТК РФ ст. 95).`,
        {
          field: 'shiftStart',
          hint: 'Укажите дневную смену с 06:00 до 22:00.',
        },
      ),
    );
  }

  // --- 6. Место выполнения и безопасность ---------------------------------
  const locationType = draft.locationType ?? (draft.format === 'online' ? 'online' : 'workplace');

  if (individual && draft.format === 'offline') {
    if (locationType !== 'public_place') {
      violations.push(
        violation(
          'individual_requires_public_place',
          'block',
          'Частный заказчик может назначить офлайн-задание только в общественном месте: парк, двор, ТЦ, улица.',
          {
            field: 'locationType',
            hint: 'Выберите «Общественное место» — задания в квартирах запрещены.',
          },
        ),
      );
    }
    if (looksLikePrivateAddress(draft.locationAddress)) {
      violations.push(
        violation(
          'private_address_detected',
          'block',
          'Адрес похож на частное жильё. Офлайн-задания для подростков возможны только в общественных местах.',
          { field: 'locationAddress', hint: 'Укажите общественное место: парк, сквер, ТЦ, станция метро.' },
        ),
      );
    }
  }

  if (isMinor && locationType === 'private_place') {
    violations.push(
      violation(
        'private_place_for_minor',
        'block',
        'Подросток до 18 лет не может выполнять задание в частном помещении без присмотра взрослого.',
        { field: 'locationType', hint: 'Укажите общественное место или рабочее место работодателя.' },
      ),
    );
  }

  if (isMinor && category?.privateHomeRisk && locationType === 'workplace' && individual) {
    violations.push(
      violation(
        'private_home_task',
        'block',
        'Бытовая помощь в жилом помещении подростку до 18 лет запрещена.',
        { field: 'locationType', hint: 'Разместите задание как онлайн или в общественном месте.' },
      ),
    );
  }

  // --- 7. Ответственность за наличные (ТК РФ ст. 265) ---------------------
  if (minAge === 14 && draft.handlesCash && !draft.hasSeniorSupervisor) {
    violations.push(
      violation(
        'cash_without_senior',
        'block',
        'Подросток 14 лет не может отвечать за наличные без старшего сменщика (ТК РФ ст. 265).',
        {
          field: 'hasSeniorSupervisor',
          hint: 'Отметьте наличие взрослого сотрудника на смене или уберите работу с кассой.',
        },
      ),
    );
  }

  // --- 8. Оплата -----------------------------------------------------------
  if (draft.paymentAmount <= 0) {
    violations.push(
      violation('payment_invalid', 'block', 'Укажите размер оплаты.', { field: 'paymentAmount' }),
    );
  } else {
    const floor = PAYMENT_FLOORS[draft.paymentType];
    if (draft.paymentAmount < floor) {
      violations.push(
        violation(
          'payment_below_floor',
          'warn',
          `Обычная ставка для этого типа оплаты — от ${floor} ₽. Слишком низкая оплата приводит к жалобам и блокировке.`,
          { field: 'paymentAmount', hint: `Укажите не менее ${floor} ₽.` },
        ),
      );
    }
  }

  if (draft.type === 'gig' && draft.paymentType !== 'fixed_task') {
    violations.push(
      violation(
        'gig_payment_type_mismatch',
        'block',
        'Быстрое задание оплачивается за выполнение задания, а не за час или месяц.',
        { field: 'paymentType', hint: 'Выберите «За задание».' },
      ),
    );
  }

  // --- 9. Антифрод ---------------------------------------------------------
  const scamHits = scanForScam(`${draft.title}\n${draft.description}`);
  for (const hit of scamHits) {
    violations.push(
      violation(
        `scam_${hit.code}`,
        hit.severity === 'block' ? 'block' : 'review',
        hit.message,
        { field: 'description', hint: 'Уберите из описания подозрительные формулировки.' },
      ),
    );
  }

  // --- 10. Верификация работодателя ----------------------------------------
  if (employer.role === 'business' && employer.verificationStatus !== 'verified') {
    violations.push(
      violation(
        'business_not_verified',
        'review',
        'Объявление попадёт в ленту после проверки модератором, пока ИНН не подтверждён.',
        { field: 'inn', hint: 'Укажите ИНН в профиле компании для автоматической проверки.' },
      ),
    );
  }

  const blocked = violations.some((v) => v.severity === 'block');
  const needsModeration =
    violations.some((v) => v.severity === 'review') ||
    (employer.role === 'business' && employer.verificationStatus !== 'verified');

  return { violations, blocked, needsModeration, suggestions };
}

/** Человекочитаемый итог проверки. */
export function summarizeReport(report: ComplianceReport): string {
  if (report.blocked) {
    return 'Объявление не может быть опубликовано: ' +
      report.violations.filter((v) => v.severity === 'block').map((v) => v.message).join(' ');
  }
  if (report.needsModeration) {
    return 'Объявление отправлено на проверку модератором.';
  }
  const warnings = report.violations.filter((v) => v.severity === 'warn');
  return warnings.length ? warnings.map((w) => w.message).join(' ') : 'Объявление соответствует требованиям.';
}
