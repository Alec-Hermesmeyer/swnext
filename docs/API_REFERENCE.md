# API Reference - S&W Foundation Contractors

## Overview

This document provides comprehensive documentation for all API endpoints, components, and utilities in the S&W Foundation Contractors Next.js application, developed using SPARC methodology.

## Table of Contents

1. [API Routes](#api-routes)
2. [Component API](#component-api)
3. [Utility Functions](#utility-functions)
4. [Hooks](#hooks)
5. [Types and Interfaces](#types-and-interfaces)

## API Routes

### Contact Management

#### POST /api/create-contact-form
Creates a new contact form submission.

**Request Body:**
```typescript
interface ContactFormData {
  name: string;           // Required: Contact name
  email: string;          // Required: Contact email
  phone?: string;         // Optional: Phone number
  company?: string;       // Optional: Company name
  message: string;        // Required: Message content
  service?: string;       // Optional: Service of interest
  projectType?: string;   // Optional: Project type
}
```

**Response:**
```typescript
interface ContactResponse {
  success: boolean;
  message: string;
  id?: string;           // Contact form ID if successful
  error?: string;        // Error message if failed
}
```

**Example:**
```javascript
// POST /api/create-contact-form
const response = await fetch('/api/create-contact-form', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '(555) 123-4567',
    message: 'Interested in pier drilling services',
    service: 'pier-drilling'
  })
});
```

#### POST /api/send-email
Sends email notifications for contact forms and job applications.

**Request Body:**
```typescript
interface EmailData {
  to: string;            // Recipient email
  subject: string;       // Email subject
  type: 'contact' | 'job-application' | 'inquiry';
  data: Record<string, any>; // Email template data
}
```

### Job Management

#### GET /api/job-postings
Retrieves all active job postings.

**Query Parameters:**
```typescript
interface JobPostingQuery {
  status?: 'active' | 'inactive' | 'all';
  category?: string;     // Job category filter
  location?: string;     // Location filter
  limit?: number;        // Number of results to return
  offset?: number;       // Pagination offset
}
```

**Response:**
```typescript
interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  category: string;
  salary?: string;
  type: 'full-time' | 'part-time' | 'contract';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface JobPostingsResponse {
  jobs: JobPosting[];
  total: number;
  hasMore: boolean;
}
```

#### POST /api/toggle-job
Toggles job posting status (admin only).

**Request Body:**
```typescript
interface ToggleJobRequest {
  jobId: string;
  status: 'active' | 'inactive';
}
```

### Content Management

#### GET /api/blog-posts
Retrieves blog posts with filtering and pagination.

**Query Parameters:**
```typescript
interface BlogPostQuery {
  status?: 'published' | 'draft' | 'all';
  category?: string;
  tag?: string;
  limit?: number;
  offset?: number;
  search?: string;      // Search in title and content
}
```

**Response:**
```typescript
interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  featuredImage?: string;
  publishedAt: string;
  status: 'published' | 'draft';
}
```

#### GET /api/images
Retrieves optimized images from Supabase storage.

**Query Parameters:**
```typescript
interface ImageQuery {
  bucket: string;        // Supabase bucket name
  path: string;         // Image path in bucket
  width?: number;       // Desired width
  height?: number;      // Desired height
  quality?: number;     // Image quality (1-100)
}
```

### Data Analytics

#### GET /api/sales-data
Retrieves sales and performance data for admin dashboard.

**Response:**
```typescript
interface SalesData {
  totalRevenue: number;
  monthlyRevenue: number[];
  projectCount: number;
  activeProjects: number;
  completedProjects: number;
  customerSatisfaction: number;
  trends: {
    revenue: 'up' | 'down' | 'stable';
    projects: 'up' | 'down' | 'stable';
  };
}
```

## Component API

### Layout Components

#### TWLayout
Main layout component with header, footer, and navigation.

**Props:**
```typescript
interface TWLayoutProps {
  children: React.ReactNode;
  title?: string;           // Page title for SEO
  description?: string;     // Meta description
  canonical?: string;       // Canonical URL
  noIndex?: boolean;        // Prevent search engine indexing
}
```

**Usage:**
```jsx
import TWLayout from '@/components/TWLayout';

function Page() {
  return (
    <div>Page content</div>
  );
}

Page.getLayout = function getLayout(page) {
  return (
    <TWLayout 
      title="Services - S&W Foundation"
      description="Professional foundation services in Dallas"
    >
      {page}
    </TWLayout>
  );
};
```

#### NavTailwind
Responsive navigation component with mobile menu support.

**Props:**
```typescript
interface NavTailwindProps {
  transparent?: boolean;    // Transparent background
  fixed?: boolean;         // Fixed positioning
  className?: string;      // Additional CSS classes
}
```

### UI Components

#### FadeIn / FadeInStagger
Animation components using Framer Motion.

**FadeIn Props:**
```typescript
interface FadeInProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;          // Animation delay in seconds
  duration?: number;       // Animation duration in seconds
  className?: string;
}
```

**FadeInStagger Props:**
```typescript
interface FadeInStaggerProps {
  children: React.ReactNode;
  stagger?: number;        // Delay between children animations
  className?: string;
}
```

**Usage:**
```jsx
<FadeInStagger stagger={0.1}>
  <FadeIn direction="up" delay={0.2}>
    <h1>Animated Title</h1>
  </FadeIn>
  <FadeIn direction="up" delay={0.3}>
    <p>Animated content</p>
  </FadeIn>
</FadeInStagger>
```

#### Button
Reusable button component with multiple variants.

**Props:**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  href?: string;          // Renders as Link if provided
  external?: boolean;     // Opens in new tab if href provided
}
```

**Usage:**
```jsx
<Button 
  variant="primary" 
  size="lg" 
  loading={isSubmitting}
  onClick={handleSubmit}
>
  Submit Form
</Button>

<Button 
  variant="outline" 
  href="/contact"
  icon={<PhoneIcon />}
>
  Contact Us
</Button>
```

#### Card
Content card component with multiple layouts.

**Props:**
```typescript
interface CardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  image?: string;
  href?: string;
  variant?: 'default' | 'featured' | 'compact';
  className?: string;
}
```

### Form Components

#### Form
Form wrapper with validation and error handling.

**Props:**
```typescript
interface FormProps {
  onSubmit: (data: Record<string, any>) => Promise<void>;
  schema?: any;           // Validation schema
  className?: string;
  children: React.ReactNode;
}
```

#### Input
Form input component with validation.

**Props:**
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  required?: boolean;
  variant?: 'default' | 'filled' | 'outline';
}
```

### Specialized Components

#### JobForm
Job application form component.

**Props:**
```typescript
interface JobFormProps {
  jobId: string;
  jobTitle: string;
  onSubmit: (data: JobApplicationData) => Promise<void>;
  className?: string;
}

interface JobApplicationData {
  name: string;
  email: string;
  phone: string;
  resume: File;
  coverLetter?: string;
  experience: string;
  availability: string;
}
```

#### GalleryGrid
Image gallery component with lightbox functionality.

**Props:**
```typescript
interface GalleryGridProps {
  images: GalleryImage[];
  columns?: number;       // Number of columns (responsive)
  aspectRatio?: string;   // CSS aspect ratio
  onImageClick?: (image: GalleryImage, index: number) => void;
}

interface GalleryImage {
  src: string;
  alt: string;
  title?: string;
  description?: string;
  category?: string;
}
```

## Utility Functions

### Image Handling

#### optimizeImage
Optimizes images using Next.js Image component with Supabase loader.

```typescript
function optimizeImage(
  src: string, 
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  }
): string;
```

#### getImageDimensions
Gets image dimensions for responsive loading.

```typescript
async function getImageDimensions(src: string): Promise<{
  width: number;
  height: number;
  aspectRatio: number;
}>;
```

### Data Processing

#### formatDate
Formats dates for display.

```typescript
function formatDate(
  date: string | Date,
  options?: {
    format?: 'short' | 'long' | 'relative';
    locale?: string;
  }
): string;
```

#### sanitizeInput
Sanitizes user input for security.

```typescript
function sanitizeInput(input: string, type?: 'text' | 'html' | 'email'): string;
```

#### generateSlug
Generates URL-friendly slugs.

```typescript
function generateSlug(text: string): string;
```

### Validation

#### validateEmail
Validates email addresses.

```typescript
function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
};
```

#### validatePhone
Validates phone numbers.

```typescript
function validatePhone(phone: string): {
  isValid: boolean;
  formatted: string;
  error?: string;
};
```

## Hooks

### Data Fetching

#### useFetch
Generic data fetching hook with caching.

```typescript
function useFetch<T>(
  url: string,
  options?: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    cache?: boolean;
    revalidate?: number;
  }
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  mutate: () => void;
};
```

#### useJobPostings
Hook for fetching job postings.

```typescript
function useJobPostings(filters?: JobPostingQuery): {
  jobs: JobPosting[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
};
```

### Form Handling

#### useForm
Form state and validation hook.

```typescript
function useForm<T>(options: {
  initialValues: T;
  validationSchema?: any;
  onSubmit: (values: T) => Promise<void>;
}): {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  handleChange: (field: keyof T, value: any) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: () => Promise<void>;
  reset: () => void;
};
```

### UI State

#### useLocalStorage
Local storage hook with SSR safety.

```typescript
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void];
```

#### useMediaQuery
Responsive breakpoint hook.

```typescript
function useMediaQuery(query: string): boolean;
```

## Types and Interfaces

### Common Types

```typescript
// Base entity interface
interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// API response wrapper
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Pagination
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// File upload
interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}
```

### Component Props

```typescript
// Common component props
interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

// Animation props
interface AnimationProps {
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

// SEO props
interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}
```

## Error Handling

### API Error Responses

All API endpoints return consistent error responses:

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  details?: Record<string, any>;
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_REQUIRED`: User authentication required
- `PERMISSION_DENIED`: Insufficient permissions
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server-side error

## Authentication

### Protected Routes

Routes requiring authentication should use the `withAuth` HOC:

```typescript
import withAuth from '@/components/withAuth';

const AdminPage = () => {
  return <div>Admin content</div>;
};

export default withAuth(AdminPage);
```

### Auth Context

```typescript
interface AuthContext {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
```

## Performance Considerations

### Image Optimization
- All images use Next.js Image component
- Supabase storage integration for CDN delivery
- Automatic WebP format conversion
- Responsive image loading

### Code Splitting
- Route-based code splitting by default
- Component-level splitting for large components
- Dynamic imports for non-critical components

### Caching
- API response caching with SWR
- Static asset caching via CDN
- Database query optimization

## Testing

### Component Testing

```typescript
// Example test structure
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### API Testing

```typescript
// Example API test
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/contact-form';

describe('/api/contact-form', () => {
  it('creates contact form submission', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String)
      })
    );
  });
});
```

## Deployment

### Environment Variables

```bash
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email service
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id
VERCEL_ANALYTICS_ID=your_vercel_analytics_id
```

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Production start
npm run start

# Linting
npm run lint

# Type checking
npm run type-check
```

This API reference follows SPARC methodology principles, providing clear specifications, architectural guidelines, and implementation details for all components and endpoints in the application.