# Express Fixture Specification

**Repository:** `api2spec-fixture-express`  
**Purpose:** Target fixture (no native OpenAPI generation)

---

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript |
| Runtime | Node.js 20+ or Bun |
| Framework | Express 4.x |
| Schema Library | Zod |
| Package Manager | pnpm |
| Test Runner | Vitest |

---

## Project Setup

### Initialize

```bash
mkdir api2spec-fixture-express
cd api2spec-fixture-express
pnpm init
pnpm add express zod uuid
pnpm add -D typescript @types/express @types/node @types/uuid vitest tsx
```

### package.json

```json
{
  "name": "api2spec-fixture-express",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "build": "tsc",
    "test": "vitest",
    "validate": "api2spec check --ci"
  },
  "dependencies": {
    "express": "^4.21.0",
    "zod": "^3.23.0",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.0.0",
    "@types/uuid": "^10.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Directory Structure

```
api2spec-fixture-express/
├── docs/
│   └── SPEC.md                  # This file
├── src/
│   ├── index.ts                 # Express app entry point
│   ├── app.ts                   # Express app factory
│   ├── routes/
│   │   ├── index.ts             # Route aggregator
│   │   ├── teapots.ts           # Teapot CRUD routes
│   │   ├── teas.ts              # Tea CRUD routes
│   │   ├── brews.ts             # Brew routes + nested steeps
│   │   └── health.ts            # Health + TIF 418 endpoint
│   ├── schemas/
│   │   ├── index.ts             # Re-exports all schemas
│   │   ├── teapot.ts            # Teapot Zod schemas
│   │   ├── tea.ts               # Tea Zod schemas
│   │   ├── brew.ts              # Brew Zod schemas
│   │   ├── steep.ts             # Steep Zod schemas
│   │   └── common.ts            # Pagination, Error, etc.
│   ├── middleware/
│   │   └── validate.ts          # Zod validation middleware
│   └── types/
│       └── express.d.ts         # Express type extensions
├── expected/
│   └── openapi.yaml             # Expected api2spec output
├── api2spec.config.ts           # api2spec configuration
├── package.json
├── tsconfig.json
└── README.md
```

---

## Schemas to Implement

### src/schemas/common.ts

```typescript
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
```

### src/schemas/teapot.ts

```typescript
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
```

### src/schemas/tea.ts

```typescript
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
```

### src/schemas/brew.ts

```typescript
import { z } from 'zod'
import { TeapotSchema } from './teapot'
import { TeaSchema } from './tea'

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
```

### src/schemas/steep.ts

```typescript
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
```

### src/schemas/index.ts

```typescript
// Re-export everything
export * from './common'
export * from './teapot'
export * from './tea'
export * from './brew'
export * from './steep'
```

---

## Routes to Implement

### Route Summary Table

| Method | Path | Request Body | Query Params | Success | Errors |
|--------|------|--------------|--------------|---------|--------|
| GET | `/teapots` | — | page, limit, material, style | 200 | — |
| POST | `/teapots` | CreateTeapot | — | 201 | 400 |
| GET | `/teapots/:id` | — | — | 200 | 404 |
| PUT | `/teapots/:id` | UpdateTeapot | — | 200 | 400, 404 |
| PATCH | `/teapots/:id` | PatchTeapot | — | 200 | 400, 404 |
| DELETE | `/teapots/:id` | — | — | 204 | 404 |
| GET | `/teapots/:teapotId/brews` | — | page, limit | 200 | 404 |
| GET | `/teas` | — | page, limit, type, caffeineLevel | 200 | — |
| POST | `/teas` | CreateTea | — | 201 | 400 |
| GET | `/teas/:id` | — | — | 200 | 404 |
| PUT | `/teas/:id` | UpdateTea | — | 200 | 400, 404 |
| PATCH | `/teas/:id` | PatchTea | — | 200 | 400, 404 |
| DELETE | `/teas/:id` | — | — | 204 | 404 |
| GET | `/brews` | — | page, limit, status, teapotId, teaId | 200 | — |
| POST | `/brews` | CreateBrew | — | 201 | 400 |
| GET | `/brews/:id` | — | — | 200 | 404 |
| PATCH | `/brews/:id` | PatchBrew | — | 200 | 400, 404 |
| DELETE | `/brews/:id` | — | — | 204 | 404 |
| GET | `/brews/:brewId/steeps` | — | page, limit | 200 | 404 |
| POST | `/brews/:brewId/steeps` | CreateSteep | — | 201 | 400, 404 |
| GET | `/health` | — | — | 200 | — |
| GET | `/health/live` | — | — | 200 | — |
| GET | `/health/ready` | — | — | 200/503 | — |
| GET | `/brew` | — | — | **418** | — |

### src/routes/teapots.ts

```typescript
import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import {
  TeapotSchema,
  CreateTeapotSchema,
  UpdateTeapotSchema,
  PatchTeapotSchema,
  TeapotQuerySchema,
  UuidParamSchema,
  type Teapot,
} from '../schemas'

const router = Router()

// In-memory store (for fixture purposes)
const teapots: Map<string, Teapot> = new Map()

// GET /teapots
router.get('/', (req: Request, res: Response) => {
  const query = TeapotQuerySchema.parse(req.query)
  
  let items = Array.from(teapots.values())
  
  // Apply filters
  if (query.material) {
    items = items.filter(t => t.material === query.material)
  }
  if (query.style) {
    items = items.filter(t => t.style === query.style)
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

// GET /teapots/:teapotId/brews - implemented in brews.ts but mounted here
// This is handled by the main router setup

export default router
```

### src/routes/health.ts

```typescript
import { Router, Request, Response } from 'express'

const router = Router()

// GET /health
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

// GET /health/live
router.get('/live', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
  })
})

// GET /health/ready
router.get('/ready', (req: Request, res: Response) => {
  // In a real app, check database connections, etc.
  const checks = [
    { name: 'memory', status: 'ok' as const },
    { name: 'database', status: 'ok' as const },
  ]
  
  const allOk = checks.every(c => c.status === 'ok')
  
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  })
})

// GET /brew - TIF 418 signature endpoint
router.get('/brew', (req: Request, res: Response) => {
  res.status(418).json({
    error: "I'm a teapot",
    message: 'This server is TIF-compliant and cannot brew coffee',
    spec: 'https://teapotframework.dev',
  })
})

export default router
```

### src/routes/index.ts

```typescript
import { Router } from 'express'
import teapotRoutes from './teapots'
import teaRoutes from './teas'
import brewRoutes from './brews'
import healthRoutes from './health'

const router = Router()

router.use('/teapots', teapotRoutes)
router.use('/teas', teaRoutes)
router.use('/brews', brewRoutes)
router.use('/health', healthRoutes)

// TIF signature at root level
router.get('/brew', (req, res) => {
  res.status(418).json({
    error: "I'm a teapot",
    message: 'This server is TIF-compliant and cannot brew coffee',
    spec: 'https://teapotframework.dev',
  })
})

export default router
```

### src/app.ts

```typescript
import express from 'express'
import routes from './routes'

export function createApp() {
  const app = express()
  
  // Middleware
  app.use(express.json())
  
  // Routes
  app.use(routes)
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
    })
  })
  
  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err)
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    })
  })
  
  return app
}
```

### src/index.ts

```typescript
import { createApp } from './app'

const app = createApp()
const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`🫖 Tea API running at http://localhost:${port}`)
  console.log(`   TIF signature: http://localhost:${port}/brew`)
})
```

---

## api2spec Configuration

### api2spec.config.ts

```typescript
import { defineConfig } from 'api2spec'

export default defineConfig({
  framework: 'express',
  entry: ['src/routes/**/*.ts'],
  exclude: ['**/*.test.ts', '**/*.spec.ts'],
  output: {
    path: 'generated/openapi.yaml',
    format: 'yaml',
  },
  openapi: {
    info: {
      title: 'Tea Brewing API',
      version: '1.0.0',
      description: 'Express fixture API for api2spec. TIF-compliant.',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' },
    ],
    tags: [
      { name: 'teapots', description: 'Teapot management' },
      { name: 'teas', description: 'Tea catalog' },
      { name: 'brews', description: 'Brewing sessions' },
      { name: 'health', description: 'Health checks' },
    ],
  },
  schemas: {
    include: ['src/schemas/**/*.ts'],
    libraries: ['zod'],
  },
  frameworkOptions: {
    express: {
      routerNames: ['router', 'Router'],
    },
  },
})
```

---

## Implementation Checklist

### Phase 1: Setup
- [ ] Initialize repository
- [ ] Create package.json with dependencies
- [ ] Create tsconfig.json
- [ ] Create directory structure

### Phase 2: Schemas
- [ ] src/schemas/common.ts (Pagination, Error, Health, TeapotResponse)
- [ ] src/schemas/teapot.ts (all Teapot schemas)
- [ ] src/schemas/tea.ts (all Tea schemas)
- [ ] src/schemas/brew.ts (all Brew schemas)
- [ ] src/schemas/steep.ts (all Steep schemas)
- [ ] src/schemas/index.ts (re-exports)

### Phase 3: Routes
- [ ] src/routes/teapots.ts (GET, POST, GET/:id, PUT/:id, PATCH/:id, DELETE/:id)
- [ ] src/routes/teas.ts (GET, POST, GET/:id, PUT/:id, PATCH/:id, DELETE/:id)
- [ ] src/routes/brews.ts (GET, POST, GET/:id, PATCH/:id, DELETE/:id)
- [ ] src/routes/brews.ts - nested routes (GET/:teapotId/brews, GET/:brewId/steeps, POST/:brewId/steeps)
- [ ] src/routes/health.ts (GET /health, /health/live, /health/ready)
- [ ] src/routes/health.ts or index.ts - TIF signature (GET /brew → 418)
- [ ] src/routes/index.ts (aggregator)

### Phase 4: App
- [ ] src/app.ts (Express app factory)
- [ ] src/index.ts (entry point)

### Phase 5: Config & Expected Output
- [ ] api2spec.config.ts
- [ ] expected/openapi.yaml (manually created gold standard)
- [ ] README.md

### Phase 6: Validation
- [ ] Run `pnpm dev` and test all endpoints
- [ ] Verify 418 response at GET /brew
- [ ] Run api2spec (when available) and compare output

---

## Notes for Claude Code

1. **Zod is the source of truth** - All request/response shapes come from Zod schemas
2. **Keep routes simple** - This is a fixture, not a production app. In-memory storage is fine.
3. **Status codes matter** - Use correct codes (201 for create, 204 for delete, 400/404 for errors)
4. **The 418 endpoint is required** - This is the TIF signature
5. **PUT vs PATCH** - PUT requires all fields, PATCH makes all fields optional
6. **Pagination on all list endpoints** - Return `{ data: [], pagination: {} }` format
7. **Don't over-engineer** - No database, no auth, no complex middleware

---

## Testing the Fixture

```bash
# Start the server
pnpm dev

# Test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/brew  # Should return 418

# Create a teapot
curl -X POST http://localhost:3000/teapots \
  -H "Content-Type: application/json" \
  -d '{"name":"My Kyusu","material":"clay","capacityMl":350,"style":"kyusu"}'

# List teapots
curl http://localhost:3000/teapots

# Get teapot by ID
curl http://localhost:3000/teapots/{id}
```
