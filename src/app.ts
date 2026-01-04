import express from 'express'
import routes from './routes/index.js'

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
  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error(err)
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      })
    }
  )

  return app
}
