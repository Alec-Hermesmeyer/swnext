# System Architecture - S&W Foundation Contractors

## Overview

This document outlines the system architecture for the S&W Foundation Contractors Next.js application, implementing SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology for systematic development.

## Architecture Principles

### 1. Component-Based Architecture (C4 Model)

```
┌─────────────────────────────────────────────────────────────┐
│                    System Context (Level 1)                │
│                                                             │
│  ┌─────────────┐    ┌──────────────────┐    ┌────────────┐│
│  │    Users    │◄──►│  S&W Website     │◄──►│  Supabase  ││
│  │             │    │  (Next.js App)   │    │  Storage   ││
│  └─────────────┘    └──────────────────┘    └────────────┘│
│                              ▲                             │
│                              │                             │
│                      ┌──────────────┐                     │
│                      │ External APIs │                     │
│                      │ (Email, etc.) │                     │
│                      └──────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### 2. Container Architecture (Level 2)

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  Presentation │  │   Business   │  │   Data Access    │ │
│  │    Layer      │  │    Logic     │  │     Layer        │ │
│  │              │  │              │  │                  │ │
│  │ - Pages      │  │ - Context    │  │ - API Routes     │ │
│  │ - Components │  │ - Hooks      │  │ - External APIs  │ │
│  │ - Layouts    │  │ - Utils      │  │ - File System    │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure (CLAUDE.md Compliant)

```
swnext/
├── src/                    # Source code (following CLAUDE.md guidelines)
│   ├── components/         # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── lib/               # Third-party integrations
│   ├── types/             # TypeScript type definitions
│   └── constants/         # Application constants
├── docs/                  # Documentation (CLAUDE.md compliant)
│   ├── architecture/      # Architecture documentation
│   ├── adr/              # Architecture Decision Records
│   └── patterns/         # Design patterns documentation
├── config/               # Configuration files (CLAUDE.md compliant)
│   ├── eslint/           # ESLint configurations
│   ├── tailwind/         # Tailwind configurations
│   └── next/             # Next.js configurations
├── tests/                # Test files (CLAUDE.md compliant)
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── pages/                # Next.js pages (existing)
├── components/           # Legacy components (to be migrated)
├── public/               # Static assets
└── styles/               # Global styles
```

## Component Architecture

### 1. Layout Components
- **TWLayout**: Main layout wrapper with header/footer
- **AdminLayout**: Administrative interface layout
- **NavTailwind**: Navigation component with responsive design

### 2. UI Components
- **FadeIn/FadeInStagger**: Animation components using Framer Motion
- **Button**: Reusable button component with variants
- **Card**: Content card component
- **Form**: Form handling components

### 3. Page Components
- **Hero Sections**: Reusable hero components for different pages
- **Info Blocks**: Content blocks with image/text combinations
- **CTA Components**: Call-to-action components

## Technology Stack

### Frontend
- **Next.js 15.3.4**: React framework with SSG/SSR
- **React 18.3.1**: Component library
- **Tailwind CSS 3.4.14**: Utility-first CSS framework
- **Framer Motion 10.16.12**: Animation library

### Backend & Data
- **Supabase**: Database and file storage
- **Vercel**: Deployment platform
- **Next.js API Routes**: Backend API endpoints

### Development Tools
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixes

## Design Patterns

### 1. Layout Pattern
```jsx
// Layout with getLayout pattern
function Page() {
  return <div>Page Content</div>;
}

Page.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};
```

### 2. Animation Pattern
```jsx
// Consistent animation patterns
<FadeInStagger>
  <FadeIn>Component 1</FadeIn>
  <FadeIn>Component 2</FadeIn>
</FadeInStagger>
```

### 3. Full-Width Sections Pattern
```jsx
// Full viewport width sections
<section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2">
  {/* Content */}
</section>
```

## Quality Attributes

### Performance
- **Optimization**: Next.js Image optimization
- **Lazy Loading**: Component-level lazy loading
- **Bundle Size**: Code splitting and tree shaking

### Scalability
- **Component Reusability**: Modular component design
- **File Organization**: Clear separation of concerns
- **Code Splitting**: Route-based code splitting

### Maintainability
- **Consistent Patterns**: Standardized component patterns
- **Documentation**: Comprehensive documentation
- **Testing**: Unit and integration testing strategy

### Security
- **Environment Variables**: Secure configuration management
- **Input Validation**: Form validation and sanitization
- **CSP**: Content Security Policy implementation

## Integration Points

### External Services
- **Supabase Storage**: Image and file storage
- **Email Services**: Contact form handling
- **Analytics**: Vercel Analytics integration

### API Integration
- **REST APIs**: Standard REST API patterns
- **File Upload**: Image upload and optimization
- **Form Processing**: Contact and submission forms

## Deployment Architecture

### Vercel Deployment
```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Platform                         │
│                                                             │
│  ┌──────────────┐    ┌──────────────────┐    ┌────────────┐│
│  │   CDN Edge   │◄──►│  Next.js App     │◄──►│  Serverless││
│  │   Caching    │    │  (Static/SSR)    │    │  Functions ││
│  └──────────────┘    └──────────────────┘    └────────────┘│
│                              ▲                             │
│                              │                             │
│                      ┌──────────────┐                     │
│                      │   Supabase   │                     │
│                      │   Backend    │                     │
│                      └──────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## Future Considerations

### Scalability Enhancements
- Component library extraction
- Micro-frontend architecture
- Progressive Web App (PWA) features
- Advanced caching strategies

### Performance Optimizations
- Image optimization pipeline
- Service worker implementation
- Advanced code splitting
- Database query optimization

### Developer Experience
- TypeScript migration
- Automated testing pipeline
- Component documentation
- Design system implementation

## SPARC Integration

This architecture supports the SPARC methodology:
- **Specification**: Clear requirements and user stories
- **Pseudocode**: Algorithm design and logic planning
- **Architecture**: This document and system design
- **Refinement**: Test-driven development approach
- **Completion**: Integration and deployment strategies