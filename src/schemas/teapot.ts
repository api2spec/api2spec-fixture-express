import { z } from 'zod'

// Enums
export const TeapotMaterialSchema = z.enum([
  'ceramic',
  'cast-iron',
  'glass',
  'porcelain',
  'clay',
  'stainless-steel',
])

export const TeapotStyleSchema = z.enum([
  'kyusu',
  'gaiwan',
  'english',
  'moroccan',
  'turkish',
  'yixing',
])

// Main entity
export const TeapotSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  material: TeapotMaterialSchema,
  capacityMl: z.number().int().positive().max(5000),
  style: TeapotStyleSchema,
  description: z.string().max(500).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// POST /teapots
export const CreateTeapotSchema = z.object({
  name: z.string().min(1).max(100),
  material: TeapotMaterialSchema,
  capacityMl: z.number().int().positive().max(5000),
  style: TeapotStyleSchema.default('english'),
  description: z.string().max(500).nullable().default(null),
})

// PUT /teapots/:id (full replacement - all required)
export const UpdateTeapotSchema = z.object({
  name: z.string().min(1).max(100),
  material: TeapotMaterialSchema,
  capacityMl: z.number().int().positive().max(5000),
  style: TeapotStyleSchema,
  description: z.string().max(500).nullable(),
})

// PATCH /teapots/:id (partial - all optional)
export const PatchTeapotSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  material: TeapotMaterialSchema.optional(),
  capacityMl: z.number().int().positive().max(5000).optional(),
  style: TeapotStyleSchema.optional(),
  description: z.string().max(500).nullable().optional(),
})

// Query params for GET /teapots
export const TeapotQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  material: TeapotMaterialSchema.optional(),
  style: TeapotStyleSchema.optional(),
})

// Type exports
export type TeapotMaterial = z.infer<typeof TeapotMaterialSchema>
export type TeapotStyle = z.infer<typeof TeapotStyleSchema>
export type Teapot = z.infer<typeof TeapotSchema>
export type CreateTeapot = z.infer<typeof CreateTeapotSchema>
export type UpdateTeapot = z.infer<typeof UpdateTeapotSchema>
export type PatchTeapot = z.infer<typeof PatchTeapotSchema>
export type TeapotQuery = z.infer<typeof TeapotQuerySchema>
