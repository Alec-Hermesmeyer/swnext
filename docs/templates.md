# SPARC Templates and Patterns

## Overview

This document provides reusable templates, patterns, and boilerplates for implementing SPARC methodology in Next.js/Tailwind CSS projects. These templates ensure consistency and accelerate development across all SPARC phases.

## Specification Templates

### 1. Feature Specification Template

```yaml
# feature-spec.yaml
feature_specification:
  metadata:
    feature_id: "FT-001"
    feature_name: "User Authentication"
    priority: "high"
    complexity: "medium"
    estimated_effort: "5 story points"
    assignee: "development-team"
    
  description: |
    Implement secure user authentication system with OAuth2 providers
    and traditional email/password login for the Next.js application.
    
  user_stories:
    - id: "US-001"
      role: "New User"
      goal: "Create account with email/password"
      benefit: "Access personalized features"
      acceptance_criteria:
        - "User can register with valid email and strong password"
        - "Email verification required before account activation"
        - "Password must meet security requirements (8+ chars, mixed case, numbers)"
        - "Duplicate email registration shows appropriate error"
        - "Form validation provides real-time feedback"
        
    - id: "US-002"
      role: "Registered User"
      goal: "Login with existing credentials"
      benefit: "Access my account and data"
      acceptance_criteria:
        - "User can login with email/password combination"
        - "Invalid credentials show appropriate error message"
        - "Successful login redirects to intended destination"
        - "Login state persists across browser sessions"
        - "Account lockout after multiple failed attempts"

  technical_requirements:
    framework_needs:
      - "Next.js 14 App Router for authentication pages"
      - "NextAuth.js for session management"
      - "Tailwind CSS for responsive form styling"
      - "React Hook Form for form handling"
      - "Zod for schema validation"
      
    database_schema:
      - "Users table with encrypted passwords"
      - "Sessions table for active user sessions" 
      - "Accounts table for OAuth provider linking"
      - "Verification tokens table for email verification"
      
    api_endpoints:
      - "POST /api/auth/register - User registration"
      - "POST /api/auth/login - User authentication"
      - "GET /api/auth/session - Session verification"
      - "POST /api/auth/logout - Session termination"
      
  non_functional_requirements:
    performance:
      - "Authentication response time < 500ms"
      - "Login page load time < 2 seconds"
      - "Form validation response < 100ms"
      
    security:
      - "Passwords hashed with bcrypt (12+ rounds)"
      - "CSRF protection on all auth forms"
      - "Rate limiting on login attempts"
      - "Secure session cookies (httpOnly, sameSite)"
      
    accessibility:
      - "WCAG 2.1 AA compliance for all forms"
      - "Screen reader compatible error messages"
      - "Keyboard navigation support"
      - "High contrast color scheme support"

  testing_requirements:
    unit_tests:
      - "Form validation logic"
      - "Authentication helper functions"
      - "Password hashing utilities"
      
    integration_tests:
      - "Registration flow end-to-end"
      - "Login flow with different providers"
      - "Session management across routes"
      
    e2e_tests:
      - "Complete user registration journey"
      - "Login and logout user journey"
      - "Error handling scenarios"

  constraints:
    technical:
      - "Must integrate with existing user database"
      - "Support for PostgreSQL only"
      - "Compatible with current Next.js version"
      
    business:
      - "GDPR compliance for EU users"
      - "Email verification required by policy"
      - "Maximum 30-day session lifetime"
      
    design:
      - "Consistent with existing UI design system"
      - "Mobile-first responsive design"
      - "Dark mode support required"

  definition_of_done:
    - [ ] All user stories implemented and tested
    - [ ] Unit test coverage > 80%
    - [ ] Integration tests passing
    - [ ] Security audit completed
    - [ ] Performance benchmarks met
    - [ ] Accessibility review passed
    - [ ] Documentation updated
    - [ ] Code review approved
    - [ ] Production deployment successful
```

### 2. API Specification Template

```yaml
# api-spec.yaml
openapi: 3.0.3
info:
  title: "Next.js Application API"
  version: "1.0.0"
  description: "API specification for SPARC-built Next.js application"
  
servers:
  - url: "https://api.example.com"
    description: "Production server"
  - url: "http://localhost:3000"
    description: "Development server"

paths:
  /api/auth/register:
    post:
      summary: "Register new user"
      tags: ["Authentication"]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password, name]
              properties:
                email:
                  type: string
                  format: email
                  example: "user@example.com"
                password:
                  type: string
                  minLength: 8
                  pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$"
                  example: "SecurePass123"
                name:
                  type: string
                  minLength: 1
                  maxLength: 100
                  example: "John Doe"
      responses:
        201:
          description: "User created successfully"
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  message:
                    type: string
                    example: "Account created. Please check your email."
                  userId:
                    type: string
                    format: uuid
        400:
          description: "Validation error"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        409:
          description: "Email already exists"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
                
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        avatar:
          type: string
          format: uri
        createdAt:
          type: string
          format: date-time
        
    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: string
        details:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              message:
                type: string
```

## Pseudocode Templates

### 1. React Component Pseudocode Template

```
COMPONENT_TEMPLATE ComponentName:
  // Type definitions
  DEFINE Props = {
    prop1: Type1,
    prop2: Type2,
    optional_prop?: Type3
  }
  
  DEFINE State = {
    data: DataType | null,
    loading: boolean,
    error: string | null
  }
  
  // Props destructuring
  INPUT: props (Props)
  
  // State initialization  
  INITIALIZE:
    SET state = initial_state
    SET refs = required_refs
  
  // Effects and lifecycle
  ON_MOUNT:
    CALL setup_function()
    CALL data_fetch()
    
  ON_UNMOUNT:
    CALL cleanup_function()
    
  ON_DEPENDENCY_CHANGE [dependency]:
    CALL handle_change()
  
  // Event handlers
  FUNCTION handle_event(event_data):
    TRY:
      VALIDATE event_data
      UPDATE state with new_data
      CALL external_api IF needed
      TRIGGER side_effects
    CATCH error:
      SET error_state
      LOG error
      SHOW error_message
  
  // Data fetching
  FUNCTION fetch_data():
    SET loading = true
    SET error = null
    TRY:
      CALL api_endpoint
      SET data = response
      TRIGGER success_side_effects
    CATCH error:
      SET error = error_message
      TRIGGER error_side_effects
    FINALLY:
      SET loading = false
  
  // Render logic
  RENDER:
    IF loading:
      RETURN LoadingComponent
    IF error:
      RETURN ErrorComponent(error)
    IF no_data:
      RETURN EmptyStateComponent
    
    RETURN (
      MainContent WITH {
        data: state.data,
        handlers: event_handlers,
        children: child_components
      }
    )
```

### 2. API Route Pseudocode Template

```
API_ROUTE_TEMPLATE /api/resource:
  // Import dependencies
  IMPORT authentication FROM auth_library
  IMPORT validation FROM validation_library
  IMPORT database FROM database_client
  
  METHOD GET:
    INPUT: request (NextRequest)
    
    // Authentication
    AUTHENTICATE:
      GET session FROM request
      IF no_session:
        RETURN 401 Unauthorized
      
      CHECK permissions FOR resource_read
      IF insufficient_permissions:
        RETURN 403 Forbidden
    
    // Query parameter validation
    VALIDATE:
      EXTRACT query_params FROM request.url
      VALIDATE params AGAINST schema
      IF validation_fails:
        RETURN 400 Bad Request WITH errors
    
    // Database operations
    PROCESS:
      TRY:
        SET filters = build_filters(query_params)
        SET pagination = extract_pagination(query_params)
        
        QUERY database WITH filters AND pagination
        SET results = query_response
        SET total_count = count_query_response
        
        FORMAT response_data WITH {
          results: results,
          pagination: {
            page: current_page,
            limit: page_limit,
            total: total_count,
            has_next: boolean
          }
        }
        
        RETURN 200 OK WITH response_data
        
      CATCH database_error:
        LOG error WITH context
        RETURN 500 Internal Server Error
        
      CATCH validation_error:
        RETURN 400 Bad Request WITH error_details
  
  METHOD POST:
    INPUT: request (NextRequest)
    
    // Authentication & authorization
    AUTHENTICATE:
      GET session FROM request
      VERIFY user_permissions FOR resource_create
      
    // Request body validation
    VALIDATE:
      GET body FROM request
      PARSE json_body
      VALIDATE body AGAINST creation_schema
      IF validation_fails:
        RETURN 400 Bad Request WITH validation_errors
    
    // Business logic
    PROCESS:
      TRY:
        CHECK business_rules(body_data)
        IF business_rule_violation:
          RETURN 422 Unprocessable Entity WITH rule_errors
        
        TRANSFORM body_data FOR database
        CREATE record IN database WITH transformed_data
        
        TRIGGER post_creation_hooks(created_record)
        
        FORMAT success_response WITH created_record
        RETURN 201 Created WITH success_response
        
      CATCH unique_constraint_error:
        RETURN 409 Conflict WITH conflict_details
        
      CATCH database_error:
        LOG error WITH full_context
        RETURN 500 Internal Server Error
  
  // Error handling middleware
  FUNCTION handle_errors(error):
    LOG error WITH {
      message: error.message,
      stack: error.stack,
      request_id: request.id,
      user_id: session?.user?.id,
      timestamp: now()
    }
    
    IF error IS validation_error:
      RETURN formatted_validation_response
    IF error IS authentication_error:
      RETURN 401 WITH auth_error_message
    IF error IS authorization_error:
      RETURN 403 WITH permission_error_message
    ELSE:
      RETURN 500 WITH generic_error_message
```

### 3. State Management Pseudocode Template

```
STORE_TEMPLATE ResourceStore:
  // State shape
  DEFINE State = {
    items: Array<ResourceType>,
    selectedItem: ResourceType | null,
    filters: FilterType,
    pagination: PaginationType,
    loading: LoadingState,
    error: ErrorState,
    cache: CacheState
  }
  
  // Initial state
  INITIALIZE:
    SET state = {
      items: [],
      selectedItem: null,
      filters: default_filters,
      pagination: default_pagination,
      loading: { fetching: false, updating: false },
      error: { message: null, code: null },
      cache: { lastFetch: null, invalidated: false }
    }
  
  // Selectors
  SELECTOR get_all_items():
    RETURN state.items
  
  SELECTOR get_filtered_items():
    RETURN FILTER state.items BY state.filters
  
  SELECTOR get_item_by_id(id):
    RETURN FIND item IN state.items WHERE item.id = id
  
  SELECTOR get_loading_state():
    RETURN state.loading
  
  // Actions
  ACTION fetch_items(params):
    SET state.loading.fetching = true
    SET state.error = null
    
    TRY:
      CALL api.get_items(params)
      SET state.items = response.data
      SET state.pagination = response.pagination
      SET state.cache.lastFetch = now()
      SET state.cache.invalidated = false
    CATCH error:
      SET state.error = format_error(error)
    FINALLY:
      SET state.loading.fetching = false
  
  ACTION create_item(item_data):
    SET state.loading.updating = true
    
    // Optimistic update
    SET temp_id = generate_temp_id()
    SET optimistic_item = { ...item_data, id: temp_id, pending: true }
    ADD optimistic_item TO state.items
    
    TRY:
      CALL api.create_item(item_data)
      REMOVE optimistic_item FROM state.items
      ADD response.data TO state.items
      TRIGGER success_notification
    CATCH error:
      REMOVE optimistic_item FROM state.items
      SET state.error = format_error(error)
      TRIGGER error_notification
    FINALLY:
      SET state.loading.updating = false
  
  ACTION update_item(id, updates):
    SET state.loading.updating = true
    
    // Store original for rollback
    SET original_item = FIND item IN state.items WHERE item.id = id
    
    // Optimistic update
    UPDATE item IN state.items WHERE item.id = id WITH updates
    
    TRY:
      CALL api.update_item(id, updates)
      UPDATE item IN state.items WHERE item.id = id WITH response.data
    CATCH error:
      // Rollback on error
      UPDATE item IN state.items WHERE item.id = id WITH original_item
      SET state.error = format_error(error)
    FINALLY:
      SET state.loading.updating = false
  
  ACTION delete_item(id):
    SET original_items = [...state.items]
    
    // Optimistic removal
    REMOVE item FROM state.items WHERE item.id = id
    
    TRY:
      CALL api.delete_item(id)
      TRIGGER success_notification
    CATCH error:
      // Rollback on error
      SET state.items = original_items
      SET state.error = format_error(error)
  
  ACTION set_filters(new_filters):
    SET state.filters = merge(state.filters, new_filters)
    SET state.pagination = reset_pagination()
    TRIGGER fetch_items WITH new_filters
  
  ACTION clear_error():
    SET state.error = null
  
  ACTION invalidate_cache():
    SET state.cache.invalidated = true
  
  // Side effects
  EFFECT on_state_change():
    IF state.cache.invalidated:
      TRIGGER fetch_items()
    
    IF state.filters CHANGED:
      TRIGGER fetch_items(state.filters)
```

## Architecture Templates

### 1. Next.js Project Architecture Template

```typescript
// Project structure template
interface ProjectArchitecture {
  // App Router structure (Next.js 13+)
  app: {
    '(auth)': {
      'login/page.tsx': 'Login page component',
      'register/page.tsx': 'Registration page component',
      'layout.tsx': 'Auth pages layout'
    },
    'dashboard': {
      'page.tsx': 'Dashboard home page',
      'layout.tsx': 'Dashboard layout with sidebar',
      'loading.tsx': 'Dashboard loading UI',
      'error.tsx': 'Dashboard error boundary',
      'settings': {
        'page.tsx': 'User settings page',
        'profile/page.tsx': 'Profile management page'
      }
    },
    'api': {
      'auth/route.ts': 'Authentication endpoints',
      'users/route.ts': 'User management endpoints',
      'posts/route.ts': 'Post management endpoints'
    },
    'globals.css': 'Global styles and Tailwind imports',
    'layout.tsx': 'Root layout with providers',
    'page.tsx': 'Home page component',
    'not-found.tsx': '404 error page'
  },
  
  // Component organization
  components: {
    ui: {
      'button.tsx': 'Base button component with variants',
      'input.tsx': 'Form input with validation states',
      'modal.tsx': 'Modal dialog component',
      'card.tsx': 'Content card component'
    },
    forms: {
      'auth-form.tsx': 'Login/register form component',
      'profile-form.tsx': 'User profile edit form',
      'contact-form.tsx': 'Contact/feedback form'
    },
    layout: {
      'header.tsx': 'Site header with navigation',
      'footer.tsx': 'Site footer component',
      'sidebar.tsx': 'Dashboard sidebar navigation',
      'breadcrumbs.tsx': 'Page breadcrumb navigation'
    },
    features: {
      'user-profile.tsx': 'User profile display component',
      'post-list.tsx': 'Blog post listing component',
      'search-bar.tsx': 'Global search component'
    }
  },
  
  // Utility and configuration
  lib: {
    'auth.ts': 'NextAuth.js configuration',
    'db.ts': 'Database client and utilities',
    'validations.ts': 'Zod validation schemas',
    'utils.ts': 'Common utility functions',
    'constants.ts': 'Application constants'
  },
  
  // Custom hooks
  hooks: {
    'use-auth.ts': 'Authentication state hook',
    'use-posts.ts': 'Post data fetching hook',
    'use-local-storage.ts': 'Local storage state hook'
  },
  
  // State management
  store: {
    'auth-store.ts': 'User authentication state',
    'ui-store.ts': 'UI state (theme, modals)',
    'posts-store.ts': 'Blog posts state'
  },
  
  // Type definitions
  types: {
    'auth.ts': 'Authentication related types',
    'api.ts': 'API request/response types',
    'database.ts': 'Database model types'
  }
}
```

### 2. Component Design System Template

```typescript
// Design system component template
interface ComponentDesignSystem {
  // Base component props
  BaseProps: {
    className?: string;
    children?: React.ReactNode;
    'data-testid'?: string;
  };
  
  // Variant system
  VariantSystem: {
    size: 'sm' | 'md' | 'lg' | 'xl';
    variant: 'primary' | 'secondary' | 'outline' | 'ghost';
    color: 'blue' | 'green' | 'red' | 'gray' | 'yellow';
    state: 'default' | 'hover' | 'focus' | 'disabled' | 'loading';
  };
  
  // Button component template
  Button: {
    props: BaseProps & VariantSystem & {
      onClick?: (event: React.MouseEvent) => void;
      type?: 'button' | 'submit' | 'reset';
      disabled?: boolean;
      loading?: boolean;
      leftIcon?: React.ReactNode;
      rightIcon?: React.ReactNode;
    };
    
    variants: {
      primary: 'bg-blue-500 text-white hover:bg-blue-600';
      secondary: 'bg-gray-500 text-white hover:bg-gray-600';
      outline: 'border border-blue-500 text-blue-500 hover:bg-blue-50';
      ghost: 'text-blue-500 hover:bg-blue-50';
    };
    
    sizes: {
      sm: 'px-3 py-1.5 text-sm';
      md: 'px-4 py-2 text-base';
      lg: 'px-6 py-3 text-lg';
      xl: 'px-8 py-4 text-xl';
    };
  };
  
  // Form components template
  FormField: {
    props: BaseProps & {
      label?: string;
      error?: string;
      required?: boolean;
      helpText?: string;
    };
    
    structure: {
      wrapper: 'div.space-y-1';
      label: 'label.block.text-sm.font-medium';
      input: 'input.block.w-full.rounded-md.border';
      error: 'p.text-sm.text-red-600';
      helpText: 'p.text-sm.text-gray-500';
    };
  };
  
  // Layout components template
  Layout: {
    Container: {
      props: BaseProps & {
        maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
        padding?: boolean;
      };
      classes: 'mx-auto px-4 sm:px-6 lg:px-8';
    };
    
    Grid: {
      props: BaseProps & {
        cols?: 1 | 2 | 3 | 4 | 6 | 12;
        gap?: 1 | 2 | 4 | 6 | 8;
        responsive?: boolean;
      };
      classes: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    };
    
    Stack: {
      props: BaseProps & {
        direction?: 'row' | 'column';
        spacing?: 1 | 2 | 4 | 6 | 8;
        align?: 'start' | 'center' | 'end' | 'stretch';
        justify?: 'start' | 'center' | 'end' | 'between' | 'around';
      };
      classes: 'flex flex-col space-y-4';
    };
  };
}
```

## Testing Templates

### 1. Component Test Template

```typescript
// Component test template
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import { ComponentName } from '@/components/ComponentName'

// Mock external dependencies
jest.mock('@/lib/api', () => ({
  fetchData: jest.fn(),
  postData: jest.fn()
}))

describe('ComponentName', () => {
  // Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  afterEach(() => {
    jest.resetAllMocks()
  })
  
  // Test data fixtures
  const mockProps = {
    prop1: 'test-value',
    prop2: 123,
    onAction: jest.fn()
  }
  
  const mockData = {
    id: '1',
    name: 'Test Item',
    status: 'active'
  }
  
  // Render helpers
  const renderComponent = (props = {}) => {
    return render(<ComponentName {...mockProps} {...props} />)
  }
  
  const renderWithProviders = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ComponentName {...mockProps} {...props} />
        </ThemeProvider>
      </QueryClientProvider>
    )
  }
  
  // Basic rendering tests
  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderComponent()
      expect(screen.getByTestId('component-name')).toBeInTheDocument()
    })
    
    it('displays correct content', () => {
      renderComponent({ title: 'Test Title' })
      expect(screen.getByText('Test Title')).toBeInTheDocument()
    })
    
    it('applies correct CSS classes', () => {
      renderComponent({ className: 'custom-class' })
      expect(screen.getByTestId('component-name')).toHaveClass('custom-class')
    })
  })
  
  // Interaction tests
  describe('User Interactions', () => {
    it('handles click events', () => {
      renderComponent()
      
      fireEvent.click(screen.getByRole('button', { name: 'Action Button' }))
      
      expect(mockProps.onAction).toHaveBeenCalledTimes(1)
      expect(mockProps.onAction).toHaveBeenCalledWith(expect.any(Object))
    })
    
    it('handles form submission', async () => {
      const mockSubmit = jest.fn()
      renderComponent({ onSubmit: mockSubmit })
      
      fireEvent.change(screen.getByLabelText('Input Field'), {
        target: { value: 'test input' }
      })
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
      
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          inputField: 'test input'
        })
      })
    })
    
    it('handles keyboard navigation', () => {
      renderComponent()
      
      fireEvent.keyDown(screen.getByRole('button'), {
        key: 'Enter',
        code: 'Enter'
      })
      
      expect(mockProps.onAction).toHaveBeenCalled()
    })
  })
  
  // State management tests
  describe('State Management', () => {
    it('updates state correctly', async () => {
      renderComponent()
      
      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
      
      await waitFor(() => {
        expect(screen.getByText('State Changed')).toBeInTheDocument()
      })
    })
    
    it('handles loading states', () => {
      renderComponent({ loading: true })
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
    
    it('handles error states', () => {
      renderComponent({ error: 'Test error message' })
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })
  })
  
  // API integration tests
  describe('API Integration', () => {
    it('fetches data on mount', async () => {
      const mockFetch = jest.mocked(fetchData)
      mockFetch.mockResolvedValue(mockData)
      
      renderComponent()
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(screen.getByText('Test Item')).toBeInTheDocument()
      })
    })
    
    it('handles API errors', async () => {
      const mockFetch = jest.mocked(fetchData)
      mockFetch.mockRejectedValue(new Error('API Error'))
      
      renderComponent()
      
      await waitFor(() => {
        expect(screen.getByText('Error loading data')).toBeInTheDocument()
      })
    })
  })
  
  // Accessibility tests
  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      renderComponent({ ariaLabel: 'Test Component' })
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Test Component')
    })
    
    it('supports keyboard navigation', () => {
      renderComponent()
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('tabIndex', '0')
    })
    
    it('has proper focus management', () => {
      renderComponent()
      const button = screen.getByRole('button')
      button.focus()
      expect(document.activeElement).toBe(button)
    })
  })
  
  // Performance tests
  describe('Performance', () => {
    it('renders efficiently with large datasets', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        name: `Item ${i}`
      }))
      
      const startTime = performance.now()
      renderComponent({ data: largeDataset })
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(100) // ms
    })
    
    it('memoizes expensive calculations', () => {
      const expensiveCalculation = jest.fn(() => 'calculated-value')
      renderComponent({ calculate: expensiveCalculation })
      
      // Re-render with same props
      renderComponent({ calculate: expensiveCalculation })
      
      expect(expensiveCalculation).toHaveBeenCalledTimes(1)
    })
  })
})
```

### 2. API Route Test Template

```typescript
// API route test template
import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/resource/route'

// Mock dependencies
jest.mock('@/lib/auth')
jest.mock('@/lib/db')

describe('/api/resource', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: 'user'
  }
  
  const mockSession = {
    user: mockUser,
    expires: '2024-01-01'
  }
  
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  describe('GET /api/resource', () => {
    it('returns resources for authenticated user', async () => {
      // Mock authentication
      ;(auth as jest.Mock).mockResolvedValue(mockSession)
      
      // Mock database query
      const mockResources = [
        { id: '1', name: 'Resource 1' },
        { id: '2', name: 'Resource 2' }
      ]
      ;(db.resource.findMany as jest.Mock).mockResolvedValue(mockResources)
      
      // Create request
      const request = new NextRequest('http://localhost/api/resource')
      
      // Execute endpoint
      const response = await GET(request)
      const data = await response.json()
      
      // Assertions
      expect(response.status).toBe(200)
      expect(data).toEqual(mockResources)
      expect(db.resource.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id }
      })
    })
    
    it('returns 401 for unauthenticated request', async () => {
      ;(auth as jest.Mock).mockResolvedValue(null)
      
      const request = new NextRequest('http://localhost/api/resource')
      const response = await GET(request)
      
      expect(response.status).toBe(401)
    })
    
    it('handles database errors gracefully', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockSession)
      ;(db.resource.findMany as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )
      
      const request = new NextRequest('http://localhost/api/resource')
      const response = await GET(request)
      
      expect(response.status).toBe(500)
    })
  })
  
  describe('POST /api/resource', () => {
    const validResourceData = {
      name: 'New Resource',
      description: 'Resource description'
    }
    
    it('creates resource with valid data', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockSession)
      
      const createdResource = {
        id: '3',
        ...validResourceData,
        userId: mockUser.id
      }
      ;(db.resource.create as jest.Mock).mockResolvedValue(createdResource)
      
      const request = new NextRequest('http://localhost/api/resource', {
        method: 'POST',
        body: JSON.stringify(validResourceData)
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data).toEqual(createdResource)
    })
    
    it('validates request body', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockSession)
      
      const invalidData = { name: '' } // Missing required fields
      
      const request = new NextRequest('http://localhost/api/resource', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toContain('validation')
    })
  })
  
  describe('PUT /api/resource/[id]', () => {
    it('updates resource with valid data', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockSession)
      
      const updateData = { name: 'Updated Resource' }
      const updatedResource = { id: '1', ...updateData }
      
      ;(db.resource.update as jest.Mock).mockResolvedValue(updatedResource)
      
      const request = new NextRequest('http://localhost/api/resource/1', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      
      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual(updatedResource)
    })
  })
  
  describe('DELETE /api/resource/[id]', () => {
    it('deletes resource by ID', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockSession)
      ;(db.resource.delete as jest.Mock).mockResolvedValue({ id: '1' })
      
      const request = new NextRequest('http://localhost/api/resource/1', {
        method: 'DELETE'
      })
      
      const response = await DELETE(request, { params: { id: '1' } })
      
      expect(response.status).toBe(204)
    })
  })
})
```

### 3. E2E Test Template

```typescript
// E2E test template using Playwright
import { test, expect } from '@playwright/test'

test.describe('User Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
  })
  
  test('user can register and login', async ({ page }) => {
    // Registration flow
    await page.click('[data-testid="register-link"]')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'SecurePass123')
    await page.fill('[data-testid="name-input"]', 'Test User')
    await page.click('[data-testid="register-button"]')
    
    // Check for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Login flow
    await page.click('[data-testid="login-link"]')
    await page.fill('[data-testid="login-email"]', 'test@example.com')
    await page.fill('[data-testid="login-password"]', 'SecurePass123')
    await page.click('[data-testid="login-button"]')
    
    // Verify successful login
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })
  
  test('handles invalid login credentials', async ({ page }) => {
    await page.click('[data-testid="login-link"]')
    await page.fill('[data-testid="login-email"]', 'invalid@example.com')
    await page.fill('[data-testid="login-password"]', 'wrongpassword')
    await page.click('[data-testid="login-button"]')
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
  })
  
  test('redirects unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*login/)
  })
})

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login as authenticated user
    await page.goto('/login')
    await page.fill('[data-testid="login-email"]', 'test@example.com')
    await page.fill('[data-testid="login-password"]', 'SecurePass123')
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL(/.*dashboard/)
  })
  
  test('displays user dashboard content', async ({ page }) => {
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="user-stats"]')).toBeVisible()
    await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible()
  })
  
  test('user can update profile', async ({ page }) => {
    await page.click('[data-testid="profile-link"]')
    await page.fill('[data-testid="name-input"]', 'Updated Name')
    await page.click('[data-testid="save-button"]')
    
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="name-display"]')).toContainText('Updated Name')
  })
})
```

## Completion Templates

### 1. Deployment Checklist Template

```yaml
# deployment-checklist.yaml
pre_deployment:
  code_quality:
    - [ ] All tests passing (unit, integration, e2e)
    - [ ] Code coverage meets threshold (>80%)
    - [ ] No linting errors or warnings
    - [ ] TypeScript compilation successful
    - [ ] Security audit completed (npm audit)
    - [ ] Performance benchmarks met
    - [ ] Accessibility testing completed
    - [ ] Cross-browser testing done
    - [ ] Mobile responsiveness verified
    - [ ] Code review approved by team

  infrastructure:
    - [ ] Environment variables configured
    - [ ] Database migrations ready
    - [ ] SSL certificates in place
    - [ ] CDN configuration updated
    - [ ] DNS records configured
    - [ ] Monitoring tools configured
    - [ ] Backup procedures tested
    - [ ] Rollback plan documented

deployment:
  build_process:
    - [ ] Production build successful
    - [ ] Bundle size analysis completed
    - [ ] Static assets optimized
    - [ ] Service worker updated (if applicable)
    - [ ] Sitemap generated
    - [ ] Robots.txt updated

  verification:
    - [ ] Health check endpoints responding
    - [ ] Database connections verified
    - [ ] External API integrations tested
    - [ ] Authentication flow tested
    - [ ] Critical user journeys verified
    - [ ] Performance metrics within targets
    - [ ] Error tracking configured

post_deployment:
  monitoring:
    - [ ] Application performance monitoring active
    - [ ] Error tracking and alerting configured
    - [ ] Server resource monitoring enabled
    - [ ] User analytics tracking verified
    - [ ] Log aggregation working
    - [ ] Uptime monitoring configured

  documentation:
    - [ ] Deployment documentation updated
    - [ ] API documentation current
    - [ ] User documentation updated
    - [ ] Changelog published
    - [ ] Team notified of deployment
    - [ ] Stakeholders informed
```

### 2. Production Monitoring Template

```typescript
// monitoring-setup.ts
import * as Sentry from '@sentry/nextjs'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// Error monitoring configuration
export function initializeMonitoring() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event, hint) {
      // Filter out non-critical errors in production
      if (process.env.NODE_ENV === 'production') {
        if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
          return null // Ignore chunk load errors
        }
      }
      return event
    },
    integrations: [
      new Sentry.BrowserTracing({
        tracingOrigins: [process.env.NEXT_PUBLIC_APP_URL]
      })
    ]
  })
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics = {
    pageLoads: new Map<string, number[]>(),
    apiCalls: new Map<string, number[]>(),
    errors: new Map<string, number>()
  }
  
  static trackPageLoad(route: string, duration: number) {
    if (!this.metrics.pageLoads.has(route)) {
      this.metrics.pageLoads.set(route, [])
    }
    this.metrics.pageLoads.get(route)!.push(duration)
    
    // Send to analytics
    gtag('event', 'page_load_time', {
      event_category: 'Performance',
      event_label: route,
      value: Math.round(duration)
    })
  }
  
  static trackApiCall(endpoint: string, duration: number, status: number) {
    const key = `${endpoint}_${status}`
    if (!this.metrics.apiCalls.has(key)) {
      this.metrics.apiCalls.set(key, [])
    }
    this.metrics.apiCalls.get(key)!.push(duration)
    
    // Send to Sentry for slow API calls
    if (duration > 2000) {
      Sentry.addBreadcrumb({
        message: `Slow API call: ${endpoint}`,
        data: { duration, status },
        level: 'warning'
      })
    }
  }
  
  static trackError(error: Error, context: Record<string, any> = {}) {
    const errorKey = error.name
    const currentCount = this.metrics.errors.get(errorKey) || 0
    this.metrics.errors.set(errorKey, currentCount + 1)
    
    Sentry.withScope((scope) => {
      Object.keys(context).forEach(key => {
        scope.setTag(key, context[key])
      })
      Sentry.captureException(error)
    })
  }
  
  static getMetrics() {
    return {
      pageLoads: Object.fromEntries(this.metrics.pageLoads),
      apiCalls: Object.fromEntries(this.metrics.apiCalls),
      errors: Object.fromEntries(this.metrics.errors)
    }
  }
}

// Health check implementation
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy',
  timestamp: string,
  checks: Record<string, boolean>
}> {
  const checks = {
    database: false,
    redis: false,
    external_api: false
  }
  
  try {
    // Database check
    await db.$queryRaw`SELECT 1`
    checks.database = true
  } catch (error) {
    console.error('Database health check failed:', error)
  }
  
  try {
    // Redis check (if using)
    await redis.ping()
    checks.redis = true
  } catch (error) {
    console.error('Redis health check failed:', error)
  }
  
  try {
    // External API check
    const response = await fetch(`${process.env.EXTERNAL_API_URL}/health`)
    checks.external_api = response.ok
  } catch (error) {
    console.error('External API health check failed:', error)
  }
  
  const allHealthy = Object.values(checks).every(Boolean)
  
  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks
  }
}
```

This comprehensive template collection provides standardized patterns for implementing SPARC methodology across all phases of Next.js development, ensuring consistency, quality, and maintainability.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create requirements.md with specification templates", "status": "completed", "activeForm": "Creating requirements.md with specification templates"}, {"content": "Create architecture.md with Next.js patterns", "status": "completed", "activeForm": "Creating architecture.md with Next.js patterns"}, {"content": "Create workflow.md with SPARC process flows", "status": "completed", "activeForm": "Creating workflow.md with SPARC process flows"}, {"content": "Create templates.md with reusable templates", "status": "completed", "activeForm": "Creating templates.md with reusable templates"}, {"content": "Ensure proper directory structure in /docs", "status": "completed", "activeForm": "Ensuring proper directory structure in /docs"}, {"content": "Include Next.js/Tailwind specific examples", "status": "completed", "activeForm": "Including Next.js/Tailwind specific examples"}, {"content": "Add pseudocode patterns for React components", "status": "completed", "activeForm": "Adding pseudocode patterns for React components"}, {"content": "Create completion checklists for web development", "status": "completed", "activeForm": "Creating completion checklists for web development"}]