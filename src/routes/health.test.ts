import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app.js'

const app = createApp()

describe('Health API', () => {
  describe('GET /health', () => {
    it('should return health status with ok', async () => {
      const response = await request(app).get('/health')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('ok')
      expect(response.body.version).toBe('1.0.0')
      expect(response.body.timestamp).toBeDefined()
    })

    it('should return valid ISO timestamp', async () => {
      const response = await request(app).get('/health')

      expect(response.status).toBe(200)
      const timestamp = new Date(response.body.timestamp)
      expect(timestamp.toISOString()).toBe(response.body.timestamp)
    })
  })

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app).get('/health/live')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        status: 'ok',
      })
    })
  })

  describe('GET /health/ready', () => {
    it('should return readiness status with checks', async () => {
      const response = await request(app).get('/health/ready')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('ok')
      expect(response.body.timestamp).toBeDefined()
      expect(response.body.checks).toBeDefined()
      expect(Array.isArray(response.body.checks)).toBe(true)
    })

    it('should include memory and database checks', async () => {
      const response = await request(app).get('/health/ready')

      expect(response.status).toBe(200)
      const checkNames = response.body.checks.map(
        (c: { name: string }) => c.name
      )
      expect(checkNames).toContain('memory')
      expect(checkNames).toContain('database')
    })

    it('should have all checks reporting ok status', async () => {
      const response = await request(app).get('/health/ready')

      expect(response.status).toBe(200)
      expect(
        response.body.checks.every(
          (c: { status: string }) => c.status === 'ok'
        )
      ).toBe(true)
    })
  })
})

describe('TIF 418 Response', () => {
  describe('GET /brew', () => {
    it('should return 418 I am a teapot', async () => {
      const response = await request(app).get('/brew')

      expect(response.status).toBe(418)
    })

    it('should return TIF-compliant error response', async () => {
      const response = await request(app).get('/brew')

      expect(response.body.error).toBe("I'm a teapot")
      expect(response.body.message).toBe(
        'This server is TIF-compliant and cannot brew coffee'
      )
      expect(response.body.spec).toBe('https://teapotframework.dev')
    })

    it('should have valid spec URL', async () => {
      const response = await request(app).get('/brew')

      expect(response.body.spec).toMatch(/^https?:\/\//)
    })
  })
})

describe('404 Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown-route')

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('NOT_FOUND')
    expect(response.body.message).toContain('Cannot GET /unknown-route')
  })

  it('should return 404 for unknown POST routes', async () => {
    const response = await request(app).post('/unknown-route').send({})

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('NOT_FOUND')
    expect(response.body.message).toContain('Cannot POST /unknown-route')
  })

  it('should return 404 for unknown PUT routes', async () => {
    const response = await request(app).put('/unknown-route').send({})

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('NOT_FOUND')
    expect(response.body.message).toContain('Cannot PUT /unknown-route')
  })

  it('should return 404 for unknown DELETE routes', async () => {
    const response = await request(app).delete('/unknown-route')

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('NOT_FOUND')
    expect(response.body.message).toContain('Cannot DELETE /unknown-route')
  })
})
