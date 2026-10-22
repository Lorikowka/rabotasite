import type {
  EmployerCardDTO,
  EmployerProfileDTO,
  ListingDTO,
  MessageDTO,
  ReviewDTO,
  TeenProfileDTO,
  UserDTO,
} from '@teenwork/shared';
import { ageFromBirthDate, computeBadges, getCategory } from '@teenwork/shared';
import type {
  EmployerProfileRow,
  ListingRow,
  MessageRow,
  ReviewRow,
  TeenProfileRow,
  UserRow,
} from '@teenwork/db';

export function toUserDTO(row: UserRow): UserDTO {
  return {
    id: row.id,
    role: row.role,
    phone: row.phone,
    fullName: row.fullName,
    birthDate: row.birthDate,
    isVerified: row.isVerified,
    rating: row.rating,
    ratingCount: row.ratingCount,
    createdAt: row.createdAt,
  };
}

export function toTeenProfileDTO(row: TeenProfileRow, user: UserRow): TeenProfileDTO {
  const age = user.birthDate ? ageFromBirthDate(new Date(user.birthDate)) : 0;
  return {
    userId: row.userId,
    ageCohort: row.ageCohort,
    age,
    skills: row.skills ?? [],
    bio: row.bio,
    schoolType: row.schoolType,
    schoolShift: row.schoolShift,
    availableHours: row.availableHours ?? [],
    radiusKm: row.radiusKm,
    parentConsentUploaded: row.parentConsentUploaded,
    isSelfEmployed: row.isSelfEmployed,
    badges: computeBadges({
      parentConsentUploaded: row.parentConsentUploaded,
      isSelfEmployed: row.isSelfEmployed,
      completedGigs: row.completedGigs,
      onTimeStreak: row.onTimeStreak,
      avgResponseMinutes: row.avgResponseMinutes,
      rating: user.rating,
      ratingCount: user.ratingCount,
    }),
    completedGigs: row.completedGigs,
    reviewsCount: user.ratingCount,
    averageRating: user.rating,
  };
}

export function toEmployerProfileDTO(row: EmployerProfileRow): EmployerProfileDTO {
  return {
    userId: row.userId,
    companyName: row.companyName,
    inn: row.inn,
    verificationStatus: row.verificationStatus,
    description: row.description,
    website: row.website,
    isBusiness: row.verificationStatus !== 'none' || Boolean(row.inn),
  };
}

export function toEmployerCardDTO(
  user: UserRow,
  profile?: EmployerProfileRow | null,
): EmployerCardDTO {
  return {
    id: user.id,
    fullName: user.fullName,
    companyName: profile?.companyName ?? null,
    isBusiness: user.role === 'business',
    isVerified: user.isVerified,
    verificationStatus: profile?.verificationStatus ?? 'none',
    rating: user.rating,
    ratingCount: user.ratingCount,
    createdAt: user.createdAt,
  };
}

export function toListingDTO(
  row: ListingRow,
  employer: EmployerCardDTO,
  options: { distanceKm?: number | null; applicationsCount?: number } = {},
): ListingDTO {
  const category = getCategory(row.categoryId);
  return {
    id: row.id,
    type: row.type,
    categoryId: row.categoryId,
    categoryTitle: category?.title ?? row.categoryId,
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
    locationLat: row.locationLat,
    locationLng: row.locationLng,
    status: row.status,
    createdAt: row.createdAt,
    publishedAt: row.publishedAt,
    employer,
    distanceKm: options.distanceKm ?? null,
    applicationsCount: options.applicationsCount ?? 0,
  };
}

export function toMessageDTO(row: MessageRow): MessageDTO {
  return {
    id: row.id,
    applicationId: row.applicationId,
    senderId: row.senderId,
    body: row.body,
    createdAt: row.createdAt,
    readAt: row.readAt,
    warnings: row.warnings ?? [],
    flagged: row.flagged,
  };
}

export function toReviewDTO(row: ReviewRow, from: UserRow, to: UserRow): ReviewDTO {
  return {
    id: row.id,
    applicationId: row.applicationId,
    score: row.score,
    comment: row.comment,
    badges: row.badges ?? [],
    createdAt: row.createdAt,
    from: { id: from.id, fullName: from.fullName, role: from.role },
    to: { id: to.id, fullName: to.fullName, role: to.role },
  };
}
