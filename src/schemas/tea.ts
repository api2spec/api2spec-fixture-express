import { z } from 'zod'

// Enums
export const TeaTypeSchema = z.enum([
  'green',
  'black',
  'oolong',
  'white',
  'puerh',
  'herbal',
  'rooibos',
])

export const CaffeineLevelSchema = z.enum(['none', 'low', 'medium', 'high'])

// Main entity
export const TeaSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: TeaTypeSchema,
  origin: z.string().max(100).optional(),
  caffeineLevel: CaffeineLevelSchema,
  steepTempCelsius: z.number().int().min(60).max(100),
  steepTimeSeconds: z.number().int().positive().max(600),
  description: z.string().max(1000).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// POST /teas
export const CreateTeaSchema = z.object({
  name: z.string().min(1).max(100),
  type: TeaTypeSchema,
  origin: z.string().max(100).optional(),
  caffeineLevel: CaffeineLevelSchema.default('medium'),
  steepTempCelsius: z.number().int().min(60).max(100),
  steepTimeSeconds: z.number().int().positive().max(600),
  description: z.string().max(1000).nullable().default(null),
})

// PUT /teas/:id
export const UpdateTeaSchema = z.object({
  name: z.string().min(1).max(100),
  type: TeaTypeSchema,
  origin: z.string().max(100).optional(),
  caffeineLevel: CaffeineLevelSchema,
  steepTempCelsius: z.number().int().min(60).max(100),
  steepTimeSeconds: z.number().int().positive().max(600),
  description: z.string().max(1000).nullable(),
})

// PATCH /teas/:id
export const PatchTeaSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: TeaTypeSchema.optional(),
  origin: z.string().max(100).optional(),
  caffeineLevel: CaffeineLevelSchema.optional(),
  steepTempCelsius: z.number().int().min(60).max(100).optional(),
  steepTimeSeconds: z.number().int().positive().max(600).optional(),
  description: z.string().max(1000).nullable().optional(),
})

// Query params
export const TeaQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: TeaTypeSchema.optional(),
  caffeineLevel: CaffeineLevelSchema.optional(),
})

// Type exports
export type TeaType = z.infer<typeof TeaTypeSchema>
export type CaffeineLevel = z.infer<typeof CaffeineLevelSchema>
export type Tea = z.infer<typeof TeaSchema>
export type CreateTea = z.infer<typeof CreateTeaSchema>
export type UpdateTea = z.infer<typeof UpdateTeaSchema>
export type PatchTea = z.infer<typeof PatchTeaSchema>
export type TeaQuery = z.infer<typeof TeaQuerySchema>
