import { z } from 'zod'
import { TeapotSchema } from './teapot.js'
import { TeaSchema } from './tea.js'

// Enum
export const BrewStatusSchema = z.enum([
  'preparing',
  'steeping',
  'ready',
  'served',
  'cold',
])

// Main entity
export const BrewSchema = z.object({
  id: z.string().uuid(),
  teapotId: z.string().uuid(),
  teaId: z.string().uuid(),
  status: BrewStatusSchema,
  waterTempCelsius: z.number().int().min(60).max(100),
  notes: z.string().max(500).nullable(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// With relations (for GET /brews/:id)
export const BrewWithDetailsSchema = BrewSchema.extend({
  teapot: TeapotSchema,
  tea: TeaSchema,
})

// POST /brews
export const CreateBrewSchema = z.object({
  teapotId: z.string().uuid(),
  teaId: z.string().uuid(),
  waterTempCelsius: z.number().int().min(60).max(100).optional(),
  notes: z.string().max(500).nullable().default(null),
})

// PATCH /brews/:id
export const PatchBrewSchema = z.object({
  status: BrewStatusSchema.optional(),
  notes: z.string().max(500).nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
})

// Query params
export const BrewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: BrewStatusSchema.optional(),
  teapotId: z.string().uuid().optional(),
  teaId: z.string().uuid().optional(),
})

// Type exports
export type BrewStatus = z.infer<typeof BrewStatusSchema>
export type Brew = z.infer<typeof BrewSchema>
export type BrewWithDetails = z.infer<typeof BrewWithDetailsSchema>
export type CreateBrew = z.infer<typeof CreateBrewSchema>
export type PatchBrew = z.infer<typeof PatchBrewSchema>
export type BrewQuery = z.infer<typeof BrewQuerySchema>
