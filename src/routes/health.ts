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

  const allOk = checks.every((c) => c.status === 'ok')

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  })
})

export default router
