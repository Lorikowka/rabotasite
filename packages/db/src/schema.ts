import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * Схема данных платформы.
 *
 * ВАЖНО: используется диалект SQLite (локальная разработка без Docker/сервера).
 * Схема спроектирована так, чтобы перенос на PostgreSQL (старт Фазы 2) требовал
 * замены только сборщика колонок в этом файле: UUID -> uuid, timestamp -> timestamptz,
 * JSON -> jsonb, ENUM -> pgEnum. Набор таблиц, полей и связей остаётся тем же.
 */

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    role: text('role', { enum: ['teen', 'business', 'individual', 'admin'] }).notNull(),
    phone: text('phone').notNull(),
    fullName: text('full_name').notNull(),
    birthDate: text('birth_date'),
    isVerified: integer('is_verified', { mode: 'boolean' }).notNull().default(false),
    rating: real('rating').notNull().default(0),
    ratingCount: integer('rating_count').notNull().default(0),
    avatarUrl: text('avatar_url'),
    lastSeenAt: text('last_seen_at'),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    phoneUnique: uniqueIndex('users_phone_unique').on(table.phone),
    roleIdx: index('users_role_idx').on(table.role),
  }),
);

export const teenProfiles = sqliteTable('teen_profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  ageCohort: text('age_cohort', { enum: ['14_15', '16_17', '18'] }).notNull(),
  skills: text('skills', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  bio: text('bio'),
  schoolType: text('school_type'),
  schoolShift: text('school_shift'),
  availableHours: text('available_hours', { mode: 'json' })
    .$type<{ from: string; to: string }[]>()
    .notNull()
    .default(sql`'[]'`),
  radiusKm: real('radius_km').notNull().default(2),
  locationLat: real('location_lat'),
  locationLng: real('location_lng'),
  parentConsentUploaded: integer('parent_consent_uploaded', { mode: 'boolean' })
    .notNull()
    .default(false),
  isSelfEmployed: integer('is_self_employed', { mode: 'boolean' }).notNull().default(false),
  completedGigs: integer('completed_gigs').notNull().default(0),
  onTimeStreak: integer('on_time_streak').notNull().default(0),
  avgResponseMinutes: integer('avg_response_minutes').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const employerProfiles = sqliteTable('employer_profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  inn: text('inn'),
  verificationStatus: text('verification_status', {
    enum: ['none', 'pending', 'verified', 'rejected'],
  })
    .notNull()
    .default('none'),
  description: text('description'),
  website: text('website'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const listings = sqliteTable(
  'listings',
  {
    id: text('id').primaryKey(),
    employerId: text('employer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ['vacancy', 'gig'] }).notNull(),
    categoryId: text('category_id').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    minAge: integer('min_age').notNull(),
    format: text('format', { enum: ['online', 'offline'] }).notNull(),
    paymentAmount: integer('payment_amount').notNull(),
    paymentType: text('payment_type', { enum: ['per_hour', 'per_month', 'fixed_task'] }).notNull(),
    maxHoursPerDay: integer('max_hours_per_day').notNull(),
    shiftStart: text('shift_start'),
    shiftEnd: text('shift_end'),
    worksDuringStudyTime: integer('works_during_study_time', { mode: 'boolean' })
      .notNull()
      .default(false),
    locationType: text('location_type', {
      enum: ['online', 'public_place', 'workplace', 'private_place'],
    }).notNull(),
    locationAddress: text('location_address'),
    locationLat: real('location_lat'),
    locationLng: real('location_lng'),
    hasSeniorSupervisor: integer('has_senior_supervisor', { mode: 'boolean' })
      .notNull()
      .default(false),
    handlesCash: integer('handles_cash', { mode: 'boolean' }).notNull().default(false),
    status: text('status', { enum: ['moderation', 'active', 'closed', 'blocked'] })
      .notNull()
      .default('moderation'),
    moderationReason: text('moderation_reason'),
    publishedAt: text('published_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => ({
    statusTypeIdx: index('listings_status_type_idx').on(table.status, table.type),
    employerIdx: index('listings_employer_idx').on(table.employerId),
    categoryIdx: index('listings_category_idx').on(table.categoryId),
    createdIdx: index('listings_created_idx').on(table.createdAt),
  }),
);

export const applications = sqliteTable(
  'applications',
  {
    id: text('id').primaryKey(),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    teenId: text('teen_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status', {
      enum: ['pending', 'accepted', 'completed', 'rejected', 'cancelled'],
    })
      .notNull()
      .default('pending'),
    message: text('message'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => ({
    listingTeenUnique: uniqueIndex('applications_listing_teen_unique').on(
      table.listingId,
      table.teenId,
    ),
    teenIdx: index('applications_teen_idx').on(table.teenId),
    statusIdx: index('applications_status_idx').on(table.status),
  }),
);

export const reviews = sqliteTable(
  'reviews',
  {
    id: text('id').primaryKey(),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    fromUserId: text('from_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    toUserId: text('to_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    score: integer('score').notNull(),
    badges: text('badges', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
    comment: text('comment'),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    appFromUnique: uniqueIndex('reviews_application_from_unique').on(
      table.applicationId,
      table.fromUserId,
    ),
    toUserIdx: index('reviews_to_user_idx').on(table.toUserId),
  }),
);

export const messages = sqliteTable(
  'messages',
  {
    id: text('id').primaryKey(),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    senderId: text('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    warnings: text('warnings', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
    flagged: integer('flagged', { mode: 'boolean' }).notNull().default(false),
    readAt: text('read_at'),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    applicationIdx: index('messages_application_idx').on(table.applicationId),
    createdIdx: index('messages_created_idx').on(table.createdAt),
  }),
);

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  kind: text('kind', { enum: ['parent_consent', 'employment_contract', 'memo'] }).notNull(),
  payload: text('payload', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  fileName: text('file_name').notNull(),
  createdAt: text('created_at').notNull(),
});

export const reports = sqliteTable(
  'reports',
  {
    id: text('id').primaryKey(),
    reporterId: text('reporter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetType: text('target_type', { enum: ['listing', 'user', 'message'] }).notNull(),
    targetId: text('target_id').notNull(),
    reason: text('reason').notNull(),
    urgent: integer('urgent', { mode: 'boolean' }).notNull().default(false),
    status: text('status', { enum: ['new', 'reviewing', 'resolved', 'rejected'] })
      .notNull()
      .default('new'),
    resolution: text('resolution'),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    statusIdx: index('reports_status_idx').on(table.status),
    targetIdx: index('reports_target_idx').on(table.targetType, table.targetId),
  }),
);

export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    payload: text('payload', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
    readAt: text('read_at'),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    userIdx: index('notifications_user_idx').on(table.userId),
  }),
);

/** Одноразовые коды входа (OTP). В MVP код возвращается в ответе в dev-режиме. */
export const otpCodes = sqliteTable(
  'otp_codes',
  {
    id: text('id').primaryKey(),
    phone: text('phone').notNull(),
    code: text('code').notNull(),
    attempts: integer('attempts').notNull().default(0),
    consumed: integer('consumed', { mode: 'boolean' }).notNull().default(false),
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    phoneIdx: index('otp_phone_idx').on(table.phone),
  }),
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type TeenProfileRow = typeof teenProfiles.$inferSelect;
export type EmployerProfileRow = typeof employerProfiles.$inferSelect;
export type ListingRow = typeof listings.$inferSelect;
export type NewListingRow = typeof listings.$inferInsert;
export type ApplicationRow = typeof applications.$inferSelect;
export type ReviewRow = typeof reviews.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;
export type NotificationRow = typeof notifications.$inferSelect;
export type ReportRow = typeof reports.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
