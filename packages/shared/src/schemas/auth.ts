import { z } from 'zod';
import { MIN_AGE_OPTIONS } from '../domain/age.js';

/** Российский номер телефона в нормализованном виде: +7XXXXXXXXXX. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s\-()]/g, ''))
  .refine((value) => /^(\+7|8|7)\d{10}$/.test(value), {
    error: 'Введите корректный номер телефона',
  })
  .transform((value) => {
    const digits = value.replace(/\D/g, '');
    return `+7${digits.slice(-10)}`;
  });

/** ИНН: 10 цифр (юрлицо/ИП) или 12 цифр (физлицо). */
export const innSchema = z
  .string()
  .trim()
  .regex(/^(\d{10}|\d{12})$/, { error: 'ИНН должен содержать 10 или 12 цифр' });

export const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Дата рождения в формате ГГГГ-ММ-ДД' })
  .refine((value) => {
    const date = new Date(value + 'T00:00:00Z');
    return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
  }, { error: 'Некорректная дата рождения' });

const fullNameSchema = z
  .string()
  .trim()
  .min(2, { error: 'Укажите имя' })
  .max(80, { error: 'Слишком длинное имя' });

const baseRegister = {
  phone: phoneSchema,
  fullName: fullNameSchema,
};

export const teenRegisterSchema = z.object({
  ...baseRegister,
  role: z.literal('teen'),
  birthDate: birthDateSchema,
});

export const businessRegisterSchema = z.object({
  ...baseRegister,
  role: z.literal('business'),
  companyName: z.string().trim().min(2).max(120),
  inn: innSchema,
});

export const individualRegisterSchema = z.object({
  ...baseRegister,
  role: z.literal('individual'),
});

export const registerSchema = z.discriminatedUnion('role', [
  teenRegisterSchema,
  businessRegisterSchema,
  individualRegisterSchema,
]);

export const loginSchema = z.object({
  phone: phoneSchema,
});

export const otpSchema = z.object({
  phone: phoneSchema,
  code: z.string().trim().regex(/^\d{6}$/, { error: 'Код состоит из 6 цифр' }),
});

export const phoneSchemaOnly = z.object({ phone: phoneSchema });

export type TeenRegisterInput = z.infer<typeof teenRegisterSchema>;
export type BusinessRegisterInput = z.infer<typeof businessRegisterSchema>;
export type IndividualRegisterInput = z.infer<typeof individualRegisterSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OtpInput = z.infer<typeof otpSchema>;

export const MIN_AGE_ENUM = z.union([
  z.literal(MIN_AGE_OPTIONS[0]),
  z.literal(MIN_AGE_OPTIONS[1]),
  z.literal(MIN_AGE_OPTIONS[2]),
]);
