import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const ctfCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  source: z.enum(['UNSTOP', 'CTFTIME', 'MANUAL']),
  sourceUrl: z
    .union([z.string().url('Invalid URL'), z.literal(''), z.undefined()])
    .transform((v) => (v === '' ? undefined : v)),
  ctfUrl: z
    .union([z.string().url('Invalid URL'), z.literal(''), z.undefined()])
    .transform((v) => (v === '' ? undefined : v)),
  startAt: z.string().min(1, 'Start date is required'),
  endAt: z.string().min(1, 'End date is required'),
  registrationDeadline: z
    .union([z.string(), z.literal(''), z.undefined()])
    .transform((v) => (v === '' ? undefined : v)),
  teamSize: z
    .union([z.number().int().min(1).max(100), z.null(), z.undefined()])
    .transform((v) => (v == null ? undefined : v)),
  description: z.string().max(5000, 'Description too long').optional(),
}).refine(
  (data) => {
    if (!data.startAt || !data.endAt) return true
    return new Date(data.endAt) > new Date(data.startAt)
  },
  { message: 'End date must be after start date', path: ['endAt'] }
)

export const attendanceSchema = z.object({
  status: z.enum(['ATTENDING', 'MAYBE', 'NOT_ATTENDING', 'NO_RESPONSE']),
})

export const memberCreateSchema = z.object({
  memberNumber: z.number().int().min(0).max(6),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
})

export const memberUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z
    .union([z.string().min(8), z.literal(''), z.undefined()])
    .transform((v) => (v === '' ? undefined : v)),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
})

export const aiExtractSchema = z.object({
  text: z.string().min(10, 'Text too short').max(5000, 'Text too long'),
})
