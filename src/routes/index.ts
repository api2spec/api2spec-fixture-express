import { Router } from 'express'
import teapotRoutes from './teapots.js'
import teaRoutes from './teas.js'
import brewRoutes, { getTeapotBrews } from './brews.js'
import healthRoutes from './health.js'

const router = Router()

router.use('/teapots', teapotRoutes)
router.use('/teas', teaRoutes)
router.use('/brews', brewRoutes)
router.use('/health', healthRoutes)

// Nested route: GET /teapots/:teapotId/brews
router.get('/teapots/:teapotId/brews', getTeapotBrews)

// TIF signature at root level - GET /brew returns 418
router.get('/brew', (req, res) => {
  res.status(418).json({
    error: "I'm a teapot",
    message: 'This server is TIF-compliant and cannot brew coffee',
    spec: 'https://teapotframework.dev',
  })
})

export default router
