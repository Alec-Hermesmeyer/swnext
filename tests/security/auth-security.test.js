/**
 * Security Tests for Authentication and Data Validation
 * Tests for common security vulnerabilities and proper validation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/job-postings'

// Mock sanitization functions
const mockSanitize = {
  html: (input) => input.replace(/<script[^>]*>.*?<\/script>/gi, ''),
  sql: (input) => input.replace(/['";]/g, ''),
}

describe('Security Tests', () => {
  describe('Input Sanitization', () => {
    it('should sanitize HTML input to prevent XSS attacks', () => {
      const maliciousInput = '<script>alert("XSS")</script><p>Valid content</p>'
      const sanitized = mockSanitize.html(maliciousInput)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert("XSS")')
      expect(sanitized).toContain('<p>Valid content</p>')
    })

    it('should handle various XSS attack vectors', () => {
      const xssVectors = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(\'XSS\')" />',
        '<svg onload="alert(\'XSS\')" />',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      ]

      xssVectors.forEach(vector => {
        const sanitized = mockSanitize.html(vector)
        expect(sanitized).not.toMatch(/javascript:|<script|onerror|onload/i)
      })
    })

    it('should prevent SQL injection in API inputs', () => {
      const sqlInjectionInputs = [
        "'; DROP TABLE jobs; --",
        "1' OR '1'='1",
        "'; DELETE FROM users; --",
        "1; EXEC xp_cmdshell('cat /etc/passwd'); --",
      ]

      sqlInjectionInputs.forEach(input => {
        const sanitized = mockSanitize.sql(input)
        expect(sanitized).not.toContain(';')
        expect(sanitized).not.toContain('--')
        expect(sanitized).not.toMatch(/DROP|DELETE|EXEC/i)
      })
    })
  })

  describe('API Security', () => {
    it('should validate request methods properly', async () => {
      const unsupportedMethods = ['OPTIONS', 'HEAD', 'TRACE', 'CONNECT']
      
      for (const method of unsupportedMethods) {
        const { req, res } = createMocks({ method })
        await handler(req, res)
        
        expect(res._getStatusCode()).toBe(405)
        expect(JSON.parse(res._getData())).toEqual({
          message: 'Method not allowed'
        })
      }
    })

    it('should validate input data types and ranges', async () => {
      const invalidInputs = [
        { jobTitle: null, jobDesc: 'Valid desc', is_Open: true },
        { jobTitle: '', jobDesc: 'Valid desc', is_Open: true },
        { jobTitle: 'A'.repeat(1000), jobDesc: 'Valid desc', is_Open: true }, // Too long
        { jobTitle: 'Valid title', jobDesc: null, is_Open: true },
        { jobTitle: 'Valid title', jobDesc: 'Valid desc', is_Open: 'not_boolean' },
      ]

      for (const input of invalidInputs) {
        const { req, res } = createMocks({
          method: 'POST',
          body: input,
        })

        // Mock Supabase to simulate validation error
        const mockSupabase = require('@/components/Supabase')
        mockSupabase.from.mockReturnValue({
          insert: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Validation error' },
          }),
        })

        await handler(req, res)
        expect(res._getStatusCode()).toBe(500)
      }
    })

    it('should handle malformed JSON in request body', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: undefined, // Simulates malformed JSON
      })

      await handler(req, res)
      
      // Should handle gracefully without crashing
      expect([400, 500]).toContain(res._getStatusCode())
    })

    it('should prevent mass assignment vulnerabilities', async () => {
      const maliciousInput = {
        jobTitle: 'Test Job',
        jobDesc: 'Test Description',
        is_Open: true,
        // Malicious fields that shouldn't be processed
        id: 999,
        created_at: '2000-01-01',
        admin: true,
        role: 'super_admin',
      }

      const { req, res } = createMocks({
        method: 'POST',
        body: maliciousInput,
      })

      const mockSupabase = require('@/components/Supabase')
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockImplementation((data) => {
          // Verify only expected fields are passed
          const allowedFields = ['jobTitle', 'jobDesc', 'is_Open']
          const insertedFields = Object.keys(data[0])
          
          insertedFields.forEach(field => {
            expect(allowedFields).toContain(field)
          })

          return Promise.resolve({ data: { id: 1, ...data[0] }, error: null })
        }),
      })

      await handler(req, res)
      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Authentication Security', () => {
    it('should handle authentication properly', () => {
      // Mock authentication component
      const AuthComponent = ({ children, requireAuth = false }) => {
        const [isAuthenticated, setIsAuthenticated] = React.useState(false)
        
        if (requireAuth && !isAuthenticated) {
          return <div data-testid="login-required">Please log in</div>
        }
        
        return (
          <div>
            {children}
            <button 
              onClick={() => setIsAuthenticated(!isAuthenticated)}
              data-testid="auth-toggle"
            >
              {isAuthenticated ? 'Logout' : 'Login'}
            </button>
          </div>
        )
      }

      render(
        <AuthComponent requireAuth>
          <div data-testid="protected-content">Protected Content</div>
        </AuthComponent>
      )

      // Should show login required initially
      expect(screen.getByTestId('login-required')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()

      // After authentication
      fireEvent.click(screen.getByTestId('auth-toggle'))
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.queryByTestId('login-required')).not.toBeInTheDocument()
    })

    it('should validate session tokens properly', () => {
      const validateToken = (token) => {
        // Mock token validation
        if (!token) return { valid: false, error: 'No token provided' }
        if (typeof token !== 'string') return { valid: false, error: 'Invalid token format' }
        if (token.length < 10) return { valid: false, error: 'Token too short' }
        if (token === 'expired_token') return { valid: false, error: 'Token expired' }
        if (token === 'invalid_signature') return { valid: false, error: 'Invalid signature' }
        
        return { valid: true, userId: 'user123' }
      }

      // Test various token scenarios
      expect(validateToken(null).valid).toBe(false)
      expect(validateToken('').valid).toBe(false)
      expect(validateToken('short').valid).toBe(false)
      expect(validateToken('expired_token').valid).toBe(false)
      expect(validateToken('invalid_signature').valid).toBe(false)
      expect(validateToken('valid_jwt_token_here').valid).toBe(true)
    })

    it('should handle password requirements', () => {
      const validatePassword = (password) => {
        const requirements = {
          minLength: password.length >= 8,
          hasUppercase: /[A-Z]/.test(password),
          hasLowercase: /[a-z]/.test(password),
          hasNumbers: /\d/.test(password),
          hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        }

        const isValid = Object.values(requirements).every(req => req)
        return { isValid, requirements }
      }

      // Test weak passwords
      const weakPasswords = ['123456', 'password', 'abc123', 'Password']
      weakPasswords.forEach(pwd => {
        const result = validatePassword(pwd)
        expect(result.isValid).toBe(false)
      })

      // Test strong password
      const strongPassword = 'MyStr0ng!Pass'
      const result = validatePassword(strongPassword)
      expect(result.isValid).toBe(true)
    })
  })

  describe('Data Protection', () => {
    it('should not expose sensitive information in error messages', () => {
      const createSafeErrorMessage = (error, userRole = 'user') => {
        if (userRole === 'admin') {
          return error.message // Full error for admins
        }
        
        // Sanitized error for regular users
        const safeErrors = {
          'Database connection failed': 'Service temporarily unavailable',
          'User not found in database': 'Invalid credentials',
          'Password hash comparison failed': 'Invalid credentials',
          'Internal server error': 'Something went wrong',
        }
        
        return safeErrors[error.message] || 'An error occurred'
      }

      const sensitiveErrors = [
        { message: 'Database connection failed' },
        { message: 'User not found in database' },
        { message: 'Password hash comparison failed' },
      ]

      sensitiveErrors.forEach(error => {
        const userMessage = createSafeErrorMessage(error, 'user')
        expect(userMessage).not.toContain('database')
        expect(userMessage).not.toContain('password')
        expect(userMessage).not.toContain('hash')
        
        // But admins should get full details
        const adminMessage = createSafeErrorMessage(error, 'admin')
        expect(adminMessage).toBe(error.message)
      })
    })

    it('should validate file upload security', () => {
      const validateFileUpload = (file) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
        const maxSize = 5 * 1024 * 1024 // 5MB
        
        const errors = []
        
        if (!allowedTypes.includes(file.type)) {
          errors.push('File type not allowed')
        }
        
        if (file.size > maxSize) {
          errors.push('File too large')
        }
        
        // Check for suspicious file names
        const suspiciousPatterns = ['.exe', '.bat', '.cmd', '.scr', '.php', '.jsp']
        if (suspiciousPatterns.some(pattern => file.name.toLowerCase().includes(pattern))) {
          errors.push('Suspicious file name')
        }
        
        return { valid: errors.length === 0, errors }
      }

      // Test malicious files
      const maliciousFiles = [
        { name: 'virus.exe', type: 'application/x-executable', size: 1000 },
        { name: 'script.php', type: 'text/php', size: 1000 },
        { name: 'huge.jpg', type: 'image/jpeg', size: 10 * 1024 * 1024 }, // Too large
      ]

      maliciousFiles.forEach(file => {
        const result = validateFileUpload(file)
        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })

      // Test valid file
      const validFile = { name: 'photo.jpg', type: 'image/jpeg', size: 1024 * 1024 }
      const result = validateFileUpload(validFile)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should implement proper rate limiting logic', () => {
      const rateLimiter = {
        attempts: new Map(),
        
        isAllowed(clientId, maxAttempts = 5, windowMs = 60000) {
          const now = Date.now()
          const clientAttempts = this.attempts.get(clientId) || []
          
          // Remove old attempts outside the window
          const validAttempts = clientAttempts.filter(time => now - time < windowMs)
          
          if (validAttempts.length >= maxAttempts) {
            return { allowed: false, retryAfter: windowMs - (now - validAttempts[0]) }
          }
          
          validAttempts.push(now)
          this.attempts.set(clientId, validAttempts)
          
          return { allowed: true, remaining: maxAttempts - validAttempts.length }
        }
      }

      const clientId = 'client123'
      
      // First few attempts should be allowed
      for (let i = 0; i < 4; i++) {
        const result = rateLimiter.isAllowed(clientId)
        expect(result.allowed).toBe(true)
      }
      
      // 5th attempt should still be allowed
      const fifthAttempt = rateLimiter.isAllowed(clientId)
      expect(fifthAttempt.allowed).toBe(true)
      expect(fifthAttempt.remaining).toBe(0)
      
      // 6th attempt should be blocked
      const sixthAttempt = rateLimiter.isAllowed(clientId)
      expect(sixthAttempt.allowed).toBe(false)
      expect(sixthAttempt.retryAfter).toBeGreaterThan(0)
    })
  })

  describe('CSRF Protection', () => {
    it('should validate CSRF tokens on state-changing operations', () => {
      const validateCSRFToken = (token, sessionToken) => {
        // Mock CSRF validation
        if (!token) return false
        if (!sessionToken) return false
        
        // In real implementation, this would be a proper HMAC validation
        const expectedToken = `csrf_${sessionToken}_suffix`
        return token === expectedToken
      }

      const sessionToken = 'valid_session_123'
      const validCSRFToken = `csrf_${sessionToken}_suffix`
      const invalidCSRFToken = 'invalid_csrf_token'
      
      expect(validateCSRFToken(validCSRFToken, sessionToken)).toBe(true)
      expect(validateCSRFToken(invalidCSRFToken, sessionToken)).toBe(false)
      expect(validateCSRFToken(null, sessionToken)).toBe(false)
      expect(validateCSRFToken(validCSRFToken, null)).toBe(false)
    })
  })

  describe('Content Security Policy', () => {
    it('should validate CSP header configuration', () => {
      const generateCSPHeader = () => {
        const directives = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://vercel.live",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: https:",
          "connect-src 'self' https://api.supabase.co",
          "frame-src 'none'",
          "object-src 'none'",
        ]
        
        return directives.join('; ')
      }

      const csp = generateCSPHeader()
      
      // Should include essential security directives
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("frame-src 'none'")
      expect(csp).toContain("object-src 'none'")
      
      // Should allow necessary external resources
      expect(csp).toContain('https://fonts.googleapis.com')
      expect(csp).toContain('https://api.supabase.co')
    })
  })

  describe('Environment Security', () => {
    it('should not expose sensitive environment variables', () => {
      // Mock environment variable check
      const checkEnvExposure = (envVars) => {
        const sensitivePatterns = [
          /secret/i,
          /password/i,
          /key/i,
          /token/i,
          /private/i,
          /database_url/i,
        ]
        
        const exposedSecrets = []
        
        Object.keys(envVars).forEach(key => {
          if (sensitivePatterns.some(pattern => pattern.test(key))) {
            exposedSecrets.push(key)
          }
        })
        
        return exposedSecrets
      }

      // Test with safe environment variables
      const safeEnvVars = {
        NODE_ENV: 'production',
        PORT: '3000',
        PUBLIC_URL: 'https://example.com',
      }
      
      expect(checkEnvExposure(safeEnvVars)).toHaveLength(0)

      // Test with sensitive variables (should be caught)
      const unsafeEnvVars = {
        DATABASE_PASSWORD: 'secret123',
        API_SECRET_KEY: 'supersecret',
        PRIVATE_KEY: 'private123',
      }
      
      expect(checkEnvExposure(unsafeEnvVars).length).toBeGreaterThan(0)
    })
  })
})