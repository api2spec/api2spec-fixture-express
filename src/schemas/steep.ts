import { z } from 'zod'

// Main entity
export const SteepSchema = z.object({
  id: z.string().uuid(),
  brewId: z.string().uuid(),
  steepNumber: z.number().int().positive(),
  durationSeconds: z.number().int().positive(),
  rating: z.number().int().min(1).max(5).nullable(),
  notes: z.string().max(200).nullable(),
  createdAt: z.string().datetime(),
})

// POST /brews/:brewId/steeps
export const CreateSteepSchema = z.object({
  durationSeconds: z.number().int().positive(),
  rating: z.number().int().min(1).max(5).nullable().default(null),
  notes: z.string().max(200).nullable().default(null),
})

// Type exports
export type Steep = z.infer<typeof SteepSchema>
export type CreateSteep = z.infer<typeof CreateSteepSchema>
