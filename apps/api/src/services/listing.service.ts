import { and, asc, desc, eq, gte, or, sql, type SQL } from 'drizzle-orm';
import { applications, getDb, listings, newId, nowIso } from '@teenwork/db';
import type { ListingRow } from '@teenwork/db';
import type {
  CreateListingInput,
  EmployerContext,
  ListingQuery,
  ListingWithComplianceDTO,
  UserRole,
} from '@teenwork/shared';
import { evaluateListing, haversineKm, summarizeReport } from '@teenwork/shared';
import { unprocessable } from '../lib/errors.js';
import { toListingDTO } from '../lib/dto.js';
import { likePattern } from '../lib/sql.js';
import { employerProfilesByIds, usersByIds } from './user.service.js';

const db = getDb();

export interface ListingViewOptions {
  /** Кто смотрит: свои объявления показываем в любом статусе. */
  viewer?: { id: string; role: UserRole } | null;
  status?: ListingRow['status'];
}

async function applicationsCountByListing(listingIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (listingIds.length === 0) return map;
  const rows = await db
    .select({
      listingId: applications.listingId,
      count: sql<number>`count(*)`,
    })
    .from(applications)
    .where(sql`${applications.listingId} in ${listingIds}`)
    .groupBy(applications.listingId);
  for (const row of rows) map.set(row.listingId, Number(row.count));
  return map;
}

export async function listListings(
  query: ListingQuery,
  options: ListingViewOptions = {},
): Promise<ListingWithComplianceDTO[]> {
  const conditions: SQL[] = [];

  if (options.status) {
    conditions.push(eq(listings.status, options.status));
  } else if (options.viewer?.role === 'admin') {
    // Админ видит все объявления.
  } else if (options.viewer && options.viewer.role !== 'teen') {
    conditions.push(or(eq(listings.status, 'active'), eq(listings.employerId, options.viewer.id))!);
  } else {
    conditions.push(eq(listings.status, 'active'));
  }

  if (query.type) conditions.push(eq(listings.type, query.type));
  if (query.categoryId) conditions.push(eq(listings.categoryId, query.categoryId));
  if (query.format) conditions.push(eq(listings.format, query.format));
  if (query.paymentType) conditions.push(eq(listings.paymentType, query.paymentType));
  if (query.minAge) conditions.push(gte(listings.minAge, query.minAge));
  if (query.paymentFrom) conditions.push(gte(listings.paymentAmount, query.paymentFrom));
  if (query.q) {
    // Ввод пользователя экранируется: «%» и «_» не должны работать как wildcards.
    const pattern = likePattern(query.q.toLowerCase());
    conditions.push(
      or(
        sql`lower(${listings.title}) like ${pattern} escape '\\'`,
        sql`lower(${listings.description}) like ${pattern} escape '\\'`,
      )!,
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const orderBy =
    query.sort === 'payment_desc'
      ? desc(listings.paymentAmount)
      : query.sort === 'payment_asc'
        ? asc(listings.paymentAmount)
        : desc(listings.createdAt);

  const needDistance =
    query.radiusKm !== undefined && query.lat !== undefined && query.lng !== undefined;

  // При радиусном фильтре подтягиваем больше строк и режем по расстоянию после расчёта.
  const fetchLimit = needDistance ? Math.min(query.limit * 4, 400) : query.limit;

  const rows = await db
    .select()
    .from(listings)
    .where(where)
    .orderBy(orderBy)
    .limit(fetchLimit)
    .offset(query.offset ?? 0);

  const employerIds = rows.map((row) => row.employerId);
  const [employerUsers, employerProfiles, counts] = await Promise.all([
    usersByIds(employerIds),
    employerProfilesByIds(employerIds),
    applicationsCountByListing(rows.map((row) => row.id)),
  ]);

  let result = rows.map((row) => {
    const employerUser = employerUsers.get(row.employerId);
    const employer = employerUser
      ? {
          id: employerUser.id,
          fullName: employerUser.fullName,
          companyName: employerProfiles.get(row.employerId)?.companyName ?? null,
          isBusiness: employerUser.role === 'business',
          isVerified: employerUser.isVerified,
          verificationStatus: employerProfiles.get(row.employerId)?.verificationStatus ?? 'none',
          rating: employerUser.rating,
          ratingCount: employerUser.ratingCount,
          createdAt: employerUser.createdAt,
        }
      : {
          id: row.employerId,
          fullName: 'Заказчик',
          companyName: null,
          isBusiness: false,
          isVerified: false,
          verificationStatus: 'none' as const,
          rating: 0,
          ratingCount: 0,
          createdAt: row.createdAt,
        };

    let distanceKm: number | null = null;
    if (row.locationLat !== null && row.locationLng !== null && query.lat !== undefined && query.lng !== undefined) {
      distanceKm =
        Math.round(haversineKm({ lat: query.lat, lng: query.lng }, { lat: row.locationLat, lng: row.locationLng }) * 10) /
        10;
    }

    const dto = toListingDTO(row, employer, {
      distanceKm,
      applicationsCount: counts.get(row.id) ?? 0,
    });

    return { ...dto, compliance: emptyCompliance() };
  });

  if (needDistance) {
    result = result
      .filter((item) => item.distanceKm !== null && item.distanceKm <= (query.radiusKm ?? Infinity))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      .slice(0, query.limit);
  } else if (query.sort === 'distance') {
    result = result.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }

  return result;
}

function emptyCompliance() {
  return { violations: [], blocked: false, needsModeration: false, suggestions: {} };
}

export async function getListingById(
  id: string,
  viewer?: { id: string; role: UserRole } | null,
): Promise<ListingWithComplianceDTO | undefined> {
  const row = (await db.select().from(listings).where(eq(listings.id, id)).limit(1))[0];
  if (!row) return undefined;

  const isOwner = viewer?.id === row.employerId;
  if (row.status !== 'active' && !isOwner && viewer?.role !== 'admin') return undefined;

  const [employerUser] = await usersByIds([row.employerId]).then((m) => [m.get(row.employerId)]);
  const employerProfile = (await employerProfilesByIds([row.employerId])).get(row.employerId);
  const counts = await applicationsCountByListing([row.id]);

  const employer = employerUser
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
        id: row.employerId,
        fullName: 'Заказчик',
        companyName: null,
        isBusiness: false,
        isVerified: false,
        verificationStatus: 'none' as const,
        rating: 0,
        ratingCount: 0,
        createdAt: row.createdAt,
      };

  const compliance = isOwner || viewer?.role === 'admin' ? await buildCompliance(row) : emptyCompliance();

  return {
    ...toListingDTO(row, employer, { applicationsCount: counts.get(row.id) ?? 0 }),
    compliance,
  };
}

/** Пересчитывает проверку объявления по текущим правилам. */
export async function buildCompliance(row: ListingRow) {
  const profile = (await employerProfilesByIds([row.employerId])).get(row.employerId);
  const employerUser = (await usersByIds([row.employerId])).get(row.employerId);

  const context: EmployerContext = {
    role: employerUser?.role ?? 'individual',
    verificationStatus: profile?.verificationStatus ?? 'none',
  };

  const report = evaluateListing(
    {
      type: row.type,
      categoryId: row.categoryId,
      title: row.title,
      description: row.description,
      minAge: row.minAge,
      format: row.format,
      paymentAmount: row.paymentAmount,
      paymentType: row.paymentType,
      maxHoursPerDay: row.maxHoursPerDay,
      shiftStart: row.shiftStart,
      shiftEnd: row.shiftEnd,
      worksDuringStudyTime: row.worksDuringStudyTime,
      locationType: row.locationType,
      locationAddress: row.locationAddress,
      hasSeniorSupervisor: row.hasSeniorSupervisor,
      handlesCash: row.handlesCash,
    },
    context,
  );

  return { ...report, summary: summarizeReport(report) };
}

export interface CreateListingResult {
  listing: ListingWithComplianceDTO;
  complianceSummary: string;
}

/** Контекст работодателя: роль + статус верификации + его id. */
export type EmployerContextWithId = EmployerContext & { userId: string };

export async function createListing(
  input: CreateListingInput,
  context: EmployerContextWithId,
): Promise<CreateListingResult> {
  const draft = {
    type: input.type,
    categoryId: input.categoryId,
    title: input.title,
    description: input.description,
    minAge: input.minAge,
    format: input.format,
    paymentAmount: input.paymentAmount,
    paymentType: input.paymentType,
    maxHoursPerDay: input.maxHoursPerDay,
    shiftStart: input.shiftStart,
    shiftEnd: input.shiftEnd,
    worksDuringStudyTime: input.worksDuringStudyTime,
    locationType: input.locationType ?? (input.format === 'online' ? 'online' : 'workplace'),
    locationAddress: input.locationAddress,
    hasSeniorSupervisor: input.hasSeniorSupervisor,
    handlesCash: input.handlesCash,
  };

  const report = evaluateListing(draft, context);

  if (report.blocked) {
    throw unprocessable('Объявление не прошло проверку безопасности', {
      violations: report.violations,
      suggestions: report.suggestions,
    });
  }

  const timestamp = nowIso();
  const id = newId();
  const status = report.needsModeration ? 'moderation' : 'active';

  await db.insert(listings).values({
    id,
    employerId: context.userId,
    type: input.type,
    categoryId: input.categoryId,
    title: input.title,
    description: input.description,
    minAge: input.minAge,
    format: input.format,
    paymentAmount: input.paymentAmount,
    paymentType: input.paymentType,
    maxHoursPerDay: input.maxHoursPerDay,
    shiftStart: input.shiftStart ?? null,
    shiftEnd: input.shiftEnd ?? null,
    worksDuringStudyTime: input.worksDuringStudyTime ?? false,
    locationType: draft.locationType,
    locationAddress: input.locationAddress ?? null,
    locationLat: input.locationLat ?? null,
    locationLng: input.locationLng ?? null,
    hasSeniorSupervisor: input.hasSeniorSupervisor ?? false,
    handlesCash: input.handlesCash ?? false,
    status,
    publishedAt: status === 'active' ? timestamp : null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  // Объявление может уйти в модерацию — автор всё равно должен видеть свою карточку.
  const listing = await getListingById(id, { id: context.userId, role: context.role });
  if (!listing) throw unprocessable('Не удалось создать объявление');

  return { listing, complianceSummary: summarizeReport(report) };
}
