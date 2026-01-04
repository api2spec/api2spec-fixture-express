import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../app.js'
import { brews, steeps } from './brews.js'
import { teapots } from './teapots.js'
import { teas } from './teas.js'

const app = createApp()

describe('Brews API', () => {
  let teapotId: string
  let teaId: string

  beforeEach(async () => {
    // Clear all in-memory stores before each test
    brews.clear()
    steeps.clear()
    teapots.clear()
    teas.clear()

    // Create a teapot and tea for brew tests
    const teapotResponse = await request(app).post('/teapots').send({
      name: 'Test Teapot',
      material: 'ceramic',
      capacityMl: 500,
      style: 'english',
    })
    teapotId = teapotResponse.body.id

    const teaResponse = await request(app).post('/teas').send({
      name: 'Test Tea',
      type: 'green',
      caffeineLevel: 'medium',
      steepTempCelsius: 80,
      steepTimeSeconds: 180,
    })
    teaId = teaResponse.body.id
  })

  describe('GET /brews', () => {
    it('should return empty list when no brews exist', async () => {
      const response = await request(app).get('/brews')

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual([])
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      })
    })

    it('should return list of brews with pagination', async () => {
      await request(app).post('/brews').send({
        teapotId,
        teaId,
      })
      await request(app).post('/brews').send({
        teapotId,
        teaId,
        notes: 'Second brew',
      })

      const response = await request(app).get('/brews')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.pagination.total).toBe(2)
    })

    it('should filter brews by status', async () => {
      // Create a brew
      const brew1Response = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })
      const brew1Id = brew1Response.body.id

      // Update status of first brew
      await request(app).patch(`/brews/${brew1Id}`).send({
        status: 'ready',
      })

      // Create another brew (defaults to preparing)
      await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const response = await request(app).get('/brews?status=ready')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].status).toBe('ready')
    })

    it('should filter brews by teapotId', async () => {
      // Create another teapot
      const teapot2Response = await request(app).post('/teapots').send({
        name: 'Second Teapot',
        material: 'glass',
        capacityMl: 750,
        style: 'english',
      })
      const teapot2Id = teapot2Response.body.id

      await request(app).post('/brews').send({
        teapotId,
        teaId,
      })
      await request(app).post('/brews').send({
        teapotId: teapot2Id,
        teaId,
      })

      const response = await request(app).get(`/brews?teapotId=${teapotId}`)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].teapotId).toBe(teapotId)
    })

    it('should filter brews by teaId', async () => {
      // Create another tea
      const tea2Response = await request(app).post('/teas').send({
        name: 'Second Tea',
        type: 'black',
        caffeineLevel: 'high',
        steepTempCelsius: 100,
        steepTimeSeconds: 240,
      })
      const tea2Id = tea2Response.body.id

      await request(app).post('/brews').send({
        teapotId,
        teaId,
      })
      await request(app).post('/brews').send({
        teapotId,
        teaId: tea2Id,
      })

      const response = await request(app).get(`/brews?teaId=${teaId}`)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].teaId).toBe(teaId)
    })

    it('should paginate results correctly', async () => {
      // Create 5 brews
      for (let i = 0; i < 5; i++) {
        await request(app).post('/brews').send({
          teapotId,
          teaId,
          notes: `Brew ${i}`,
        })
      }

      const response = await request(app).get('/brews?page=1&limit=2')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
      })
    })
  })

  describe('POST /brews', () => {
    it('should create a new brew with required fields', async () => {
      const response = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        teapotId,
        teaId,
        status: 'preparing',
        waterTempCelsius: 80, // from the tea's steepTempCelsius
        notes: null,
        completedAt: null,
      })
      expect(response.body.id).toBeDefined()
      expect(response.body.startedAt).toBeDefined()
      expect(response.body.createdAt).toBeDefined()
      expect(response.body.updatedAt).toBeDefined()
    })

    it('should create a brew with custom water temperature', async () => {
      const response = await request(app).post('/brews').send({
        teapotId,
        teaId,
        waterTempCelsius: 85,
      })

      expect(response.status).toBe(201)
      expect(response.body.waterTempCelsius).toBe(85)
    })

    it('should create a brew with notes', async () => {
      const response = await request(app).post('/brews').send({
        teapotId,
        teaId,
        notes: 'First brew of the day',
      })

      expect(response.status).toBe(201)
      expect(response.body.notes).toBe('First brew of the day')
    })

    it('should return 400 for missing required fields', async () => {
      const response = await request(app).post('/brews').send({
        teapotId,
        // missing teaId
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
      expect(response.body.message).toBe('Invalid request body')
    })

    it('should return 400 for non-existent teapot', async () => {
      const response = await request(app).post('/brews').send({
        teapotId: '00000000-0000-0000-0000-000000000000',
        teaId,
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
      expect(response.body.message).toBe('Teapot not found')
    })

    it('should return 400 for non-existent tea', async () => {
      const response = await request(app).post('/brews').send({
        teapotId,
        teaId: '00000000-0000-0000-0000-000000000000',
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
      expect(response.body.message).toBe('Tea not found')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).post('/brews').send({
        teapotId: 'invalid-uuid',
        teaId,
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for water temperature below minimum', async () => {
      const response = await request(app).post('/brews').send({
        teapotId,
        teaId,
        waterTempCelsius: 50, // min is 60
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for water temperature above maximum', async () => {
      const response = await request(app).post('/brews').send({
        teapotId,
        teaId,
        waterTempCelsius: 120, // max is 100
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /brews/:id', () => {
    it('should return a brew by id with teapot and tea details', async () => {
      const createResponse = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const brewId = createResponse.body.id

      const response = await request(app).get(`/brews/${brewId}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(brewId)
      expect(response.body.teapot).toBeDefined()
      expect(response.body.teapot.id).toBe(teapotId)
      expect(response.body.tea).toBeDefined()
      expect(response.body.tea.id).toBe(teaId)
    })

    it('should return 404 for non-existent brew', async () => {
      const response = await request(app).get(
        '/brews/00000000-0000-0000-0000-000000000000'
      )

      expect(response.status).toBe(404)
      expect(response.body.code).toBe('NOT_FOUND')
      expect(response.body.message).toBe('Brew not found')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).get('/brews/invalid-uuid')

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
      expect(response.body.message).toBe('Invalid brew ID format')
    })
  })

  describe('PATCH /brews/:id', () => {
    it('should update brew status', async () => {
      const createResponse = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const brewId = createResponse.body.id

      const response = await request(app).patch(`/brews/${brewId}`).send({
        status: 'steeping',
      })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('steeping')
    })

    it('should update brew notes', async () => {
      const createResponse = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const brewId = createResponse.body.id

      const response = await request(app).patch(`/brews/${brewId}`).send({
        notes: 'Updated notes',
      })

      expect(response.status).toBe(200)
      expect(response.body.notes).toBe('Updated notes')
    })

    it('should update completedAt', async () => {
      const createResponse = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const brewId = createResponse.body.id
      const completedAt = new Date().toISOString()

      const response = await request(app).patch(`/brews/${brewId}`).send({
        status: 'served',
        completedAt,
      })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('served')
      expect(response.body.completedAt).toBe(completedAt)
    })

    it('should return 404 for non-existent brew', async () => {
      const response = await request(app)
        .patch('/brews/00000000-0000-0000-0000-000000000000')
        .send({
          status: 'ready',
        })

      expect(response.status).toBe(404)
      expect(response.body.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).patch('/brews/invalid-uuid').send({
        status: 'ready',
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid status', async () => {
      const createResponse = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const brewId = createResponse.body.id

      const response = await request(app).patch(`/brews/${brewId}`).send({
        status: 'invalid',
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('DELETE /brews/:id', () => {
    it('should delete a brew', async () => {
      const createResponse = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const brewId = createResponse.body.id

      const deleteResponse = await request(app).delete(`/brews/${brewId}`)
      expect(deleteResponse.status).toBe(204)

      // Verify it is actually deleted
      const getResponse = await request(app).get(`/brews/${brewId}`)
      expect(getResponse.status).toBe(404)
    })

    it('should also delete associated steeps when deleting a brew', async () => {
      const createResponse = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const brewId = createResponse.body.id

      // Add some steeps
      await request(app).post(`/brews/${brewId}/steeps`).send({
        durationSeconds: 30,
      })
      await request(app).post(`/brews/${brewId}/steeps`).send({
        durationSeconds: 45,
      })

      // Verify steeps exist
      const steepsResponse = await request(app).get(`/brews/${brewId}/steeps`)
      expect(steepsResponse.body.data).toHaveLength(2)

      // Delete the brew
      await request(app).delete(`/brews/${brewId}`)

      // Verify steeps are also deleted (by checking the steep count)
      expect(steeps.size).toBe(0)
    })

    it('should return 404 for non-existent brew', async () => {
      const response = await request(app).delete(
        '/brews/00000000-0000-0000-0000-000000000000'
      )

      expect(response.status).toBe(404)
      expect(response.body.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).delete('/brews/invalid-uuid')

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /brews/:brewId/steeps', () => {
    it('should return empty list when no steeps exist', async () => {
      const createResponse = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const brewId = createResponse.body.id

      const response = await request(app).get(`/brews/${brewId}/steeps`)

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual([])
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      })
    })

    it('should return list of steeps for a brew', async () => {
      const createResponse = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const brewId = createResponse.body.id

      await request(app).post(`/brews/${brewId}/steeps`).send({
        durationSeconds: 30,
      })
      await request(app).post(`/brews/${brewId}/steeps`).send({
        durationSeconds: 45,
      })

      const response = await request(app).get(`/brews/${brewId}/steeps`)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.pagination.total).toBe(2)
    })

    it('should return steeps sorted by steep number', async () => {
      const createResponse = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const brewId = createResponse.body.id

      await request(app).post(`/brews/${brewId}/steeps`).send({
        durationSeconds: 30,
      })
      await request(app).post(`/brews/${brewId}/steeps`).send({
        durationSeconds: 45,
      })
      await request(app).post(`/brews/${brewId}/steeps`).send({
        durationSeconds: 60,
      })

      const response = await request(app).get(`/brews/${brewId}/steeps`)

      expect(response.status).toBe(200)
      expect(response.body.data[0].steepNumber).toBe(1)
      expect(response.body.data[1].steepNumber).toBe(2)
      expect(response.body.data[2].steepNumber).toBe(3)
    })

    it('should return 404 for non-existent brew', async () => {
      const response = await request(app).get(
        '/brews/00000000-0000-0000-0000-000000000000/steeps'
      )

      expect(response.status).toBe(404)
      expect(response.body.code).toBe('NOT_FOUND')
      expect(response.body.message).toBe('Brew not found')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).get('/brews/invalid-uuid/steeps')

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
      expect(response.body.message).toBe('Invalid brew ID format')
    })

    it('should paginate steeps correctly', async () => {
      const createResponse = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const brewId = createResponse.body.id

      // Create 5 steeps
      for (let i = 0; i < 5; i++) {
        await request(app).post(`/brews/${brewId}/steeps`).send({
          durationSeconds: 30 + i * 10,
        })
      }

      const response = await request(app).get(
        `/brews/${brewId}/steeps?page=1&limit=2`
      )

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
      })
    })
  })

  describe('POST /brews/:brewId/steeps', () => {
    it('should create a new steep with required fields', async () => {
      const createResponse = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const brewId = createResponse.body.id

      const response = await request(app).post(`/brews/${brewId}/steeps`).send({
        durationSeconds: 30,
      })

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        brewId,
        steepNumber: 1,
        durationSeconds: 30,
        rating: null,
        notes: null,
      })
      expect(response.body.id).toBeDefined()
      expect(response.body.createdAt).toBeDefined()
    })

    it('should create a steep with all fields', async () => {
      const createResponse = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const brewId = createResponse.body.id

      const response = await request(app).post(`/brews/${brewId}/steeps`).send({
        durationSeconds: 45,
        rating: 4,
        notes: 'Great flavor',
      })

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        durationSeconds: 45,
        rating: 4,
        notes: 'Great flavor',
      })
    })

    it('should auto-increment steep number', async () => {
      const createResponse = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const brewId = createResponse.body.id

      const steep1 = await request(app).post(`/brews/${brewId}/steeps`).send({
        durationSeconds: 30,
      })
      const steep2 = await request(app).post(`/brews/${brewId}/steeps`).send({
        durationSeconds: 45,
      })
      const steep3 = await request(app).post(`/brews/${brewId}/steeps`).send({
        durationSeconds: 60,
      })

      expect(steep1.body.steepNumber).toBe(1)
      expect(steep2.body.steepNumber).toBe(2)
      expect(steep3.body.steepNumber).toBe(3)
    })

    it('should return 400 for missing durationSeconds', async () => {
      const createResponse = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const brewId = createResponse.body.id

      const response = await request(app).post(`/brews/${brewId}/steeps`).send({
        // missing durationSeconds
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for negative durationSeconds', async () => {
      const createResponse = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const brewId = createResponse.body.id

      const response = await request(app).post(`/brews/${brewId}/steeps`).send({
        durationSeconds: -10,
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for rating below minimum', async () => {
      const createResponse = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const brewId = createResponse.body.id

      const response = await request(app).post(`/brews/${brewId}/steeps`).send({
        durationSeconds: 30,
        rating: 0, // min is 1
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for rating above maximum', async () => {
      const createResponse = await request(app).post('/brews').send({
        teapotId,
        teaId,
      })

      const brewId = createResponse.body.id

      const response = await request(app).post(`/brews/${brewId}/steeps`).send({
        durationSeconds: 30,
        rating: 6, // max is 5
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 404 for non-existent brew', async () => {
      const response = await request(app)
        .post('/brews/00000000-0000-0000-0000-000000000000/steeps')
        .send({
          durationSeconds: 30,
        })

      expect(response.status).toBe(404)
      expect(response.body.code).toBe('NOT_FOUND')
      expect(response.body.message).toBe('Brew not found')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .post('/brews/invalid-uuid/steeps')
        .send({
          durationSeconds: 30,
        })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
      expect(response.body.message).toBe('Invalid brew ID format')
    })
  })

  describe('GET /teapots/:teapotId/brews', () => {
    it('should return brews for a specific teapot', async () => {
      // Create brews for the first teapot
      await request(app).post('/brews').send({
        teapotId,
        teaId,
      })
      await request(app).post('/brews').send({
        teapotId,
        teaId,
        notes: 'Second brew',
      })

      // Create another teapot with a brew
      const teapot2Response = await request(app).post('/teapots').send({
        name: 'Second Teapot',
        material: 'glass',
        capacityMl: 750,
        style: 'english',
      })
      const teapot2Id = teapot2Response.body.id

      await request(app).post('/brews').send({
        teapotId: teapot2Id,
        teaId,
      })

      const response = await request(app).get(`/teapots/${teapotId}/brews`)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.data.every((b: { teapotId: string }) => b.teapotId === teapotId)).toBe(true)
    })

    it('should return empty list for teapot with no brews', async () => {
      const response = await request(app).get(`/teapots/${teapotId}/brews`)

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual([])
    })

    it('should return 404 for non-existent teapot', async () => {
      const response = await request(app).get(
        '/teapots/00000000-0000-0000-0000-000000000000/brews'
      )

      expect(response.status).toBe(404)
      expect(response.body.code).toBe('NOT_FOUND')
      expect(response.body.message).toBe('Teapot not found')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).get('/teapots/invalid-uuid/brews')

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
      expect(response.body.message).toBe('Invalid teapot ID format')
    })

    it('should paginate results correctly', async () => {
      // Create 5 brews for the teapot
      for (let i = 0; i < 5; i++) {
        await request(app).post('/brews').send({
          teapotId,
          teaId,
          notes: `Brew ${i}`,
        })
      }

      const response = await request(app).get(
        `/teapots/${teapotId}/brews?page=1&limit=2`
      )

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
      })
    })
  })
})
