import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import {
  CreateTeaSchema,
  UpdateTeaSchema,
  PatchTeaSchema,
  TeaQuerySchema,
  UuidParamSchema,
  type Tea,
} from '../schemas/index.js'

const router = Router()

// In-memory store (for fixture purposes)
export const teas: Map<string, Tea> = new Map()

// GET /teas
router.get('/', (req: Request, res: Response) => {
  const query = TeaQuerySchema.parse(req.query)

  let items = Array.from(teas.values())

  // Apply filters
  if (query.type) {
    items = items.filter((t) => t.type === query.type)
  }
  if (query.caffeineLevel) {
    items = items.filter((t) => t.caffeineLevel === query.caffeineLevel)
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

// POST /teas
router.post('/', (req: Request, res: Response) => {
  const result = CreateTeaSchema.safeParse(req.body)

  if (!result.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      details: result.error.flatten().fieldErrors,
    })
    return
  }

  const now = new Date().toISOString()
  const tea: Tea = {
    id: uuidv4(),
    ...result.data,
    createdAt: now,
    updatedAt: now,
  }

  teas.set(tea.id, tea)
  res.status(201).json(tea)
})

// GET /teas/:id
router.get('/:id', (req: Request, res: Response) => {
  const params = UuidParamSchema.safeParse(req.params)

  if (!params.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid tea ID format',
    })
    return
  }

  const tea = teas.get(params.data.id)

  if (!tea) {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Tea not found',
    })
    return
  }

  res.json(tea)
})

// PUT /teas/:id
router.put('/:id', (req: Request, res: Response) => {
  const params = UuidParamSchema.safeParse(req.params)

  if (!params.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid tea ID format',
    })
    return
  }

  const existing = teas.get(params.data.id)

  if (!existing) {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Tea not found',
    })
    return
  }

  const result = UpdateTeaSchema.safeParse(req.body)

  if (!result.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      details: result.error.flatten().fieldErrors,
    })
    return
  }

  const tea: Tea = {
    ...existing,
    ...result.data,
    updatedAt: new Date().toISOString(),
  }

  teas.set(tea.id, tea)
  res.json(tea)
})

// PATCH /teas/:id
router.patch('/:id', (req: Request, res: Response) => {
  const params = UuidParamSchema.safeParse(req.params)

  if (!params.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid tea ID format',
    })
    return
  }

  const existing = teas.get(params.data.id)

  if (!existing) {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Tea not found',
    })
    return
  }

  const result = PatchTeaSchema.safeParse(req.body)

  if (!result.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      details: result.error.flatten().fieldErrors,
    })
    return
  }

  const tea: Tea = {
    ...existing,
    ...result.data,
    updatedAt: new Date().toISOString(),
  }

  teas.set(tea.id, tea)
  res.json(tea)
})

// DELETE /teas/:id
router.delete('/:id', (req: Request, res: Response) => {
  const params = UuidParamSchema.safeParse(req.params)

  if (!params.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid tea ID format',
    })
    return
  }

  if (!teas.has(params.data.id)) {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Tea not found',
    })
    return
  }

  teas.delete(params.data.id)
  res.status(204).send()
})

export default router
