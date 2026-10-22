/**
 * DTO-модели, общие для API и веб-клиента.
 */
import type { AgeCohort } from './domain/age.js';
import type { LocationType } from './domain/categories.js';
import type { ComplianceReport } from './domain/compliance.js';
import type { UserRole } from './domain/roles.js';

export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type ListingStatus = 'moderation' | 'active' | 'closed' | 'blocked';
export type ListingType = 'vacancy' | 'gig';
export type ListingFormat = 'online' | 'offline';
export type PaymentType = 'per_hour' | 'per_month' | 'fixed_task';
export type ApplicationStatus =
  | 'pending'
  | 'accepted'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface UserDTO {
  id: string;
  role: UserRole;
  phone: string;
  fullName: string;
  birthDate: string | null;
  isVerified: boolean;
  rating: number;
  ratingCount: number;
  createdAt: string;
}

export interface TeenProfileDTO {
  userId: string;
  ageCohort: AgeCohort;
  age: number;
  skills: string[];
  bio: string | null;
  schoolType: string | null;
  schoolShift: string | null;
  availableHours: { from: string; to: string }[];
  radiusKm: number;
  parentConsentUploaded: boolean;
  isSelfEmployed: boolean;
  badges: string[];
  completedGigs: number;
  reviewsCount: number;
  averageRating: number;
}

export interface EmployerProfileDTO {
  userId: string;
  companyName: string | null;
  inn: string | null;
  verificationStatus: VerificationStatus;
  description: string | null;
  website: string | null;
  isBusiness: boolean;
}

export interface EmployerCardDTO {
  id: string;
  fullName: string;
  companyName: string | null;
  isBusiness: boolean;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  rating: number;
  ratingCount: number;
  createdAt: string;
}

export interface ListingDTO {
  id: string;
  type: ListingType;
  categoryId: string;
  categoryTitle: string;
  title: string;
  description: string;
  minAge: number;
  format: ListingFormat;
  paymentAmount: number;
  paymentType: PaymentType;
  maxHoursPerDay: number;
  shiftStart: string | null;
  shiftEnd: string | null;
  worksDuringStudyTime: boolean;
  locationType: LocationType;
  locationAddress: string | null;
  locationLat: number | null;
  locationLng: number | null;
  status: ListingStatus;
  createdAt: string;
  publishedAt: string | null;
  employer: EmployerCardDTO;
  distanceKm: number | null;
  applicationsCount: number;
}

export interface ListingWithComplianceDTO extends ListingDTO {
  compliance: ComplianceReport;
}

export interface ApplicationDTO {
  id: string;
  listingId: string;
  listingTitle: string;
  listingType: ListingType;
  paymentAmount: number;
  paymentType: PaymentType;
  status: ApplicationStatus;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  teen: {
    id: string;
    fullName: string;
    rating: number;
    ratingCount: number;
    badges: string[];
    ageCohort: AgeCohort | null;
    skills: string[];
    parentConsentUploaded: boolean;
  };
  employer: EmployerCardDTO;
  unreadMessages: number;
}

export interface ReviewDTO {
  id: string;
  applicationId: string;
  score: number;
  comment: string | null;
  badges: string[];
  createdAt: string;
  from: { id: string; fullName: string; role: UserRole };
  to: { id: string; fullName: string; role: UserRole };
}

export interface MessageDTO {
  id: string;
  applicationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  /** Предупреждение антифрод-фильтра (внешние контакты). */
  warnings: string[];
  flagged: boolean;
}

export interface ReportDTO {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  urgent: boolean;
  status: string;
  createdAt: string;
  reporterId: string;
}

export interface NotificationDTO {
  id: string;
  type: string;
  payload: unknown;
  readAt: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuthResponse {
  user: UserDTO;
  teenProfile: TeenProfileDTO | null;
  employerProfile: EmployerProfileDTO | null;
}
