/**
 * Роли пользователей платформы.
 */
export const USER_ROLES = ['teen', 'business', 'individual', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  teen: 'Соискатель',
  business: 'Бизнес-заказчик',
  individual: 'Частный заказчик',
  admin: 'Модератор',
};

/** Роли, которые могут создавать объявления. */
export const EMPLOYER_ROLES = ['business', 'individual', 'admin'] as const satisfies readonly UserRole[];
export type EmployerRole = (typeof EMPLOYER_ROLES)[number];

export function isEmployerRole(role: UserRole): role is EmployerRole {
  return (EMPLOYER_ROLES as readonly UserRole[]).includes(role);
}

/** Частный заказчик (физлицо) — это всегда «individual». */
export function isIndividualEmployer(role: UserRole): boolean {
  return role === 'individual';
}
