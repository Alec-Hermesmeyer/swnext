# Phase 2: API Design Pseudocode

## High-Level System Architecture

```
CLIENT REQUEST
    ↓
RATE LIMITER
    ↓
AUTHENTICATION MIDDLEWARE
    ↓
ROUTE HANDLER
    ↓
VALIDATION LAYER
    ↓
BUSINESS LOGIC
    ↓
DATA ACCESS LAYER
    ↓
DATABASE
    ↓
RESPONSE FORMATTER
    ↓
CLIENT RESPONSE
```

## Core Algorithms

### Algorithm 1: User Authentication Flow

```pseudocode
FUNCTION authenticateUser(email, password):
    INPUT: email (string), password (string)
    OUTPUT: authToken (object) OR error (object)
    
    BEGIN
        // Input validation
        IF email is empty OR password is empty:
            RETURN error("Missing credentials")
        END IF
        
        IF email format is invalid:
            RETURN error("Invalid email format")
        END IF
        
        // User lookup
        user = DATABASE.findUserByEmail(email)
        IF user is null:
            RETURN error("User not found")
        END IF
        
        // Password verification
        isValidPassword = CRYPTO.comparePassword(password, user.hashedPassword)
        IF NOT isValidPassword:
            RETURN error("Invalid credentials")
        END IF
        
        // Token generation
        payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            iat: getCurrentTimestamp(),
            exp: getCurrentTimestamp() + 24_HOURS
        }
        
        accessToken = JWT.sign(payload, JWT_SECRET)
        refreshToken = JWT.sign({userId: user.id}, REFRESH_SECRET, {expiresIn: 30_DAYS})
        
        // Update last login
        DATABASE.updateUserLastLogin(user.id, getCurrentTimestamp())
        
        RETURN {
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        }
    END
END FUNCTION

// TDD Anchor: Test cases needed
// - Valid credentials return token
// - Invalid email format returns error
// - Wrong password returns error
// - Non-existent user returns error
// - Database connection error handling
```

### Algorithm 2: Task CRUD Operations

```pseudocode
FUNCTION createTask(taskData, userId):
    INPUT: taskData (object), userId (string)
    OUTPUT: createdTask (object) OR error (object)
    
    BEGIN
        // Authorization check
        IF userId is empty:
            RETURN error("Unauthorized", 401)
        END IF
        
        // Input validation
        validationResult = VALIDATOR.validateTaskData(taskData)
        IF validationResult has errors:
            RETURN error("Validation failed", 400, validationResult.errors)
        END IF
        
        // Business rule validation
        IF taskData.dueDate < getCurrentDate():
            RETURN error("Due date cannot be in the past")
        END IF
        
        // Create task object
        newTask = {
            id: GENERATOR.generateUUID(),
            title: sanitize(taskData.title),
            description: sanitize(taskData.description),
            dueDate: taskData.dueDate,
            priority: taskData.priority,
            status: "pending",
            ownerId: userId,
            createdAt: getCurrentTimestamp(),
            updatedAt: getCurrentTimestamp()
        }
        
        // Database operation
        TRY:
            savedTask = DATABASE.createTask(newTask)
            
            // Audit logging
            AUDIT.logTaskCreation(userId, savedTask.id)
            
            RETURN savedTask
        CATCH DatabaseError as e:
            LOGGER.error("Task creation failed", e)
            RETURN error("Internal server error", 500)
        END TRY
    END
END FUNCTION

FUNCTION getTasks(userId, filters, pagination):
    INPUT: userId (string), filters (object), pagination (object)
    OUTPUT: tasksList (array) OR error (object)
    
    BEGIN
        // Authorization
        IF userId is empty:
            RETURN error("Unauthorized", 401)
        END IF
        
        // Prepare query parameters
        queryParams = {
            ownerId: userId,
            status: filters.status OR null,
            priority: filters.priority OR null,
            dueDateFrom: filters.dueDateFrom OR null,
            dueDateTo: filters.dueDateTo OR null,
            limit: pagination.limit OR 20,
            offset: pagination.offset OR 0
        }
        
        // Validate pagination
        IF queryParams.limit > 100:
            queryParams.limit = 100
        END IF
        
        // Database query
        TRY:
            tasks = DATABASE.findTasks(queryParams)
            totalCount = DATABASE.countTasks(queryParams)
            
            RETURN {
                tasks: tasks,
                pagination: {
                    total: totalCount,
                    limit: queryParams.limit,
                    offset: queryParams.offset,
                    hasMore: (queryParams.offset + queryParams.limit) < totalCount
                }
            }
        CATCH DatabaseError as e:
            LOGGER.error("Task retrieval failed", e)
            RETURN error("Internal server error", 500)
        END TRY
    END
END FUNCTION

// TDD Anchors:
// - Create task with valid data succeeds
// - Create task with past due date fails
// - Get tasks with filters works correctly
// - Pagination limits are enforced
// - Unauthorized access blocked
```

### Algorithm 3: Request Validation Pipeline

```pseudocode
FUNCTION validateRequest(request, schema):
    INPUT: request (object), schema (object)
    OUTPUT: validatedData (object) OR validationErrors (array)
    
    BEGIN
        errors = []
        validatedData = {}
        
        // Check required fields
        FOR EACH field IN schema.required:
            IF field NOT IN request:
                errors.ADD("Field '" + field + "' is required")
            END IF
        END FOR
        
        // Validate each field
        FOR EACH field IN request:
            IF field IN schema.properties:
                fieldSchema = schema.properties[field]
                
                // Type validation
                IF typeof(request[field]) != fieldSchema.type:
                    errors.ADD("Field '" + field + "' must be " + fieldSchema.type)
                    CONTINUE
                END IF
                
                // String validation
                IF fieldSchema.type == "string":
                    value = trim(request[field])
                    
                    IF fieldSchema.minLength AND length(value) < fieldSchema.minLength:
                        errors.ADD("Field '" + field + "' must be at least " + fieldSchema.minLength + " characters")
                    END IF
                    
                    IF fieldSchema.maxLength AND length(value) > fieldSchema.maxLength:
                        errors.ADD("Field '" + field + "' must be at most " + fieldSchema.maxLength + " characters")
                    END IF
                    
                    IF fieldSchema.pattern AND NOT REGEX.match(value, fieldSchema.pattern):
                        errors.ADD("Field '" + field + "' format is invalid")
                    END IF
                    
                    // Sanitize string
                    validatedData[field] = SANITIZER.sanitizeString(value)
                END IF
                
                // Number validation
                IF fieldSchema.type == "number":
                    IF fieldSchema.minimum AND request[field] < fieldSchema.minimum:
                        errors.ADD("Field '" + field + "' must be at least " + fieldSchema.minimum)
                    END IF
                    
                    IF fieldSchema.maximum AND request[field] > fieldSchema.maximum:
                        errors.ADD("Field '" + field + "' must be at most " + fieldSchema.maximum)
                    END IF
                    
                    validatedData[field] = request[field]
                END IF
                
                // Enum validation
                IF fieldSchema.enum AND request[field] NOT IN fieldSchema.enum:
                    errors.ADD("Field '" + field + "' must be one of: " + join(fieldSchema.enum, ", "))
                END IF
            ELSE:
                // Unknown field - ignore or flag based on configuration
                IF schema.strictMode:
                    errors.ADD("Unknown field '" + field + "'")
                END IF
            END IF
        END FOR
        
        IF errors is empty:
            RETURN validatedData
        ELSE:
            RETURN errors
        END IF
    END
END FUNCTION

// TDD Anchors:
// - Required field validation
// - Type checking works correctly
// - String length limits enforced
// - Pattern matching validation
// - Enum value validation
// - Unknown field handling
```

### Algorithm 4: Error Handling & Response Formation

```pseudocode
FUNCTION handleError(error, request):
    INPUT: error (object), request (object)
    OUTPUT: errorResponse (object)
    
    BEGIN
        // Determine error type and status code
        statusCode = 500
        errorType = "INTERNAL_SERVER_ERROR"
        message = "An unexpected error occurred"
        details = null
        
        SWITCH error.type:
            CASE "ValidationError":
                statusCode = 400
                errorType = "VALIDATION_ERROR"
                message = "Request validation failed"
                details = error.validationErrors
                BREAK
                
            CASE "AuthenticationError":
                statusCode = 401
                errorType = "AUTHENTICATION_ERROR"
                message = "Authentication required"
                BREAK
                
            CASE "AuthorizationError":
                statusCode = 403
                errorType = "AUTHORIZATION_ERROR"
                message = "Access denied"
                BREAK
                
            CASE "NotFoundError":
                statusCode = 404
                errorType = "RESOURCE_NOT_FOUND"
                message = "Requested resource not found"
                BREAK
                
            CASE "RateLimitError":
                statusCode = 429
                errorType = "RATE_LIMIT_EXCEEDED"
                message = "Too many requests"
                details = {
                    retryAfter: error.retryAfter,
                    limit: error.limit
                }
                BREAK
                
            DEFAULT:
                // Log internal errors
                LOGGER.error("Unhandled error", {
                    error: error,
                    requestId: request.id,
                    userId: request.user?.id,
                    path: request.path
                })
        END SWITCH
        
        // Create standardized error response
        errorResponse = {
            error: {
                type: errorType,
                message: message,
                statusCode: statusCode,
                timestamp: getCurrentISO(),
                requestId: request.id
            }
        }
        
        IF details:
            errorResponse.error.details = details
        END IF
        
        // Add debug information in development
        IF ENVIRONMENT == "development" AND error.stack:
            errorResponse.error.stack = error.stack
        END IF
        
        RETURN errorResponse
    END
END FUNCTION

// TDD Anchors:
// - Different error types mapped correctly
// - Sensitive information not exposed in production
// - Request ID included for tracing
// - Proper HTTP status codes returned
```

## Data Flow Specifications

### Request Processing Pipeline

```pseudocode
FUNCTION processAPIRequest(request):
    INPUT: request (HTTPRequest)
    OUTPUT: response (HTTPResponse)
    
    BEGIN
        requestId = GENERATOR.generateRequestId()
        request.id = requestId
        startTime = getCurrentTimestamp()
        
        // 1. Rate limiting
        rateLimitResult = RATE_LIMITER.checkLimit(request.clientIP, request.path)
        IF rateLimitResult.exceeded:
            RETURN createErrorResponse(429, "Rate limit exceeded", rateLimitResult)
        END IF
        
        // 2. Authentication (if required)
        IF request.path IN PROTECTED_ROUTES:
            authResult = AUTHENTICATOR.validateToken(request.headers.authorization)
            IF authResult.invalid:
                RETURN createErrorResponse(401, "Invalid token")
            END IF
            request.user = authResult.user
        END IF
        
        // 3. Route to handler
        handler = ROUTER.findHandler(request.method, request.path)
        IF handler is null:
            RETURN createErrorResponse(404, "Endpoint not found")
        END IF
        
        // 4. Execute handler
        TRY:
            result = handler.execute(request)
            
            // 5. Format successful response
            response = {
                statusCode: result.statusCode OR 200,
                headers: {
                    "Content-Type": "application/json",
                    "X-Request-ID": requestId,
                    "X-Response-Time": (getCurrentTimestamp() - startTime) + "ms"
                },
                body: JSON.stringify(result.data)
            }
            
            // 6. Audit successful requests
            AUDIT.logAPIAccess(request.user?.id, request.path, response.statusCode)
            
            RETURN response
            
        CATCH error:
            errorResponse = handleError(error, request)
            RETURN createHTTPResponse(errorResponse.error.statusCode, errorResponse)
        END TRY
    END
END FUNCTION
```

## Memory & Caching Strategy

```pseudocode
FUNCTION getCacheKey(prefix, identifier, parameters):
    INPUT: prefix (string), identifier (string), parameters (object)
    OUTPUT: cacheKey (string)
    
    BEGIN
        paramString = ""
        IF parameters:
            sortedParams = SORT(parameters by key)
            paramString = ":" + JSON.stringify(sortedParams)
        END IF
        
        RETURN prefix + ":" + identifier + paramString
    END
END FUNCTION

FUNCTION cacheGet(key, fallbackFunction, ttl):
    INPUT: key (string), fallbackFunction (function), ttl (number)
    OUTPUT: data (any)
    
    BEGIN
        cachedData = REDIS.get(key)
        IF cachedData:
            RETURN JSON.parse(cachedData)
        END IF
        
        data = fallbackFunction()
        IF data:
            REDIS.setex(key, ttl, JSON.stringify(data))
        END IF
        
        RETURN data
    END
END FUNCTION

// TDD Anchors:
// - Cache hit/miss scenarios
// - TTL expiration handling
// - Cache invalidation on updates
// - Fallback function execution
```

## Integration Points

### Database Schema Expectations

```pseudocode
SCHEMA users {
    id: UUID PRIMARY KEY
    email: VARCHAR(255) UNIQUE NOT NULL
    hashedPassword: VARCHAR(255) NOT NULL
    role: ENUM('admin', 'user') DEFAULT 'user'
    createdAt: TIMESTAMP DEFAULT NOW()
    updatedAt: TIMESTAMP DEFAULT NOW()
    lastLoginAt: TIMESTAMP NULL
}

SCHEMA tasks {
    id: UUID PRIMARY KEY
    title: VARCHAR(255) NOT NULL
    description: TEXT
    dueDate: DATE
    priority: ENUM('low', 'medium', 'high') DEFAULT 'medium'
    status: ENUM('pending', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending'
    ownerId: UUID REFERENCES users(id)
    createdAt: TIMESTAMP DEFAULT NOW()
    updatedAt: TIMESTAMP DEFAULT NOW()
}

INDEXES:
    users_email_idx ON users(email)
    tasks_owner_status_idx ON tasks(ownerId, status)
    tasks_due_date_idx ON tasks(dueDate)
```

## Next Phase Preparation

**TDD Test Categories Identified:**
1. Unit Tests: Individual function validation
2. Integration Tests: Database and external service interactions
3. API Contract Tests: Request/response format validation
4. Security Tests: Authentication and authorization scenarios
5. Performance Tests: Load and stress testing

**Module Boundaries Established:**
- Authentication Module
- Task Management Module
- Validation Module
- Error Handling Module
- Database Access Module
- Caching Module

**Ready for Phase 3: Modular Design Implementation**