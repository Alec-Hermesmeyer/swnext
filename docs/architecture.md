# SPARC Architecture Guidelines

## Overview

The **Architecture** phase of SPARC methodology focuses on designing scalable, maintainable systems for Next.js applications. This document provides architectural patterns, design principles, and implementation guidelines.

## Next.js Architecture Patterns

### 1. Application Structure

#### Recommended Directory Structure
```
src/
├── app/                    # App Router (Next.js 13+)
│   ├── (auth)/            # Route groups
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── loading.tsx
│   ├── api/               # API routes
│   │   ├── auth/
│   │   └── users/
│   ├── globals.css
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── features/         # Feature-specific components
├── lib/                  # Utilities and configurations
│   ├── auth.ts          # Authentication logic
│   ├── db.ts            # Database connection
│   ├── utils.ts         # Helper functions
│   └── validations.ts   # Zod schemas
├── hooks/               # Custom React hooks
├── store/               # State management
├── types/               # TypeScript type definitions
└── styles/              # Additional CSS files
```

#### Component Architecture
```typescript
// Component hierarchy example
interface ComponentArchitecture {
  pages: {
    purpose: "Route-level components"
    location: "app/**/page.tsx"
    responsibilities: ["Data fetching", "Layout composition", "SEO metadata"]
  }
  
  layouts: {
    purpose: "Shared UI structure"
    location: "app/**/layout.tsx"
    responsibilities: ["Common navigation", "Global providers", "Metadata"]
  }
  
  features: {
    purpose: "Business logic components"
    location: "components/features/"
    responsibilities: ["Feature-specific logic", "State management", "API calls"]
  }
  
  ui: {
    purpose: "Reusable UI primitives"
    location: "components/ui/"
    responsibilities: ["Visual presentation", "Accessibility", "Styling"]
  }
}
```

### 2. Data Flow Architecture

#### Server-Client Data Flow
```yaml
data_flow_patterns:
  server_side:
    - name: "Server Components"
      usage: "Default for data fetching"
      benefits: ["Zero JS bundle", "Direct DB access", "SEO friendly"]
      example: "Dashboard with user data"
    
    - name: "API Routes"
      usage: "Client-side data mutations"
      benefits: ["Type-safe endpoints", "Middleware support", "Server logic"]
      example: "User profile updates"
  
  client_side:
    - name: "Client Components"
      usage: "Interactive UI elements"
      benefits: ["React hooks", "Browser APIs", "Real-time updates"]
      example: "Form inputs, modals"
    
    - name: "SWR/React Query"
      usage: "Client-side data fetching"
      benefits: ["Caching", "Revalidation", "Optimistic updates"]
      example: "Live notifications"
```

#### State Management Strategy
```typescript
// State management layers
interface StateArchitecture {
  server_state: {
    tools: ["SWR", "TanStack Query", "Next.js cache"]
    use_cases: ["API data", "User sessions", "Configuration"]
    patterns: ["Fetch-on-render", "Parallel fetching", "Prefetching"]
  }
  
  client_state: {
    tools: ["useState", "useReducer", "Zustand", "Jotai"]
    use_cases: ["Form data", "UI state", "Theme preferences"]
    patterns: ["Local state", "Context providers", "Global stores"]
  }
  
  url_state: {
    tools: ["Next.js router", "searchParams", "nuqs"]
    use_cases: ["Filters", "Pagination", "Active tabs"]
    patterns: ["Search params", "Dynamic routes", "Hash navigation"]
  }
}
```

### 3. Styling Architecture

#### Tailwind CSS Architecture
```yaml
styling_strategy:
  utility_first:
    approach: "Tailwind utility classes"
    benefits: ["Consistent design", "Small CSS bundle", "Fast development"]
    examples:
      - "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      - "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  
  component_patterns:
    - name: "Design System Components"
      pattern: "Compound components with variants"
      example: |
        const Button = ({ variant, size, children, ...props }) => {
          return (
            <button
              className={cn(
                "inline-flex items-center justify-center rounded-md font-medium",
                "focus-visible:outline-none focus-visible:ring-2",
                {
                  "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
                  "border border-input bg-background hover:bg-accent": variant === "outline",
                  "h-10 px-4 py-2": size === "default",
                  "h-9 px-3": size === "sm"
                }
              )}
              {...props}
            >
              {children}
            </button>
          )
        }
    
    - name: "Layout Patterns"
      pattern: "Responsive grid systems"
      examples:
        - "Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        - "Grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        - "Flex: flex flex-col md:flex-row gap-4 md:gap-8"
```

#### CSS-in-JS Integration (Optional)
```typescript
// Styled-components with Tailwind
const StyledCard = styled.div.attrs({
  className: "bg-white rounded-lg shadow-md p-6"
})`
  /* Custom styles that can't be expressed in Tailwind */
  background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  &:hover {
    transform: translateY(-2px);
    transition: transform 0.2s ease-in-out;
  }
`
```

## Database Architecture

### 1. Database Design Patterns

#### Prisma Schema Example
```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  posts     Post[]
  sessions  Session[]
  accounts  Account[]
  
  @@map("users")
}

model Post {
  id          String    @id @default(cuid())
  title       String
  content     String?
  published   Boolean   @default(false)
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relations
  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId    String
  categories  Category[]
  
  // Indexes
  @@index([authorId])
  @@index([published, publishedAt])
  @@map("posts")
}

model Category {
  id    String @id @default(cuid())
  name  String @unique
  slug  String @unique
  
  // Relations
  posts Post[]
  
  @@map("categories")
}
```

#### Database Access Patterns
```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Repository pattern example
export class UserRepository {
  static async findByEmail(email: string) {
    return db.user.findUnique({
      where: { email },
      include: { posts: { take: 5, orderBy: { createdAt: 'desc' } } }
    })
  }
  
  static async createUser(data: CreateUserInput) {
    return db.user.create({
      data,
      select: { id: true, email: true, name: true }
    })
  }
}
```

### 2. Caching Strategy

#### Multi-Level Caching
```typescript
// lib/cache.ts
import { Redis } from 'ioredis'
import { unstable_cache } from 'next/cache'

const redis = new Redis(process.env.REDIS_URL)

// Application-level caching
export const getCachedUser = unstable_cache(
  async (userId: string) => {
    return db.user.findUnique({ where: { id: userId } })
  },
  ['user'],
  { revalidate: 60 * 5 } // 5 minutes
)

// Redis caching for frequently accessed data
export const getCachedStats = async (key: string) => {
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)
  
  const stats = await computeExpensiveStats()
  await redis.setex(key, 300, JSON.stringify(stats)) // 5 minutes
  return stats
}

// React Cache for request deduplication
export const getUser = cache(async (userId: string) => {
  return db.user.findUnique({ where: { id: userId } })
})
```

## Authentication Architecture

### 1. NextAuth.js Configuration
```typescript
// lib/auth.ts
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from './db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: { strategy: 'jwt' },
})
```

### 2. Route Protection Patterns
```typescript
// middleware.ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  
  // Protected routes
  if (pathname.startsWith('/dashboard')) {
    if (!req.auth) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
  }
  
  // Admin routes
  if (pathname.startsWith('/admin')) {
    if (!req.auth || req.auth.user.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

## API Architecture

### 1. API Route Patterns
```typescript
// app/api/users/route.ts
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
})

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Request validation
    const body = await request.json()
    const { email, name } = CreateUserSchema.parse(body)
    
    // Business logic
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }
    
    const user = await db.user.create({
      data: { email, name },
      select: { id: true, email: true, name: true }
    })
    
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    // Database query
    const [users, total] = await Promise.all([
      db.user.findMany({
        skip,
        take: limit,
        select: { id: true, email: true, name: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
      }),
      db.user.count()
    ])
    
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('User fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 2. Error Handling Strategy
```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

// Global error handler
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }
  
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { 
        error: 'Validation failed',
        details: error.errors
      },
      { status: 400 }
    )
  }
  
  console.error('Unexpected error:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

## Performance Architecture

### 1. Optimization Strategies
```yaml
performance_patterns:
  rendering:
    - strategy: "Static Site Generation (SSG)"
      use_cases: ["Landing pages", "Blog posts", "Documentation"]
      implementation: "generateStaticParams + static rendering"
    
    - strategy: "Incremental Static Regeneration (ISR)"
      use_cases: ["Product catalogs", "News feeds", "Dynamic content"]
      implementation: "revalidate option in fetch/unstable_cache"
    
    - strategy: "Server-Side Rendering (SSR)"
      use_cases: ["User dashboards", "Personalized content", "Real-time data"]
      implementation: "Dynamic rendering with database queries"
  
  bundling:
    - strategy: "Code Splitting"
      techniques: ["Route-based", "Component-based", "Dynamic imports"]
      tools: ["Next.js automatic splitting", "React.lazy", "dynamic()"]
    
    - strategy: "Tree Shaking"
      implementation: ["ES modules", "Proper imports", "Bundle analyzer"]
    
    - strategy: "Image Optimization"
      features: ["WebP/AVIF conversion", "Responsive sizing", "Lazy loading"]
      component: "next/image with priority/placeholder props"
```

### 2. Monitoring and Analytics
```typescript
// lib/analytics.ts
export class PerformanceMonitor {
  static trackWebVitals(metric: any) {
    // Send to analytics service
    if (typeof window !== 'undefined') {
      gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      })
    }
  }
  
  static trackPageView(url: string) {
    gtag('config', GA_TRACKING_ID, {
      page_path: url,
    })
  }
  
  static trackEvent(action: string, category: string, label?: string, value?: number) {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Analytics />
        <SpeedInsights />
        {children}
      </body>
    </html>
  )
}
```

## Security Architecture

### 1. Security Layers
```yaml
security_measures:
  authentication:
    - "JWT tokens with secure httpOnly cookies"
    - "OAuth2 with trusted providers"
    - "Session management with NextAuth.js"
    - "CSRF protection with SameSite cookies"
  
  authorization:
    - "Role-based access control (RBAC)"
    - "Resource-level permissions"
    - "API route protection with middleware"
    - "Client-side route guards"
  
  data_protection:
    - "Input validation with Zod schemas"
    - "SQL injection prevention with Prisma"
    - "XSS protection with proper escaping"
    - "Content Security Policy (CSP) headers"
  
  infrastructure:
    - "HTTPS enforcement"
    - "Environment variable security"
    - "Rate limiting with Upstash Redis"
    - "Error message sanitization"
```

### 2. Security Implementation
```typescript
// middleware.ts - Security headers
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  )
  
  return response
}

// Rate limiting
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function rateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier)
  
  if (!success) {
    throw new AppError('Rate limit exceeded', 429)
  }
  
  return { limit, reset, remaining }
}
```

## Testing Architecture

### 1. Testing Strategy
```yaml
testing_pyramid:
  unit_tests:
    tools: ["Jest", "Vitest", "@testing-library/react"]
    scope: ["Utilities", "Hooks", "Components", "API functions"]
    coverage: "80%+"
  
  integration_tests:
    tools: ["Jest", "MSW", "@testing-library/react"]
    scope: ["API routes", "Database operations", "Component interactions"]
    coverage: "Key user flows"
  
  e2e_tests:
    tools: ["Playwright", "Cypress"]
    scope: ["Critical user journeys", "Cross-browser compatibility"]
    coverage: "Happy paths + error scenarios"
```

### 2. Testing Implementation
```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })
  
  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  it('shows loading state', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })
})

// __tests__/api/users.test.ts
import { POST } from '@/app/api/users/route'
import { NextRequest } from 'next/server'

// Mock auth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn()
}))

describe('/api/users', () => {
  it('creates user successfully', async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: '1' } })
    
    const request = new NextRequest('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User'
      })
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.email).toBe('test@example.com')
  })
})
```

This architecture guide provides a comprehensive framework for building scalable Next.js applications following SPARC methodology principles.