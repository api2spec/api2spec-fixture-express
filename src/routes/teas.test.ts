import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../app.js'
import { teas } from './teas.js'

const app = createApp()

describe('Teas API', () => {
  beforeEach(() => {
    // Clear the in-memory store before each test
    teas.clear()
  })

  describe('GET /teas', () => {
    it('should return empty list when no teas exist', async () => {
      const response = await request(app).get('/teas')

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual([])
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      })
    })

    it('should return list of teas with pagination', async () => {
      await request(app).post('/teas').send({
        name: 'Green Tea',
        type: 'green',
        caffeineLevel: 'medium',
        steepTempCelsius: 80,
        steepTimeSeconds: 180,
      })
      await request(app).post('/teas').send({
        name: 'Black Tea',
        type: 'black',
        caffeineLevel: 'high',
        steepTempCelsius: 100,
        steepTimeSeconds: 240,
      })

      const response = await request(app).get('/teas')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.pagination.total).toBe(2)
    })

    it('should filter teas by type', async () => {
      await request(app).post('/teas').send({
        name: 'Sencha',
        type: 'green',
        caffeineLevel: 'medium',
        steepTempCelsius: 75,
        steepTimeSeconds: 120,
      })
      await request(app).post('/teas').send({
        name: 'Earl Grey',
        type: 'black',
        caffeineLevel: 'high',
        steepTempCelsius: 95,
        steepTimeSeconds: 180,
      })

      const response = await request(app).get('/teas?type=green')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].type).toBe('green')
    })

    it('should filter teas by caffeine level', async () => {
      await request(app).post('/teas').send({
        name: 'Chamomile',
        type: 'herbal',
        caffeineLevel: 'none',
        steepTempCelsius: 100,
        steepTimeSeconds: 300,
      })
      await request(app).post('/teas').send({
        name: 'Earl Grey',
        type: 'black',
        caffeineLevel: 'high',
        steepTempCelsius: 95,
        steepTimeSeconds: 180,
      })

      const response = await request(app).get('/teas?caffeineLevel=none')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].caffeineLevel).toBe('none')
    })

    it('should paginate results correctly', async () => {
      // Create 5 teas
      for (let i = 0; i < 5; i++) {
        await request(app).post('/teas').send({
          name: `Tea ${i}`,
          type: 'green',
          caffeineLevel: 'medium',
          steepTempCelsius: 80,
          steepTimeSeconds: 180,
        })
      }

      const response = await request(app).get('/teas?page=1&limit=2')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
      })
    })

    it('should return second page of results', async () => {
      // Create 5 teas
      for (let i = 0; i < 5; i++) {
        await request(app).post('/teas').send({
          name: `Tea ${i}`,
          type: 'green',
          caffeineLevel: 'medium',
          steepTempCelsius: 80,
          steepTimeSeconds: 180,
        })
      }

      const response = await request(app).get('/teas?page=2&limit=2')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.pagination.page).toBe(2)
    })
  })

  describe('POST /teas', () => {
    it('should create a new tea with required fields', async () => {
      const response = await request(app).post('/teas').send({
        name: 'Jasmine Green',
        type: 'green',
        steepTempCelsius: 80,
        steepTimeSeconds: 180,
      })

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        name: 'Jasmine Green',
        type: 'green',
        caffeineLevel: 'medium', // default value
        steepTempCelsius: 80,
        steepTimeSeconds: 180,
        description: null, // default value
      })
      expect(response.body.id).toBeDefined()
      expect(response.body.createdAt).toBeDefined()
      expect(response.body.updatedAt).toBeDefined()
    })

    it('should create a tea with all fields', async () => {
      const response = await request(app).post('/teas').send({
        name: 'Da Hong Pao',
        type: 'oolong',
        origin: 'Wuyi Mountains, China',
        caffeineLevel: 'medium',
        steepTempCelsius: 95,
        steepTimeSeconds: 30,
        description: 'A famous Chinese rock tea',
      })

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        name: 'Da Hong Pao',
        type: 'oolong',
        origin: 'Wuyi Mountains, China',
        caffeineLevel: 'medium',
        steepTempCelsius: 95,
        steepTimeSeconds: 30,
        description: 'A famous Chinese rock tea',
      })
    })

    it('should return 400 for missing required fields', async () => {
      const response = await request(app).post('/teas').send({
        name: 'Incomplete Tea',
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
      expect(response.body.message).toBe('Invalid request body')
    })

    it('should return 400 for invalid tea type', async () => {
      const response = await request(app).post('/teas').send({
        name: 'Invalid Tea',
        type: 'invalid',
        steepTempCelsius: 80,
        steepTimeSeconds: 180,
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid caffeine level', async () => {
      const response = await request(app).post('/teas').send({
        name: 'Invalid Tea',
        type: 'green',
        caffeineLevel: 'extreme',
        steepTempCelsius: 80,
        steepTimeSeconds: 180,
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for steep temperature below minimum', async () => {
      const response = await request(app).post('/teas').send({
        name: 'Cold Tea',
        type: 'green',
        steepTempCelsius: 50, // min is 60
        steepTimeSeconds: 180,
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for steep temperature above maximum', async () => {
      const response = await request(app).post('/teas').send({
        name: 'Hot Tea',
        type: 'green',
        steepTempCelsius: 120, // max is 100
        steepTimeSeconds: 180,
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for steep time exceeding maximum', async () => {
      const response = await request(app).post('/teas').send({
        name: 'Long Steep Tea',
        type: 'green',
        steepTempCelsius: 80,
        steepTimeSeconds: 700, // max is 600
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for empty name', async () => {
      const response = await request(app).post('/teas').send({
        name: '',
        type: 'green',
        steepTempCelsius: 80,
        steepTimeSeconds: 180,
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /teas/:id', () => {
    it('should return a tea by id', async () => {
      const createResponse = await request(app).post('/teas').send({
        name: 'Test Tea',
        type: 'black',
        steepTempCelsius: 95,
        steepTimeSeconds: 240,
      })

      const teaId = createResponse.body.id

      const response = await request(app).get(`/teas/${teaId}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(teaId)
      expect(response.body.name).toBe('Test Tea')
    })

    it('should return 404 for non-existent tea', async () => {
      const response = await request(app).get(
        '/teas/00000000-0000-0000-0000-000000000000'
      )

      expect(response.status).toBe(404)
      expect(response.body.code).toBe('NOT_FOUND')
      expect(response.body.message).toBe('Tea not found')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).get('/teas/invalid-uuid')

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
      expect(response.body.message).toBe('Invalid tea ID format')
    })
  })

  describe('PUT /teas/:id', () => {
    it('should update a tea completely', async () => {
      const createResponse = await request(app).post('/teas').send({
        name: 'Original Tea',
        type: 'green',
        steepTempCelsius: 80,
        steepTimeSeconds: 180,
        description: null,
      })

      const teaId = createResponse.body.id

      const response = await request(app).put(`/teas/${teaId}`).send({
        name: 'Updated Tea',
        type: 'black',
        origin: 'India',
        caffeineLevel: 'high',
        steepTempCelsius: 100,
        steepTimeSeconds: 240,
        description: 'Updated description',
      })

      expect(response.status).toBe(200)
      expect(response.body.name).toBe('Updated Tea')
      expect(response.body.type).toBe('black')
      expect(response.body.origin).toBe('India')
      expect(response.body.caffeineLevel).toBe('high')
      expect(response.body.steepTempCelsius).toBe(100)
      expect(response.body.steepTimeSeconds).toBe(240)
      expect(response.body.description).toBe('Updated description')
    })

    it('should return 404 for non-existent tea', async () => {
      const response = await request(app)
        .put('/teas/00000000-0000-0000-0000-000000000000')
        .send({
          name: 'Updated Tea',
          type: 'black',
          caffeineLevel: 'high',
          steepTempCelsius: 100,
          steepTimeSeconds: 240,
          description: null,
        })

      expect(response.status).toBe(404)
      expect(response.body.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).put('/teas/invalid-uuid').send({
        name: 'Updated Tea',
        type: 'black',
        caffeineLevel: 'high',
        steepTempCelsius: 100,
        steepTimeSeconds: 240,
        description: null,
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for missing required fields in update', async () => {
      const createResponse = await request(app).post('/teas').send({
        name: 'Original Tea',
        type: 'green',
        steepTempCelsius: 80,
        steepTimeSeconds: 180,
      })

      const teaId = createResponse.body.id

      const response = await request(app).put(`/teas/${teaId}`).send({
        name: 'Updated Tea',
        // missing other required fields
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('PATCH /teas/:id', () => {
    it('should partially update a tea', async () => {
      const createResponse = await request(app).post('/teas').send({
        name: 'Original Tea',
        type: 'green',
        steepTempCelsius: 80,
        steepTimeSeconds: 180,
      })

      const teaId = createResponse.body.id

      const response = await request(app).patch(`/teas/${teaId}`).send({
        name: 'Partially Updated Tea',
      })

      expect(response.status).toBe(200)
      expect(response.body.name).toBe('Partially Updated Tea')
      expect(response.body.type).toBe('green') // unchanged
      expect(response.body.steepTempCelsius).toBe(80) // unchanged
    })

    it('should update multiple fields', async () => {
      const createResponse = await request(app).post('/teas').send({
        name: 'Original Tea',
        type: 'green',
        steepTempCelsius: 80,
        steepTimeSeconds: 180,
      })

      const teaId = createResponse.body.id

      const response = await request(app).patch(`/teas/${teaId}`).send({
        name: 'Updated Name',
        type: 'oolong',
        description: 'New description',
      })

      expect(response.status).toBe(200)
      expect(response.body.name).toBe('Updated Name')
      expect(response.body.type).toBe('oolong')
      expect(response.body.description).toBe('New description')
      expect(response.body.steepTempCelsius).toBe(80) // unchanged
    })

    it('should return 404 for non-existent tea', async () => {
      const response = await request(app)
        .patch('/teas/00000000-0000-0000-0000-000000000000')
        .send({
          name: 'Updated Tea',
        })

      expect(response.status).toBe(404)
      expect(response.body.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).patch('/teas/invalid-uuid').send({
        name: 'Updated Tea',
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid field values', async () => {
      const createResponse = await request(app).post('/teas').send({
        name: 'Original Tea',
        type: 'green',
        steepTempCelsius: 80,
        steepTimeSeconds: 180,
      })

      const teaId = createResponse.body.id

      const response = await request(app).patch(`/teas/${teaId}`).send({
        type: 'invalid', // invalid type
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('DELETE /teas/:id', () => {
    it('should delete a tea', async () => {
      const createResponse = await request(app).post('/teas').send({
        name: 'Tea to Delete',
        type: 'green',
        steepTempCelsius: 80,
        steepTimeSeconds: 180,
      })

      const teaId = createResponse.body.id

      const deleteResponse = await request(app).delete(`/teas/${teaId}`)
      expect(deleteResponse.status).toBe(204)

      // Verify it is actually deleted
      const getResponse = await request(app).get(`/teas/${teaId}`)
      expect(getResponse.status).toBe(404)
    })

    it('should return 404 for non-existent tea', async () => {
      const response = await request(app).delete(
        '/teas/00000000-0000-0000-0000-000000000000'
      )

      expect(response.status).toBe(404)
      expect(response.body.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).delete('/teas/invalid-uuid')

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })
  })
})
