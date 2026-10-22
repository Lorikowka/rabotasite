/**
 * Возрастные когорты и ограничения ТК РФ для несовершеннолетних.
 *
 * Источники: ТК РФ ст. 94 (продолжительность рабочего времени), ст. 92 (работа в учебное время),
 * ст. 95 (ночная смена), ст. 265/266 (запрещённые работы), ст. 272 (согласие родителей).
 *
 * ВНИМАНИЕ: правила — продуктовые приближения к ТК РФ и требуют ревизии юриста перед продом.
 */

export const AGE_COHORTS = ['14_15', '16_17', '18'] as const;
export type AgeCohort = (typeof AGE_COHORTS)[number];

/** Минимальный возраст приёма на работу. */
export const MIN_HIRING_AGE = 14;

/** Варианты минимального возраста, доступные при публикации объявления. */
export const MIN_AGE_OPTIONS = [14, 16, 18] as const;
export type MinAgeOption = (typeof MIN_AGE_OPTIONS)[number];

export interface CohortRule {
  cohort: AgeCohort;
  label: string;
  minAge: number;
  maxAge: number;
  /** ТК РФ ст. 94: не более 4 часов в день для 14–15, 5 часов для 16–17. */
  maxHoursPerDay: number;
  /** ТК РФ ст. 94: не более 24 часов в неделю для 14–15, 35 часов для 16–17. */
  maxHoursPerWeek: number;
  /** Ночные смены (после 22:00 / до 06:00) несовершеннолетним запрещены. */
  allowNightShift: boolean;
  /** Требуется письменное согласие родителя (законного представителя). */
  requiresParentConsent: boolean;
  /** Работа в учебное время требует разрешения администрации школы. */
  requiresSchoolPermit: boolean;
}

export const COHORT_RULES: Record<AgeCohort, CohortRule> = {
  '14_15': {
    cohort: '14_15',
    label: '14–15 лет',
    minAge: 14,
    maxAge: 15,
    maxHoursPerDay: 4,
    maxHoursPerWeek: 24,
    allowNightShift: false,
    requiresParentConsent: true,
    requiresSchoolPermit: true,
  },
  '16_17': {
    cohort: '16_17',
    label: '16–17 лет',
    minAge: 16,
    maxAge: 17,
    maxHoursPerDay: 5,
    maxHoursPerWeek: 35,
    allowNightShift: false,
    requiresParentConsent: true,
    requiresSchoolPermit: false,
  },
  '18': {
    cohort: '18',
    label: '18 лет',
    minAge: 18,
    maxAge: 120,
    maxHoursPerDay: 8,
    maxHoursPerWeek: 40,
    allowNightShift: true,
    requiresParentConsent: false,
    requiresSchoolPermit: false,
  },
};

export function ageFromBirthDate(birthDate: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

export function cohortForAge(age: number): AgeCohort {
  if (age <= 15) return '14_15';
  if (age <= 17) return '16_17';
  return '18';
}

export function cohortFromBirthDate(birthDate: Date, now: Date = new Date()): AgeCohort {
  return cohortForAge(ageFromBirthDate(birthDate, now));
}

export function cohortRule(cohort: AgeCohort): CohortRule {
  return COHORT_RULES[cohort];
}

/** Когорта «младших» подростков для указанного минимального возраста. */
export function cohortForMinAge(minAge: number): AgeCohort {
  if (minAge <= 15) return '14_15';
  if (minAge <= 17) return '16_17';
  return '18';
}

export function isValidMinAge(minAge: number): minAge is MinAgeOption {
  return (MIN_AGE_OPTIONS as readonly number[]).includes(minAge);
}

/** Форматирование «ЧЧ:ММ» в минуты от начала суток. */
export function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export const NIGHT_SHIFT_START_HOUR = 22;
export const NIGHT_SHIFT_END_HOUR = 6;

/**
 * Ночная смена (ТК РФ ст. 95): начало смены приходится на время с 22:00 до 06:00
 * либо смена переходит через полночь (например, 20:00–02:00).
 */
export function isNightShift(start: string | null | undefined, end: string | null | undefined): boolean {
  if (!start || !end) return false;
  const startMin = parseTimeToMinutes(start);
  const endMin = parseTimeToMinutes(end);
  if (startMin === null || endMin === null) return false;
  const nightStart = NIGHT_SHIFT_START_HOUR * 60;
  const nightEnd = NIGHT_SHIFT_END_HOUR * 60;
  if (startMin === endMin) return false;

  // Смена через полночь — всегда ночная.
  if (endMin <= startMin) return true;

  // Начало смены попадает в ночное окно (22:00–06:00).
  if (startMin >= nightStart || startMin < nightEnd) return true;

  // Смена заканчивается в ночное окно.
  return endMin <= nightEnd;
}

/** Длительность смены в часах (учитывая переход через полночь). */
export function shiftDurationHours(start: string | null | undefined, end: string | null | undefined): number | null {
  if (!start || !end) return null;
  const startMin = parseTimeToMinutes(start);
  const endMin = parseTimeToMinutes(end);
  if (startMin === null || endMin === null) return null;
  const raw = endMin - startMin;
  const minutes = raw <= 0 ? raw + 24 * 60 : raw;
  return Math.round((minutes / 60) * 100) / 100;
}
