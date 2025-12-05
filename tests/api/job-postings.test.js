/**
 * @jest-environment node
 */
import handler from '@/pages/api/job-postings'
import { createMocks } from 'node-mocks-http'

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn(),
}

jest.mock('@/components/Supabase', () => mockSupabaseClient)

describe('/api/job-postings API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET Method', () => {
    it('should fetch all job postings successfully', async () => {
      const mockJobs = [
        { id: 1, jobTitle: 'Software Engineer', jobDesc: 'Build great software', is_Open: true },
        { id: 2, jobTitle: 'Project Manager', jobDesc: 'Manage projects', is_Open: true },
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockJobs,
          error: null,
        }),
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(JSON.parse(res._getData())).toEqual(mockJobs)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('jobs')
    })

    it('should handle database errors on GET', async () => {
      const mockError = { message: 'Database connection failed' }

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Error fetching job postings',
        error: mockError,
      })
    })
  })

  describe('POST Method', () => {
    it('should create a new job posting successfully', async () => {
      const newJob = {
        jobTitle: 'Frontend Developer',
        jobDesc: 'Build amazing UIs',
        is_Open: true,
      }

      const mockCreatedJob = { id: 3, ...newJob }

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: mockCreatedJob,
          error: null,
        }),
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: newJob,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(JSON.parse(res._getData())).toEqual(mockCreatedJob)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('jobs')
    })

    it('should handle validation errors on POST', async () => {
      const invalidJob = {
        jobTitle: '', // Invalid: empty title
        jobDesc: 'Some description',
        is_Open: true,
      }

      const { req, res } = createMocks({
        method: 'POST',
        body: invalidJob,
      })

      // Even with empty title, the API should attempt to insert
      // The validation should happen at database level or be added to the API
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Invalid job title' },
        }),
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Error adding job',
        error: { message: 'Invalid job title' },
      })
    })

    it('should handle database errors on POST', async () => {
      const newJob = {
        jobTitle: 'Backend Developer',
        jobDesc: 'Build robust APIs',
        is_Open: true,
      }

      const mockError = { message: 'Database write failed' }

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: newJob,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Error adding job',
        error: mockError,
      })
    })
  })

  describe('PUT Method', () => {
    it('should update job posting status successfully', async () => {
      const updateData = {
        id: 1,
        is_Open: false,
      }

      const mockUpdatedJob = { id: 1, is_Open: false }

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockUpdatedJob,
            error: null,
          }),
        }),
      })

      const { req, res } = createMocks({
        method: 'PUT',
        body: updateData,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(JSON.parse(res._getData())).toEqual(mockUpdatedJob)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('jobs')
    })

    it('should handle missing ID in PUT request', async () => {
      const updateData = {
        // Missing id field
        is_Open: false,
      }

      const { req, res } = createMocks({
        method: 'PUT',
        body: updateData,
      })

      // The API doesn't validate ID presence, so it will pass undefined to Supabase
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Invalid ID' },
          }),
        }),
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })

    it('should handle database errors on PUT', async () => {
      const updateData = {
        id: 1,
        is_Open: false,
      }

      const mockError = { message: 'Record not found' }

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      })

      const { req, res } = createMocks({
        method: 'PUT',
        body: updateData,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Error updating job',
        error: mockError,
      })
    })
  })

  describe('Unsupported Methods', () => {
    it('should return 405 for DELETE method', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Method not allowed',
      })
    })

    it('should return 405 for PATCH method', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Method not allowed',
      })
    })
  })

  describe('Request Body Validation', () => {
    it('should handle empty request body for POST', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {}, // Empty body
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Required fields missing' },
        }),
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })

    it('should handle malformed JSON in request body', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        // body will be undefined/null for malformed JSON
      })

      // The handler should handle undefined body gracefully
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Invalid request data' },
        }),
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long job descriptions', async () => {
      const longJob = {
        jobTitle: 'Test Position',
        jobDesc: 'A'.repeat(10000), // Very long description
        is_Open: true,
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: { id: 1, ...longJob },
          error: null,
        }),
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: longJob,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle special characters in job data', async () => {
      const specialJob = {
        jobTitle: 'Senior Engineer & Architect (Remote) - $100k+',
        jobDesc: 'Must know: React, Node.js, SQL & NoSQL databases. Benefits: 401k, health insurance, etc.',
        is_Open: true,
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: { id: 1, ...specialJob },
          error: null,
        }),
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: specialJob,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle concurrent requests appropriately', async () => {
      // Test that multiple simultaneous requests don't interfere
      const job1 = { jobTitle: 'Job 1', jobDesc: 'Desc 1', is_Open: true }
      const job2 = { jobTitle: 'Job 2', jobDesc: 'Desc 2', is_Open: true }

      mockSupabaseClient.from
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({
            data: { id: 1, ...job1 },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({
            data: { id: 2, ...job2 },
            error: null,
          }),
        })

      const { req: req1, res: res1 } = createMocks({ method: 'POST', body: job1 })
      const { req: req2, res: res2 } = createMocks({ method: 'POST', body: job2 })

      await Promise.all([handler(req1, res1), handler(req2, res2)])

      expect(res1._getStatusCode()).toBe(200)
      expect(res2._getStatusCode()).toBe(200)
    })
  })
})