import { and, desc, eq, sql } from 'drizzle-orm';
import { applications, getDb, listings, messages, newId, nowIso, teenProfiles, users } from '@teenwork/db';
import type { ApplicationRow, ListingRow, UserRow } from '@teenwork/db';
import type {
  AgeCohort,
  ApplicationDTO,
  ApplicationStatus,
  EmployerCardDTO,
} from '@teenwork/shared';
import { cohortForMinAge, cohortFromBirthDate } from '@teenwork/shared';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors.js';
import { employerProfilesByIds, usersByIds } from './user.service.js';
import { createNotification } from './notification.service.js';

const db = getDb();

const COHORT_RANK: Record<AgeCohort, number> = { '14_15': 1, '16_17': 2, '18': 3 };

export function ageSatisfies(cohort: AgeCohort, minAge: number): boolean {
  return COHORT_RANK[cohort] >= COHORT_RANK[cohortForMinAge(minAge)];
}

export async function getListingRow(id: string): Promise<ListingRow | undefined> {
  return (await db.select().from(listings).where(eq(listings.id, id)).limit(1))[0];
}

export async function getApplication(id: string): Promise<ApplicationRow | undefined> {
  return (await db.select().from(applications).where(eq(applications.id, id)).limit(1))[0];
}

/** Отклик подростка на объявление. */
export async function applyToListing(
  listingId: string,
  teen: UserRow,
  message?: string,
): Promise<ApplicationDTO> {
  const listing = await getListingRow(listingId);
  if (!listing) throw notFound('Объявление не найдено');
  if (listing.status !== 'active') throw badRequest('Объявление больше не принимает отклики');

  const profile = (
    await db.select().from(teenProfiles).where(eq(teenProfiles.userId, teen.id)).limit(1)
  )[0];
  const cohort =
    profile?.ageCohort ??
    cohortFromBirthDate(teen.birthDate ? new Date(teen.birthDate) : new Date());

  if (!ageSatisfies(cohort, listing.minAge)) {
    throw forbidden(
      `Это объявление доступно только с ${listing.minAge} лет. Ваша возрастная группа — ${cohort === '14_15' ? '14–15' : cohort === '16_17' ? '16–17' : '18'} лет.`,
      'age_restricted',
    );
  }

  const existing = (
    await db
      .select()
      .from(applications)
      .where(and(eq(applications.listingId, listingId), eq(applications.teenId, teen.id)))
      .limit(1)
  )[0];
  if (existing) throw conflict('Вы уже откликнулись на это объявление', 'already_applied');

  const timestamp = nowIso();
  const id = newId();

  await db.insert(applications).values({
    id,
    listingId,
    teenId: teen.id,
    status: 'pending',
    message: message ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await createNotification(listing.employerId, 'application_created', {
    applicationId: id,
    listingId,
    listingTitle: listing.title,
    teenName: teen.fullName,
  });

  const dto = await getApplicationDTO(id);
  if (!dto) throw notFound('Отклик не найден');
  return dto;
}

/** Загрузка отклика с проверкой, что пользователь — его участник. */
export async function getApplicationForParticipant(
  applicationId: string,
  userId: string,
): Promise<{ application: ApplicationRow; listing: ListingRow }> {
  const application = await getApplication(applicationId);
  if (!application) throw notFound('Отклик не найден');
  const listing = await getListingRow(application.listingId);
  if (!listing) throw notFound('Объявление не найдено');

  const isParticipant = application.teenId === userId || listing.employerId === userId;
  if (!isParticipant) throw forbidden('Этот отклик вам не доступен');

  return { application, listing };
}

export async function getApplicationDTO(id: string): Promise<ApplicationDTO | undefined> {
  const application = await getApplication(id);
  if (!application) return undefined;

  const listing = await getListingRow(application.listingId);
  if (!listing) return undefined;

  const [teenUser] = await usersByIds([application.teenId]).then((m) => [m.get(application.teenId)]);
  const profile = (
    await db.select().from(teenProfiles).where(eq(teenProfiles.userId, application.teenId)).limit(1)
  )[0];
  const employerUser = (await usersByIds([listing.employerId])).get(listing.employerId);
  const employerProfile = (await employerProfilesByIds([listing.employerId])).get(listing.employerId);

  const employer: EmployerCardDTO = employerUser
    ? {
        id: employerUser.id,
        fullName: employerUser.fullName,
        companyName: employerProfile?.companyName ?? null,
        isBusiness: employerUser.role === 'business',
        isVerified: employerUser.isVerified,
        verificationStatus: employerProfile?.verificationStatus ?? 'none',
        rating: employerUser.rating,
        ratingCount: employerUser.ratingCount,
        createdAt: employerUser.createdAt,
      }
    : {
        id: listing.employerId,
        fullName: 'Заказчик',
        companyName: null,
        isBusiness: false,
        isVerified: false,
        verificationStatus: 'none',
        rating: 0,
        ratingCount: 0,
        createdAt: listing.createdAt,
      };

  const unread = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(
      and(
        eq(messages.applicationId, application.id),
        sql`${messages.readAt} is null`,
        sql`${messages.senderId} != ${employer.id}`,
      ),
    );

  return {
    id: application.id,
    listingId: application.listingId,
    listingTitle: listing.title,
    listingType: listing.type,
    paymentAmount: listing.paymentAmount,
    paymentType: listing.paymentType,
    status: application.status,
    message: application.message,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    teen: {
      id: application.teenId,
      fullName: teenUser?.fullName ?? 'Соискатель',
      rating: teenUser?.rating ?? 0,
      ratingCount: teenUser?.ratingCount ?? 0,
      badges: profile ? (profile.completedGigs >= 1 ? ['first_job'] : []) : [],
      ageCohort: profile?.ageCohort ?? null,
      skills: profile?.skills ?? [],
      parentConsentUploaded: profile?.parentConsentUploaded ?? false,
    },
    employer,
    unreadMessages: Number(unread[0]?.count ?? 0),
  };
}

/** Все отклики текущего пользователя. */
export async function listApplicationsForUser(user: UserRow): Promise<ApplicationDTO[]> {
  const rows =
    user.role === 'teen'
      ? await db
          .select()
          .from(applications)
          .where(eq(applications.teenId, user.id))
          .orderBy(desc(applications.createdAt))
      : await db
          .select({ application: applications })
          .from(applications)
          .innerJoin(listings, eq(listings.id, applications.listingId))
          .where(eq(listings.employerId, user.id))
          .orderBy(desc(applications.createdAt));

  const ids = rows.map((row) => ('application' in row ? row.application.id : row.id));
  const result: ApplicationDTO[] = [];
  for (const id of ids) {
    const dto = await getApplicationDTO(id);
    if (dto) result.push(dto);
  }
  return result;
}

/** Смена статуса отклика. */
export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  actor: UserRow,
): Promise<ApplicationDTO> {
  const { application, listing } = await getApplicationForParticipant(applicationId, actor.id);

  if (actor.id === listing.employerId) {
    if (!['accepted', 'rejected', 'completed'].includes(status)) {
      throw badRequest('Работодатель может принять, отклонить или завершить отклик');
    }
  } else {
    if (status !== 'cancelled') {
      throw badRequest('Соискатель может только отменить свой отклик');
    }
    if (application.status === 'completed') {
      throw badRequest('Завершённый отклик нельзя отменить');
    }
  }

  const timestamp = nowIso();
  await db
    .update(applications)
    .set({ status, updatedAt: timestamp })
    .where(eq(applications.id, applicationId));

  if (status === 'accepted' || status === 'rejected' || status === 'completed') {
    const recipientId = actor.id === listing.employerId ? application.teenId : listing.employerId;
    await createNotification(recipientId, 'application_status', {
      applicationId,
      listingTitle: listing.title,
      status,
    });
  }

  const dto = await getApplicationDTO(applicationId);
  if (!dto) throw notFound('Отклик не найден');
  return dto;
}

/** Пересчёт прогресса подростка (количество выполненных заданий). */
export async function incrementCompletedGigs(teenId: string): Promise<void> {
  await db
    .update(teenProfiles)
    .set({ completedGigs: sql`${teenProfiles.completedGigs} + 1`, updatedAt: nowIso() })
    .where(eq(teenProfiles.userId, teenId));
}
