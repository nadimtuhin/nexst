/**
 * Integration tests for API routes
 * These tests verify the end-to-end functionality of the API endpoints
 */
import 'reflect-metadata'
import { NextRequest } from 'next/server'
import { GET as healthGET } from '../health/route'
import { GET as usersGET, POST as usersPOST } from '../users/route'
import { GET as userGET, PUT as userPUT, DELETE as userDELETE } from '../users/[id]/route'
import { container } from '@/server/container/container'

describe('API Integration Tests', () => {
  beforeEach(() => {
    // Clear DI container before each test
    container.clearInstances()
  })

  describe('Health Endpoint', () => {
    describe('GET /api/health', () => {
      it('should return health status', async () => {
        const response = await healthGET()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.status).toBe('ok')
        expect(data.service).toBe('nexst-api')
        expect(data.timestamp).toBeDefined()
      })

      it('should return valid ISO timestamp', async () => {
        const response = await healthGET()
        const data = await response.json()

        const timestamp = new Date(data.timestamp)
        expect(timestamp.toISOString()).toBe(data.timestamp)
      })

      it('should return fresh timestamp on each call', async () => {
        const response1 = await healthGET()
        const data1 = await response1.json()

        await new Promise(resolve => setTimeout(resolve, 10))

        const response2 = await healthGET()
        const data2 = await response2.json()

        expect(data1.timestamp).not.toBe(data2.timestamp)
      })
    })
  })

  describe('Users Endpoints', () => {
    describe('POST /api/users', () => {
      it('should create a new user', async () => {
        const request = new NextRequest('http://localhost/api/users', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john.integration@example.com',
            age: 30,
          }),
        })

        const response = await usersPOST(request)
        const result = await response.json()

        expect(response.status).toBe(200)
        expect(result.data).toBeDefined()
        expect(result.data.name).toBe('John Doe')
        expect(result.data.email).toBe('john.integration@example.com')
        expect(result.message).toBe('User created successfully')
      })

      it('should validate email format', async () => {
        const request = new NextRequest('http://localhost/api/users', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Invalid User',
            email: 'invalid-email',
          }),
        })

        const response = await usersPOST(request)

        expect(response.status).toBe(400)
      })

      it('should validate minimum age', async () => {
        const request = new NextRequest('http://localhost/api/users', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Young User',
            email: 'young@example.com',
            age: 16,
          }),
        })

        const response = await usersPOST(request)

        expect(response.status).toBe(400)
      })
    })

    describe('GET /api/users', () => {
      it('should get all users', async () => {
        const request = new NextRequest('http://localhost/api/users')

        const response = await usersGET(request)
        const result = await response.json()

        expect(response.status).toBe(200)
        expect(result.data).toBeInstanceOf(Array)
        expect(result).toHaveProperty('total')
      })

      it('should support search parameter', async () => {
        const request = new NextRequest('http://localhost/api/users?search=John')

        const response = await usersGET(request)
        const result = await response.json()

        expect(response.status).toBe(200)
        expect(result.data).toBeInstanceOf(Array)
      })
    })

    describe('GET /api/users/:id', () => {
      it('should get user by id', async () => {
        const request = new NextRequest('http://localhost/api/users/1')

        const response = await userGET(request, { params: { id: '1' } })
        const result = await response.json()

        expect(response.status).toBe(200)
        expect(result.data).toBeDefined()
        expect(result.data.id).toBe(1)
      })

      it('should return 404 for non-existent user', async () => {
        const request = new NextRequest('http://localhost/api/users/999')

        const response = await userGET(request, { params: { id: '999' } })

        expect(response.status).toBe(404)
      })
    })

    describe('PUT /api/users/:id', () => {
      it('should update user', async () => {
        const request = new NextRequest('http://localhost/api/users/1', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Updated Name',
          }),
        })

        const response = await userPUT(request, { params: { id: '1' } })
        const result = await response.json()

        expect(response.status).toBe(200)
        expect(result.data.name).toBe('Updated Name')
        expect(result.message).toBe('User updated successfully')
      })

      it('should validate updated data', async () => {
        const request = new NextRequest('http://localhost/api/users/1', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: 'invalid-email',
          }),
        })

        const response = await userPUT(request, { params: { id: '1' } })

        expect(response.status).toBe(400)
      })

      it('should return 404 for non-existent user', async () => {
        const request = new NextRequest('http://localhost/api/users/999', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Updated',
          }),
        })

        const response = await userPUT(request, { params: { id: '999' } })

        expect(response.status).toBe(404)
      })
    })

    describe('DELETE /api/users/:id', () => {
      it('should delete user', async () => {
        // First create a user to delete
        const createRequest = new NextRequest('http://localhost/api/users', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'To Be Deleted',
            email: 'delete.integration@example.com',
          }),
        })

        const createResponse = await usersPOST(createRequest)
        const createResult = await createResponse.json()
        const userId = createResult.data.id

        // Now delete it
        const deleteRequest = new NextRequest(`http://localhost/api/users/${userId}`, {
          method: 'DELETE',
        })

        const deleteResponse = await userDELETE(deleteRequest, { params: { id: userId.toString() } })
        const deleteResult = await deleteResponse.json()

        expect(deleteResponse.status).toBe(200)
        expect(deleteResult.message).toBe('User deleted successfully')

        // Verify it's deleted
        const getRequest = new NextRequest(`http://localhost/api/users/${userId}`)
        const getResponse = await userGET(getRequest, { params: { id: userId.toString() } })

        expect(getResponse.status).toBe(404)
      })

      it('should return 404 for non-existent user', async () => {
        const request = new NextRequest('http://localhost/api/users/999', {
          method: 'DELETE',
        })

        const response = await userDELETE(request, { params: { id: '999' } })

        expect(response.status).toBe(404)
      })
    })

    describe('Full User Lifecycle', () => {
      it('should create, read, update, and delete a user', async () => {
        // Create
        const createRequest = new NextRequest('http://localhost/api/users', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Lifecycle Test',
            email: 'lifecycle.integration@example.com',
            age: 30,
          }),
        })

        const createResponse = await usersPOST(createRequest)
        const createData = await createResponse.json()
        const userId = createData.data.id

        expect(createResponse.status).toBe(200)
        expect(createData.data.name).toBe('Lifecycle Test')

        // Read
        const readRequest = new NextRequest(`http://localhost/api/users/${userId}`)
        const readResponse = await userGET(readRequest, { params: { id: userId.toString() } })
        const readData = await readResponse.json()

        expect(readResponse.status).toBe(200)
        expect(readData.data.id).toBe(userId)

        // Update
        const updateRequest = new NextRequest(`http://localhost/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Lifecycle Updated',
            age: 31,
          }),
        })

        const updateResponse = await userPUT(updateRequest, { params: { id: userId.toString() } })
        const updateData = await updateResponse.json()

        expect(updateResponse.status).toBe(200)
        expect(updateData.data.name).toBe('Lifecycle Updated')
        expect(updateData.data.age).toBe(31)

        // Delete
        const deleteRequest = new NextRequest(`http://localhost/api/users/${userId}`, {
          method: 'DELETE',
        })

        const deleteResponse = await userDELETE(deleteRequest, { params: { id: userId.toString() } })

        expect(deleteResponse.status).toBe(200)

        // Verify deletion
        const verifyRequest = new NextRequest(`http://localhost/api/users/${userId}`)
        const verifyResponse = await userGET(verifyRequest, { params: { id: userId.toString() } })

        expect(verifyResponse.status).toBe(404)
      })
    })
  })
})
