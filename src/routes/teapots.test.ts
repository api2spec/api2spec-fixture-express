import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../app.js'
import { teapots } from './teapots.js'

const app = createApp()

describe('Teapots API', () => {
  beforeEach(() => {
    // Clear the in-memory store before each test
    teapots.clear()
  })

  describe('GET /teapots', () => {
    it('should return empty list when no teapots exist', async () => {
      const response = await request(app).get('/teapots')

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual([])
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      })
    })

    it('should return list of teapots with pagination', async () => {
      // Create some teapots first
      await request(app).post('/teapots').send({
        name: 'Ceramic Pot',
        material: 'ceramic',
        capacityMl: 500,
        style: 'english',
      })
      await request(app).post('/teapots').send({
        name: 'Glass Pot',
        material: 'glass',
        capacityMl: 750,
        style: 'english',
      })

      const response = await request(app).get('/teapots')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.pagination.total).toBe(2)
    })

    it('should filter teapots by material', async () => {
      await request(app).post('/teapots').send({
        name: 'Ceramic Pot',
        material: 'ceramic',
        capacityMl: 500,
        style: 'english',
      })
      await request(app).post('/teapots').send({
        name: 'Glass Pot',
        material: 'glass',
        capacityMl: 750,
        style: 'english',
      })

      const response = await request(app).get('/teapots?material=ceramic')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].material).toBe('ceramic')
    })

    it('should filter teapots by style', async () => {
      await request(app).post('/teapots').send({
        name: 'Kyusu Pot',
        material: 'ceramic',
        capacityMl: 300,
        style: 'kyusu',
      })
      await request(app).post('/teapots').send({
        name: 'English Pot',
        material: 'porcelain',
        capacityMl: 750,
        style: 'english',
      })

      const response = await request(app).get('/teapots?style=kyusu')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].style).toBe('kyusu')
    })

    it('should paginate results correctly', async () => {
      // Create 5 teapots
      for (let i = 0; i < 5; i++) {
        await request(app).post('/teapots').send({
          name: `Teapot ${i}`,
          material: 'ceramic',
          capacityMl: 500,
          style: 'english',
        })
      }

      const response = await request(app).get('/teapots?page=1&limit=2')

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
      // Create 5 teapots
      for (let i = 0; i < 5; i++) {
        await request(app).post('/teapots').send({
          name: `Teapot ${i}`,
          material: 'ceramic',
          capacityMl: 500,
          style: 'english',
        })
      }

      const response = await request(app).get('/teapots?page=2&limit=2')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.pagination.page).toBe(2)
    })
  })

  describe('POST /teapots', () => {
    it('should create a new teapot with required fields', async () => {
      const response = await request(app).post('/teapots').send({
        name: 'My Teapot',
        material: 'ceramic',
        capacityMl: 500,
      })

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        name: 'My Teapot',
        material: 'ceramic',
        capacityMl: 500,
        style: 'english', // default value
        description: null, // default value
      })
      expect(response.body.id).toBeDefined()
      expect(response.body.createdAt).toBeDefined()
      expect(response.body.updatedAt).toBeDefined()
    })

    it('should create a teapot with all fields', async () => {
      const response = await request(app).post('/teapots').send({
        name: 'Yixing Clay Pot',
        material: 'clay',
        capacityMl: 150,
        style: 'yixing',
        description: 'Traditional Chinese teapot',
      })

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        name: 'Yixing Clay Pot',
        material: 'clay',
        capacityMl: 150,
        style: 'yixing',
        description: 'Traditional Chinese teapot',
      })
    })

    it('should return 400 for missing required fields', async () => {
      const response = await request(app).post('/teapots').send({
        name: 'Incomplete Pot',
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
      expect(response.body.message).toBe('Invalid request body')
    })

    it('should return 400 for invalid material', async () => {
      const response = await request(app).post('/teapots').send({
        name: 'Invalid Pot',
        material: 'plastic',
        capacityMl: 500,
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid capacity', async () => {
      const response = await request(app).post('/teapots').send({
        name: 'Too Big Pot',
        material: 'ceramic',
        capacityMl: 10000, // exceeds max of 5000
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for negative capacity', async () => {
      const response = await request(app).post('/teapots').send({
        name: 'Negative Pot',
        material: 'ceramic',
        capacityMl: -100,
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for empty name', async () => {
      const response = await request(app).post('/teapots').send({
        name: '',
        material: 'ceramic',
        capacityMl: 500,
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /teapots/:id', () => {
    it('should return a teapot by id', async () => {
      const createResponse = await request(app).post('/teapots').send({
        name: 'Test Pot',
        material: 'glass',
        capacityMl: 600,
        style: 'english',
      })

      const teapotId = createResponse.body.id

      const response = await request(app).get(`/teapots/${teapotId}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(teapotId)
      expect(response.body.name).toBe('Test Pot')
    })

    it('should return 404 for non-existent teapot', async () => {
      const response = await request(app).get(
        '/teapots/00000000-0000-0000-0000-000000000000'
      )

      expect(response.status).toBe(404)
      expect(response.body.code).toBe('NOT_FOUND')
      expect(response.body.message).toBe('Teapot not found')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).get('/teapots/invalid-uuid')

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
      expect(response.body.message).toBe('Invalid teapot ID format')
    })
  })

  describe('PUT /teapots/:id', () => {
    it('should update a teapot completely', async () => {
      const createResponse = await request(app).post('/teapots').send({
        name: 'Original Pot',
        material: 'ceramic',
        capacityMl: 500,
        style: 'english',
        description: null,
      })

      const teapotId = createResponse.body.id

      const response = await request(app).put(`/teapots/${teapotId}`).send({
        name: 'Updated Pot',
        material: 'glass',
        capacityMl: 750,
        style: 'gaiwan',
        description: 'Updated description',
      })

      expect(response.status).toBe(200)
      expect(response.body.name).toBe('Updated Pot')
      expect(response.body.material).toBe('glass')
      expect(response.body.capacityMl).toBe(750)
      expect(response.body.style).toBe('gaiwan')
      expect(response.body.description).toBe('Updated description')
    })

    it('should return 404 for non-existent teapot', async () => {
      const response = await request(app)
        .put('/teapots/00000000-0000-0000-0000-000000000000')
        .send({
          name: 'Updated Pot',
          material: 'glass',
          capacityMl: 750,
          style: 'gaiwan',
          description: null,
        })

      expect(response.status).toBe(404)
      expect(response.body.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).put('/teapots/invalid-uuid').send({
        name: 'Updated Pot',
        material: 'glass',
        capacityMl: 750,
        style: 'gaiwan',
        description: null,
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for missing required fields in update', async () => {
      const createResponse = await request(app).post('/teapots').send({
        name: 'Original Pot',
        material: 'ceramic',
        capacityMl: 500,
      })

      const teapotId = createResponse.body.id

      const response = await request(app).put(`/teapots/${teapotId}`).send({
        name: 'Updated Pot',
        // missing other required fields
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('PATCH /teapots/:id', () => {
    it('should partially update a teapot', async () => {
      const createResponse = await request(app).post('/teapots').send({
        name: 'Original Pot',
        material: 'ceramic',
        capacityMl: 500,
        style: 'english',
      })

      const teapotId = createResponse.body.id

      const response = await request(app).patch(`/teapots/${teapotId}`).send({
        name: 'Partially Updated Pot',
      })

      expect(response.status).toBe(200)
      expect(response.body.name).toBe('Partially Updated Pot')
      expect(response.body.material).toBe('ceramic') // unchanged
      expect(response.body.capacityMl).toBe(500) // unchanged
    })

    it('should update multiple fields', async () => {
      const createResponse = await request(app).post('/teapots').send({
        name: 'Original Pot',
        material: 'ceramic',
        capacityMl: 500,
        style: 'english',
      })

      const teapotId = createResponse.body.id

      const response = await request(app).patch(`/teapots/${teapotId}`).send({
        name: 'Updated Name',
        material: 'glass',
        description: 'New description',
      })

      expect(response.status).toBe(200)
      expect(response.body.name).toBe('Updated Name')
      expect(response.body.material).toBe('glass')
      expect(response.body.description).toBe('New description')
      expect(response.body.capacityMl).toBe(500) // unchanged
    })

    it('should return 404 for non-existent teapot', async () => {
      const response = await request(app)
        .patch('/teapots/00000000-0000-0000-0000-000000000000')
        .send({
          name: 'Updated Pot',
        })

      expect(response.status).toBe(404)
      expect(response.body.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).patch('/teapots/invalid-uuid').send({
        name: 'Updated Pot',
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid field values', async () => {
      const createResponse = await request(app).post('/teapots').send({
        name: 'Original Pot',
        material: 'ceramic',
        capacityMl: 500,
      })

      const teapotId = createResponse.body.id

      const response = await request(app).patch(`/teapots/${teapotId}`).send({
        material: 'plastic', // invalid material
      })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('DELETE /teapots/:id', () => {
    it('should delete a teapot', async () => {
      const createResponse = await request(app).post('/teapots').send({
        name: 'Pot to Delete',
        material: 'ceramic',
        capacityMl: 500,
      })

      const teapotId = createResponse.body.id

      const deleteResponse = await request(app).delete(`/teapots/${teapotId}`)
      expect(deleteResponse.status).toBe(204)

      // Verify it is actually deleted
      const getResponse = await request(app).get(`/teapots/${teapotId}`)
      expect(getResponse.status).toBe(404)
    })

    it('should return 404 for non-existent teapot', async () => {
      const response = await request(app).delete(
        '/teapots/00000000-0000-0000-0000-000000000000'
      )

      expect(response.status).toBe(404)
      expect(response.body.code).toBe('NOT_FOUND')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).delete('/teapots/invalid-uuid')

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })
  })
})
