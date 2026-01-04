import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import {
  CreateTeapotSchema,
  UpdateTeapotSchema,
  PatchTeapotSchema,
  TeapotQuerySchema,
  UuidParamSchema,
  type Teapot,
} from '../schemas/index.js'

const router = Router()

// In-memory store (for fixture purposes)
export const teapots: Map<string, Teapot> = new Map()

// GET /teapots
router.get('/', (req: Request, res: Response) => {
  const query = TeapotQuerySchema.parse(req.query)

  let items = Array.from(teapots.values())

  // Apply filters
  if (query.material) {
    items = items.filter((t) => t.material === query.material)
  }
  if (query.style) {
    items = items.filter((t) => t.style === query.style)
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

// POST /teapots
router.post('/', (req: Request, res: Response) => {
  const result = CreateTeapotSchema.safeParse(req.body)

  if (!result.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      details: result.error.flatten().fieldErrors,
    })
    return
  }

  const now = new Date().toISOString()
  const teapot: Teapot = {
    id: uuidv4(),
    ...result.data,
    createdAt: now,
    updatedAt: now,
  }

  teapots.set(teapot.id, teapot)
  res.status(201).json(teapot)
})

// GET /teapots/:id
router.get('/:id', (req: Request, res: Response) => {
  const params = UuidParamSchema.safeParse(req.params)

  if (!params.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid teapot ID format',
    })
    return
  }

  const teapot = teapots.get(params.data.id)

  if (!teapot) {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Teapot not found',
    })
    return
  }

  res.json(teapot)
})

// PUT /teapots/:id
router.put('/:id', (req: Request, res: Response) => {
  const params = UuidParamSchema.safeParse(req.params)

  if (!params.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid teapot ID format',
    })
    return
  }

  const existing = teapots.get(params.data.id)

  if (!existing) {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Teapot not found',
    })
    return
  }

  const result = UpdateTeapotSchema.safeParse(req.body)

  if (!result.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      details: result.error.flatten().fieldErrors,
    })
    return
  }

  const teapot: Teapot = {
    ...existing,
    ...result.data,
    updatedAt: new Date().toISOString(),
  }

  teapots.set(teapot.id, teapot)
  res.json(teapot)
})

// PATCH /teapots/:id
router.patch('/:id', (req: Request, res: Response) => {
  const params = UuidParamSchema.safeParse(req.params)

  if (!params.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid teapot ID format',
    })
    return
  }

  const existing = teapots.get(params.data.id)

  if (!existing) {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Teapot not found',
    })
    return
  }

  const result = PatchTeapotSchema.safeParse(req.body)

  if (!result.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      details: result.error.flatten().fieldErrors,
    })
    return
  }

  const teapot: Teapot = {
    ...existing,
    ...result.data,
    updatedAt: new Date().toISOString(),
  }

  teapots.set(teapot.id, teapot)
  res.json(teapot)
})

// DELETE /teapots/:id
router.delete('/:id', (req: Request, res: Response) => {
  const params = UuidParamSchema.safeParse(req.params)

  if (!params.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid teapot ID format',
    })
    return
  }

  if (!teapots.has(params.data.id)) {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Teapot not found',
    })
    return
  }

  teapots.delete(params.data.id)
  res.status(204).send()
})

export default router
