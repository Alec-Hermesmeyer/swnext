// SPARC Workflow Middleware for Next.js
import SparcClient from './sparc-client.js';

// Global middleware for SPARC workflow tracking
export function sparcWorkflowMiddleware(handler, options = {}) {
  return async (req, res) => {
    const sparcClient = new SparcClient();
    const startTime = Date.now();
    
    // Add SPARC context to request
    req.sparc = {
      client: sparcClient,
      workflowId: req.headers['x-workflow-id'] || options.workflowId,
      agentId: req.headers['x-agent-id'] || options.agentId,
      phase: req.headers['x-sparc-phase'] || options.phase,
      startTime
    };

    // Add SPARC utilities to response
    res.sparc = {
      reportProgress: async (progress, message = '') => {
        if (req.sparc.agentId) {
          await sparcClient.reportProgress(
            req.sparc.agentId,
            req.headers['x-task-id'],
            progress,
            null,
            message
          );
        }
      },
      
      storeMemory: async (key, value, ttl = null) => {
        const namespace = req.sparc.workflowId || 'default';
        return sparcClient.storeMemory(namespace, key, value, ttl);
      },
      
      getMemory: async (key) => {
        const namespace = req.sparc.workflowId || 'default';
        return sparcClient.getMemory(namespace, key);
      },
      
      notifyAgents: async (message) => {
        return sparcClient.notifyAgents(message, req.sparc.workflowId);
      }
    };

    try {
      // Execute the handler
      await handler(req, res);
      
      // Record successful completion
      const duration = Date.now() - startTime;
      if (req.sparc.agentId) {
        await sparcClient.reportProgress(
          req.sparc.agentId,
          req.headers['x-task-id'],
          { duration, status: 'completed' },
          null,
          `API endpoint completed in ${duration}ms`
        );
      }
    } catch (error) {
      // Record error
      const duration = Date.now() - startTime;
      if (req.sparc.agentId) {
        await sparcClient.reportProgress(
          req.sparc.agentId,
          req.headers['x-task-id'],
          { duration, status: 'error', error: error.message },
          'failed',
          `API endpoint failed after ${duration}ms: ${error.message}`
        );
      }
      throw error;
    }
  };
}

// Authentication middleware for SPARC operations
export function sparcAuthMiddleware(handler, requiredRole = null) {
  return sparcWorkflowMiddleware(async (req, res) => {
    // Basic authentication check
    const apiKey = req.headers['x-api-key'];
    const agentId = req.headers['x-agent-id'];
    
    if (!apiKey && !agentId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide x-api-key or x-agent-id header'
      });
    }

    // Validate agent if provided
    if (agentId) {
      try {
        const agents = await req.sparc.client.getActiveAgents();
        const agent = agents.find(a => a.id === agentId);
        
        if (!agent) {
          return res.status(401).json({ 
            error: 'Invalid agent ID',
            message: 'Agent not found or inactive'
          });
        }
        
        req.sparc.agent = agent;
        
        // Check role if required
        if (requiredRole && !agent.capabilities.includes(requiredRole)) {
          return res.status(403).json({ 
            error: 'Insufficient permissions',
            message: `Agent requires ${requiredRole} capability`
          });
        }
      } catch (error) {
        return res.status(500).json({ 
          error: 'Authentication error',
          message: error.message
        });
      }
    }

    await handler(req, res);
  });
}

// Rate limiting middleware for SPARC APIs
export function sparcRateLimitMiddleware(handler, options = {}) {
  const {
    windowMs = 60000, // 1 minute
    maxRequests = 100,
    skipSuccessfulRequests = false
  } = options;
  
  const requestCounts = new Map();
  
  return sparcWorkflowMiddleware(async (req, res) => {
    const identifier = req.sparc.agentId || req.ip || 'anonymous';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    for (const [key, requests] of requestCounts.entries()) {
      requestCounts.set(key, requests.filter(time => time > windowStart));
      if (requestCounts.get(key).length === 0) {
        requestCounts.delete(key);
      }
    }
    
    // Check current request count
    const userRequests = requestCounts.get(identifier) || [];
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${maxRequests} per ${windowMs}ms`,
        retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000)
      });
    }
    
    // Record this request
    userRequests.push(now);
    requestCounts.set(identifier, userRequests);
    
    await handler(req, res);
    
    // Optionally remove successful requests from count
    if (skipSuccessfulRequests && res.statusCode >= 200 && res.statusCode < 300) {
      const updatedRequests = requestCounts.get(identifier);
      updatedRequests.pop(); // Remove the request we just added
      requestCounts.set(identifier, updatedRequests);
    }
  });
}

// Validation middleware for SPARC data
export function sparcValidationMiddleware(schema) {
  return (handler) => sparcWorkflowMiddleware(async (req, res) => {
    if (req.method !== 'GET') {
      // Validate request body against schema
      const validation = validateData(req.body, schema);
      
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Request body validation failed',
          details: validation.errors
        });
      }
    }
    
    await handler(req, res);
  });
}

// Caching middleware for SPARC responses
export function sparcCacheMiddleware(handler, options = {}) {
  const {
    ttl = 300000, // 5 minutes
    keyGenerator = (req) => `${req.method}:${req.url}`,
    skipCache = (req) => req.method !== 'GET'
  } = options;
  
  const cache = new Map();
  
  return sparcWorkflowMiddleware(async (req, res) => {
    if (skipCache(req)) {
      return handler(req, res);
    }
    
    const cacheKey = keyGenerator(req);
    const now = Date.now();
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && now < cached.expiresAt) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Expires', new Date(cached.expiresAt).toISOString());
      return res.status(cached.statusCode).json(cached.data);
    }
    
    // Capture response
    const originalJson = res.json;
    const originalStatus = res.status;
    let responseData = null;
    let statusCode = 200;
    
    res.status = function(code) {
      statusCode = code;
      return originalStatus.call(this, code);
    };
    
    res.json = function(data) {
      responseData = data;
      
      // Cache successful responses
      if (statusCode >= 200 && statusCode < 300) {
        cache.set(cacheKey, {
          data,
          statusCode,
          expiresAt: now + ttl
        });
        
        // Clean up expired entries periodically
        if (Math.random() < 0.01) { // 1% chance
          for (const [key, value] of cache.entries()) {
            if (now >= value.expiresAt) {
              cache.delete(key);
            }
          }
        }
        
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Expires', new Date(now + ttl).toISOString());
      }
      
      return originalJson.call(this, data);
    };
    
    await handler(req, res);
  });
}

// Error handling middleware for SPARC
export function sparcErrorMiddleware(handler) {
  return sparcWorkflowMiddleware(async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('SPARC API Error:', error);
      
      // Report error to coordination system
      if (req.sparc.agentId) {
        await req.sparc.client.reportProgress(
          req.sparc.agentId,
          req.headers['x-task-id'],
          { error: error.message },
          'failed',
          `Error in ${req.method} ${req.url}: ${error.message}`
        ).catch(console.error);
      }
      
      // Determine error type and response
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message,
          details: error.details || {}
        });
      }
      
      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message
        });
      }
      
      if (error.name === 'UnauthorizedError') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: error.message
        });
      }
      
      // Generic server error
      return res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    }
  });
}

// Utility function for data validation
function validateData(data, schema) {
  const errors = [];
  
  // Basic schema validation
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in data) || data[field] === undefined || data[field] === null) {
        errors.push(`Required field '${field}' is missing`);
      }
    }
  }
  
  if (schema.fields) {
    for (const [field, rules] of Object.entries(schema.fields)) {
      const value = data[field];
      
      if (value !== undefined) {
        if (rules.type && typeof value !== rules.type) {
          errors.push(`Field '${field}' must be of type ${rules.type}`);
        }
        
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`Field '${field}' must be at least ${rules.min}`);
        }
        
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`Field '${field}' must be at most ${rules.max}`);
        }
        
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`Field '${field}' does not match required pattern`);
        }
        
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`Field '${field}' must be one of: ${rules.enum.join(', ')}`);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Export middleware composition helper
export function composeSparMiddleware(...middlewares) {
  return (handler) => {
    return middlewares.reduceRight((acc, middleware) => {
      return middleware(acc);
    }, handler);
  };
}