import { and, eq, inArray } from 'drizzle-orm';
import { employerProfiles, getDb, teenProfiles, users } from '@teenwork/db';
import type { EmployerProfileRow, TeenProfileRow, UserRow } from '@teenwork/db';
import type { AuthResponse } from '@teenwork/shared';
import { forbidden } from '../lib/errors.js';
import { toEmployerProfileDTO, toTeenProfileDTO, toUserDTO } from '../lib/dto.js';

const db = getDb();

export async function getUserById(id: string): Promise<UserRow | undefined> {
  return (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
}

export async function getUserByPhone(phone: string): Promise<UserRow | undefined> {
  return (await db.select().from(users).where(eq(users.phone, phone)).limit(1))[0];
}

export async function getTeenProfile(userId: string): Promise<TeenProfileRow | undefined> {
  return (await db.select().from(teenProfiles).where(eq(teenProfiles.userId, userId)).limit(1))[0];
}

export async function getEmployerProfile(userId: string): Promise<EmployerProfileRow | undefined> {
  return (
    await db.select().from(employerProfiles).where(eq(employerProfiles.userId, userId)).limit(1)
  )[0];
}

/** Полные данные текущего пользователя: аккаунт + профиль по роли. */
export async function getAuthPayload(userId: string): Promise<AuthResponse | null> {
  const user = await getUserById(userId);
  if (!user) return null;

  const result: AuthResponse = {
    user: toUserDTO(user),
    teenProfile: null,
    employerProfile: null,
  };

  if (user.role === 'teen') {
    const profile = await getTeenProfile(userId);
    if (profile) result.teenProfile = toTeenProfileDTO(profile, user);
  } else if (user.role === 'business' || user.role === 'individual') {
    const profile = await getEmployerProfile(userId);
    if (profile) result.employerProfile = toEmployerProfileDTO(profile);
  }

  return result;
}

/** Проверка, что пользователь — подросток. */
export function assertTeen(user: UserRow): void {
  if (user.role !== 'teen') {
    throw forbidden('Действие доступно только соискателям', 'teen_only');
  }
}

/** Блокировка «не может быть работодателем» — единая проверка ролей. */
export function isEmployerRoleValue(role: UserRow['role']): boolean {
  return role === 'business' || role === 'individual' || role === 'admin';
}

export async function usersByIds(ids: string[]): Promise<Map<string, UserRow>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const rows = await db.select().from(users).where(inArray(users.id, unique));
  const map = new Map<string, UserRow>();
  for (const row of rows) map.set(row.id, row);
  return map;
}

export async function employerProfilesByIds(
  ids: string[],
): Promise<Map<string, EmployerProfileRow>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const rows = await db
    .select()
    .from(employerProfiles)
    .where(inArray(employerProfiles.userId, unique));
  const map = new Map<string, EmployerProfileRow>();
  for (const row of rows) map.set(row.userId, row);
  return map;
}
