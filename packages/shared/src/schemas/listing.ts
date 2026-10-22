import { z } from 'zod';
import { CATEGORY_IDS, LOCATION_TYPES } from '../domain/categories.js';

const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: 'Время в формате ЧЧ:ММ' });

export const listingTypeSchema = z.enum(['vacancy', 'gig']);
export const listingFormatSchema = z.enum(['online', 'offline']);
export const paymentTypeSchema = z.enum(['per_hour', 'per_month', 'fixed_task']);

/** Базовая форма объявления. */
const listingBaseSchema = z.object({
  type: listingTypeSchema,
  categoryId: z.enum(CATEGORY_IDS as [string, ...string[]]),
  title: z.string().trim().min(3, { error: 'Минимум 3 символа' }).max(120),
  description: z.string().trim().min(10, { error: 'Опишите задачу подробнее' }).max(3000),
  minAge: z.union([z.literal(14), z.literal(16), z.literal(18)]),
  format: listingFormatSchema,
  paymentAmount: z.coerce.number().int().positive({ error: 'Укажите сумму' }),
  paymentType: paymentTypeSchema,
  maxHoursPerDay: z.coerce.number().int().min(1).max(24),
  shiftStart: timeSchema.nullish(),
  shiftEnd: timeSchema.nullish(),
  worksDuringStudyTime: z.coerce.boolean().optional().default(false),
  locationType: z.enum(LOCATION_TYPES).nullish(),
  locationAddress: z.string().trim().max(300).nullish(),
  hasSeniorSupervisor: z.coerce.boolean().optional().default(false),
  handlesCash: z.coerce.boolean().optional().default(false),
  locationLat: z.coerce.number().min(-90).max(90).nullish(),
  locationLng: z.coerce.number().min(-180).max(180).nullish(),
});

export const createListingSchema = listingBaseSchema.superRefine((value, ctx) => {
  if (value.shiftStart && value.shiftEnd && value.shiftStart === value.shiftEnd) {
    ctx.addIssue({
      code: 'custom',
      path: ['shiftEnd'],
      message: 'Время начала и окончания смены не может совпадать',
    });
  }
  if (value.format === 'offline' && !value.locationAddress) {
    ctx.addIssue({
      code: 'custom',
      path: ['locationAddress'],
      message: 'Укажите адрес или общественное место',
    });
  }
});

export const updateListingSchema = listingBaseSchema.partial();

export const listingQuerySchema = z.object({
  type: listingTypeSchema.optional(),
  categoryId: z.enum(CATEGORY_IDS as [string, ...string[]]).optional(),
  minAge: z.coerce.number().int().min(14).max(18).optional(),
  q: z.string().trim().max(100).optional(),
  format: listingFormatSchema.optional(),
  paymentFrom: z.coerce.number().int().optional(),
  paymentType: paymentTypeSchema.optional(),
  /** Радиус поиска, км. */
  radiusKm: z.coerce.number().min(0.5).max(50).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sort: z.enum(['new', 'payment_desc', 'payment_asc', 'distance']).optional().default('new'),
});

export const listingStatusSchema = z.enum(['moderation', 'active', 'closed', 'blocked']);

export const moderateListingSchema = z.object({
  action: z.enum(['approve', 'block', 'close']),
  reason: z.string().trim().max(500).optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingQuery = z.infer<typeof listingQuerySchema>;
/** Типы ListingType / ListingFormat / PaymentType живут в ./types.ts, чтобы не было дублей. */
