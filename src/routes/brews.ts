import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import {
  CreateBrewSchema,
  PatchBrewSchema,
  BrewQuerySchema,
  CreateSteepSchema,
  PaginationQuerySchema,
  UuidParamSchema,
  type Brew,
  type Steep,
} from '../schemas/index.js'
import { teapots } from './teapots.js'
import { teas } from './teas.js'

const router = Router()

// In-memory stores (for fixture purposes)
export const brews: Map<string, Brew> = new Map()
export const steeps: Map<string, Steep> = new Map()

// Schema for brew ID param
const BrewIdParamSchema = z.object({
  brewId: z.string().uuid(),
})

// Schema for teapot ID param
const TeapotIdParamSchema = z.object({
  teapotId: z.string().uuid(),
})

// GET /brews
router.get('/', (req: Request, res: Response) => {
  const query = BrewQuerySchema.parse(req.query)

  let items = Array.from(brews.values())

  // Apply filters
  if (query.status) {
    items = items.filter((b) => b.status === query.status)
  }
  if (query.teapotId) {
    items = items.filter((b) => b.teapotId === query.teapotId)
  }
  if (query.teaId) {
    items = items.filter((b) => b.teaId === query.teaId)
  }

  // Pagination
  const total = items.length
  const totalPages = Math.ceil(total / query.limit)
  const start = (query.page - 1) * query.limit
  const data = items.slice(start, start + query.limit)

  res.json({
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
    },
  })
})

// POST /brews
router.post('/', (req: Request, res: Response) => {
  const result = CreateBrewSchema.safeParse(req.body)

  if (!result.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      details: result.error.flatten().fieldErrors,
    })
    return
  }

  // Verify teapot exists
  const teapot = teapots.get(result.data.teapotId)
  if (!teapot) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Teapot not found',
    })
    return
  }

  // Verify tea exists
  const tea = teas.get(result.data.teaId)
  if (!tea) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Tea not found',
    })
    return
  }

  const now = new Date().toISOString()
  const brew: Brew = {
    id: uuidv4(),
    teapotId: result.data.teapotId,
    teaId: result.data.teaId,
    status: 'preparing',
    waterTempCelsius: result.data.waterTempCelsius ?? tea.steepTempCelsius,
    notes: result.data.notes,
    startedAt: now,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  brews.set(brew.id, brew)
  res.status(201).json(brew)
})

// GET /brews/:id
router.get('/:id', (req: Request, res: Response) => {
  const params = UuidParamSchema.safeParse(req.params)

  if (!params.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid brew ID format',
    })
    return
  }

  const brew = brews.get(params.data.id)

  if (!brew) {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Brew not found',
    })
    return
  }

  // Get related entities for details view
  const teapot = teapots.get(brew.teapotId)
  const tea = teas.get(brew.teaId)

  if (teapot && tea) {
    res.json({
      ...brew,
      teapot,
      tea,
    })
  } else {
    res.json(brew)
  }
})

// PATCH /brews/:id
router.patch('/:id', (req: Request, res: Response) => {
  const params = UuidParamSchema.safeParse(req.params)

  if (!params.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid brew ID format',
    })
    return
  }

  const existing = brews.get(params.data.id)

  if (!existing) {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Brew not found',
    })
    return
  }

  const result = PatchBrewSchema.safeParse(req.body)

  if (!result.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      details: result.error.flatten().fieldErrors,
    })
    return
  }

  const brew: Brew = {
    ...existing,
    ...result.data,
    updatedAt: new Date().toISOString(),
  }

  brews.set(brew.id, brew)
  res.json(brew)
})

// DELETE /brews/:id
router.delete('/:id', (req: Request, res: Response) => {
  const params = UuidParamSchema.safeParse(req.params)

  if (!params.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid brew ID format',
    })
    return
  }

  if (!brews.has(params.data.id)) {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Brew not found',
    })
    return
  }

  // Also delete associated steeps
  for (const [steepId, steep] of steeps.entries()) {
    if (steep.brewId === params.data.id) {
      steeps.delete(steepId)
    }
  }

  brews.delete(params.data.id)
  res.status(204).send()
})

// GET /brews/:brewId/steeps
router.get('/:brewId/steeps', (req: Request, res: Response) => {
  const params = BrewIdParamSchema.safeParse(req.params)

  if (!params.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid brew ID format',
    })
    return
  }

  // Verify brew exists
  if (!brews.has(params.data.brewId)) {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Brew not found',
    })
    return
  }

  const query = PaginationQuerySchema.parse(req.query)

  let items = Array.from(steeps.values()).filter(
    (s) => s.brewId === params.data.brewId
  )

  // Sort by steep number
  items.sort((a, b) => a.steepNumber - b.steepNumber)

  // Pagination
  const total = items.length
  const totalPages = Math.ceil(total / query.limit)
  const start = (query.page - 1) * query.limit
  const data = items.slice(start, start + query.limit)

  res.json({
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
    },
  })
})

// POST /brews/:brewId/steeps
router.post('/:brewId/steeps', (req: Request, res: Response) => {
  const params = BrewIdParamSchema.safeParse(req.params)

  if (!params.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid brew ID format',
    })
    return
  }

  // Verify brew exists
  if (!brews.has(params.data.brewId)) {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Brew not found',
    })
    return
  }

  const result = CreateSteepSchema.safeParse(req.body)

  if (!result.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      details: result.error.flatten().fieldErrors,
    })
    return
  }

  // Calculate steep number
  const existingSteeps = Array.from(steeps.values()).filter(
    (s) => s.brewId === params.data.brewId
  )
  const steepNumber = existingSteeps.length + 1

  const now = new Date().toISOString()
  const steep: Steep = {
    id: uuidv4(),
    brewId: params.data.brewId,
    steepNumber,
    durationSeconds: result.data.durationSeconds,
    rating: result.data.rating,
    notes: result.data.notes,
    createdAt: now,
  }

  steeps.set(steep.id, steep)
  res.status(201).json(steep)
})

// Nested route: GET /teapots/:teapotId/brews (exported for mounting in teapots router)
export const getTeapotBrews = (req: Request, res: Response) => {
  const params = TeapotIdParamSchema.safeParse(req.params)

  if (!params.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid teapot ID format',
    })
    return
  }

  // Verify teapot exists
  if (!teapots.has(params.data.teapotId)) {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Teapot not found',
    })
    return
  }

  const query = PaginationQuerySchema.parse(req.query)

  let items = Array.from(brews.values()).filter(
    (b) => b.teapotId === params.data.teapotId
  )

  // Pagination
  const total = items.length
  const totalPages = Math.ceil(total / query.limit)
  const start = (query.page - 1) * query.limit
  const data = items.slice(start, start + query.limit)

  res.json({
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
    },
  })
}

export default router
