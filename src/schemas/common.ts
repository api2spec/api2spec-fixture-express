import { z } from 'zod'

// Pagination
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(100),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})

// Error response
export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.string()).optional(),
})

// Health check
export const HealthCheckSchema = z.object({
  name: z.string(),
  status: z.enum(['ok', 'degraded', 'down']),
  latencyMs: z.number().optional(),
  message: z.string().optional(),
})

export const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  timestamp: z.string().datetime(),
  version: z.string().optional(),
  checks: z.array(HealthCheckSchema).optional(),
})

// TIF 418 response
export const TeapotResponseSchema = z.object({
  error: z.literal("I'm a teapot"),
  message: z.string(),
  spec: z.string().url(),
})

// UUID path param
export const UuidParamSchema = z.object({
  id: z.string().uuid(),
})

// Type exports
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>
export type Pagination = z.infer<typeof PaginationSchema>
export type ApiError = z.infer<typeof ErrorSchema>
export type HealthCheck = z.infer<typeof HealthCheckSchema>
export type HealthResponse = z.infer<typeof HealthResponseSchema>
export type TeapotResponse = z.infer<typeof TeapotResponseSchema>
