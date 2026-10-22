import { z } from 'zod';
import { SKILL_IDS } from '../domain/skills.js';

export const applicationStatusSchema = z.enum(['pending', 'accepted', 'completed', 'rejected', 'cancelled']);
export const applicationCreateSchema = z.object({
  listingId: z.string().uuid(),
  message: z.string().trim().max(1000).optional(),
});

export const applicationUpdateSchema = z.object({
  status: applicationStatusSchema,
});

export const reviewCreateSchema = z.object({
  applicationId: z.string().uuid(),
  score: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
  badges: z.array(z.enum(SKILL_IDS as [string, ...string[]])).max(3).optional(),
});

export const messageCreateSchema = z.object({
  body: z.string().trim().min(1, { error: 'Сообщение не может быть пустым' }).max(2000),
});

export const reportCreateSchema = z.object({
  targetType: z.enum(['listing', 'user', 'message']),
  targetId: z.string().uuid(),
  reason: z.string().trim().min(3, { error: 'Опишите причину жалобы' }).max(1000),
  /** Экстренная жалоба — «Позвать взрослого». */
  urgent: z.coerce.boolean().optional().default(false),
});

export const teenProfileUpdateSchema = z.object({
  bio: z.string().trim().max(500).optional(),
  skills: z.array(z.enum(SKILL_IDS as [string, ...string[]])).max(12).optional(),
  schoolType: z.enum(['school', 'college', 'gymnasium']).optional(),
  schoolShift: z.string().trim().max(40).optional(),
  availableHours: z.array(z.object({ from: z.string(), to: z.string() })).max(5).optional(),
  radiusKm: z.coerce.number().min(0.5).max(50).optional(),
  locationLat: z.coerce.number().min(-90).max(90).nullish(),
  locationLng: z.coerce.number().min(-180).max(180).nullish(),
  parentConsentUploaded: z.coerce.boolean().optional(),
  isSelfEmployed: z.coerce.boolean().optional(),
});

export const employerProfileUpdateSchema = z.object({
  companyName: z.string().trim().min(2).max(120).optional(),
  inn: z.string().trim().regex(/^(\d{10}|\d{12})$/).optional(),
  description: z.string().trim().max(2000).optional(),
  website: z.string().trim().url().max(200).optional(),
});

export const adminUserSearchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
});

export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;
export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
export type MessageCreateInput = z.infer<typeof messageCreateSchema>;
export type ReportCreateInput = z.infer<typeof reportCreateSchema>;
export type TeenProfileUpdateInput = z.infer<typeof teenProfileUpdateSchema>;
export type EmployerProfileUpdateInput = z.infer<typeof employerProfileUpdateSchema>;
