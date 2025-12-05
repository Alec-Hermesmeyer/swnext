# Component Development Guide

## Overview

This guide provides comprehensive instructions for developing components in the S&W Foundation Contractors Next.js application using SPARC methodology and Tailwind CSS.

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [SPARC Component Development Process](#sparc-component-development-process)
3. [Tailwind CSS Integration](#tailwind-css-integration)
4. [Component Patterns](#component-patterns)
5. [Testing Strategy](#testing-strategy)
6. [Performance Guidelines](#performance-guidelines)
7. [Accessibility Standards](#accessibility-standards)

## Component Architecture

### Directory Structure

Components should follow the CLAUDE.md compliant structure:

```
src/
├── components/
│   ├── ui/                 # Basic UI components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   └── Card/
│   ├── layout/            # Layout components
│   │   ├── Header/
│   │   ├── Footer/
│   │   └── Navigation/
│   ├── features/          # Feature-specific components
│   │   ├── ContactForm/
│   │   ├── JobListing/
│   │   └── Gallery/
│   └── common/           # Shared utility components
│       ├── SEO/
│       ├── Loading/
│       └── Error/
```

### Component Types

#### 1. Presentation Components
Pure components that only handle UI rendering.

```tsx
// Example: Button component
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors rounded-md';
  const variantClasses = {
    primary: 'bg-red-600 text-white hover:bg-red-700',
    secondary: 'bg-[#0b2a5a] text-white hover:bg-[#0b2a5a]/90',
    outline: 'border border-red-600 text-red-600 hover:bg-red-50'
  };
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <LoadingSpinner className="mr-2" />}
      {children}
    </button>
  );
};
```

#### 2. Container Components
Components that manage state and business logic.

```tsx
// Example: ContactForm container
import { useState } from 'react';
import { useForm } from '@/hooks/useForm';
import ContactFormPresentation from './ContactFormPresentation';

const ContactForm: React.FC = () => {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const { values, errors, handleChange, handleSubmit } = useForm({
    initialValues: {
      name: '',
      email: '',
      message: ''
    },
    validationSchema: contactFormSchema,
    onSubmit: async (data) => {
      setSubmitStatus('loading');
      try {
        await submitContactForm(data);
        setSubmitStatus('success');
      } catch (error) {
        setSubmitStatus('error');
      }
    }
  });

  return (
    <ContactFormPresentation
      values={values}
      errors={errors}
      submitStatus={submitStatus}
      onFieldChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
};
```

#### 3. Layout Components
Components that define page structure and navigation.

```tsx
// Example: PageLayout component
interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  description,
  showHeader = true,
  showFooter = true
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO title={title} description={description} />
      {showHeader && <Header />}
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};
```

## SPARC Component Development Process

### Phase 1: Specification

#### Requirements Definition
Create a specification document for each component:

```markdown
# Component Specification: Hero Section

## Purpose
Display company branding, value proposition, and primary call-to-action on the homepage.

## Requirements
- Responsive design for all screen sizes
- Background image with overlay
- Company logo and tagline
- Primary and secondary CTA buttons
- Loading states and error handling
- Accessibility compliance (WCAG 2.1 AA)

## User Stories
- As a visitor, I want to immediately understand what the company does
- As a visitor, I want clear navigation to key pages
- As a mobile user, I want optimized content for my device

## Acceptance Criteria
- [ ] Hero loads within 2 seconds on 3G connection
- [ ] All images are optimized and responsive
- [ ] CTA buttons are keyboard accessible
- [ ] Content is readable with screen readers
- [ ] Component works without JavaScript
```

#### API Contract Definition
Define the component's interface:

```tsx
interface HeroProps {
  title: string;
  subtitle?: string;
  backgroundImage: string;
  primaryCTA: {
    text: string;
    href: string;
    variant?: 'primary' | 'secondary';
  };
  secondaryCTA?: {
    text: string;
    href: string;
  };
  loading?: boolean;
  error?: string;
}
```

### Phase 2: Pseudocode

Document the component logic:

```
HERO COMPONENT ALGORITHM:
1. INITIALIZE component with props validation
2. SET UP responsive image loading with error handling
3. RENDER background image with optimization
   - IF mobile: load smaller image variant
   - IF desktop: load full resolution
   - IF error: show fallback background
4. APPLY overlay with proper contrast ratios
5. RENDER content with proper typography hierarchy
   - Title: H1 with brand font
   - Subtitle: H2 with secondary styling
6. RENDER CTA buttons with proper spacing and hover states
7. HANDLE loading states with skeleton UI
8. HANDLE error states with user-friendly messages
9. IMPLEMENT accessibility features
   - Alt text for images
   - Proper heading hierarchy
   - Keyboard navigation
10. ADD performance optimizations
    - Lazy loading for non-critical content
    - Preload critical resources
```

### Phase 3: Architecture

Design the component structure:

```tsx
// Component architecture design
const Hero: React.FC<HeroProps> = (props) => {
  // 1. State Management
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 2. Event Handlers
  const handleImageLoad = () => setImageLoaded(true);
  const handleImageError = () => setImageError(true);

  // 3. Computed Properties
  const backgroundStyle = useMemo(() => ({
    backgroundImage: imageError ? 'none' : `url(${props.backgroundImage})`,
    backgroundColor: imageError ? '#0b2a5a' : 'transparent'
  }), [props.backgroundImage, imageError]);

  // 4. Render Logic
  return (
    <section className={heroClasses} style={backgroundStyle}>
      {/* Background Image */}
      {/* Content Overlay */}
      {/* Hero Content */}
      {/* CTA Buttons */}
      {/* Loading/Error States */}
    </section>
  );
};
```

### Phase 4: Refinement (TDD Implementation)

#### Test-Driven Development Process

1. **Write failing tests first:**

```tsx
// Hero.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Hero from './Hero';

describe('Hero Component', () => {
  const defaultProps = {
    title: 'S&W Foundation Contractors',
    subtitle: 'Professional Foundation Services',
    backgroundImage: '/hero-bg.jpg',
    primaryCTA: { text: 'Our Services', href: '/services' }
  };

  it('renders title and subtitle correctly', () => {
    render(<Hero {...defaultProps} />);
    
    expect(screen.getByRole('heading', { level: 1 }))
      .toHaveTextContent('S&W Foundation Contractors');
    expect(screen.getByRole('heading', { level: 2 }))
      .toHaveTextContent('Professional Foundation Services');
  });

  it('renders primary CTA button with correct link', () => {
    render(<Hero {...defaultProps} />);
    
    const ctaButton = screen.getByRole('link', { name: 'Our Services' });
    expect(ctaButton).toHaveAttribute('href', '/services');
  });

  it('handles image loading states', async () => {
    render(<Hero {...defaultProps} />);
    
    // Test loading state
    expect(screen.getByTestId('hero-skeleton')).toBeInTheDocument();
    
    // Simulate image load
    const backgroundImage = screen.getByTestId('hero-background');
    fireEvent.load(backgroundImage);
    
    // Test loaded state
    expect(screen.queryByTestId('hero-skeleton')).not.toBeInTheDocument();
  });

  it('handles image error states', () => {
    render(<Hero {...defaultProps} />);
    
    const backgroundImage = screen.getByTestId('hero-background');
    fireEvent.error(backgroundImage);
    
    expect(screen.getByTestId('hero-fallback')).toBeInTheDocument();
  });

  it('is accessible with screen readers', () => {
    render(<Hero {...defaultProps} />);
    
    // Test semantic structure
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    
    // Test keyboard navigation
    const ctaButton = screen.getByRole('link', { name: 'Our Services' });
    expect(ctaButton).toHaveAttribute('tabindex', '0');
  });
});
```

2. **Implement minimum viable functionality:**

```tsx
// Hero.tsx - Initial implementation
const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  backgroundImage,
  primaryCTA,
  secondaryCTA,
  loading = false,
  error
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (loading) {
    return <HeroSkeleton />;
  }

  if (error) {
    return <HeroError message={error} />;
  }

  return (
    <section 
      role="banner"
      className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[70vh] md:min-h-[80vh] flex items-center"
    >
      {/* Background Image */}
      <div
        data-testid="hero-background"
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-300"
        style={{ 
          backgroundImage: imageError ? 'none' : `url(${backgroundImage})`,
          backgroundColor: imageError ? '#0b2a5a' : 'transparent',
          opacity: imageLoaded ? 1 : 0
        }}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Content */}
      <div className="relative mx-auto w-full px-6 py-28 md:px-10 md:py-40">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
            {title}
          </h1>
          {subtitle && (
            <h2 className="text-xl md:text-2xl text-neutral-200 mb-8">
              {subtitle}
            </h2>
          )}
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              href={primaryCTA.href}
              variant={primaryCTA.variant || 'primary'}
              size="lg"
            >
              {primaryCTA.text}
            </Button>
            {secondaryCTA && (
              <Button
                href={secondaryCTA.href}
                variant="outline"
                size="lg"
              >
                {secondaryCTA.text}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {!imageLoaded && !imageError && <HeroSkeleton />}
      {imageError && <HeroFallback data-testid="hero-fallback" />}
    </section>
  );
};
```

3. **Refactor for quality and performance:**

```tsx
// Enhanced implementation with optimizations
const Hero: React.FC<HeroProps> = memo(({
  title,
  subtitle,
  backgroundImage,
  primaryCTA,
  secondaryCTA,
  loading = false,
  error
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  
  // Preload critical image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageState('loaded');
    img.onerror = () => setImageState('error');
    img.src = backgroundImage;
  }, [backgroundImage]);

  // Responsive image source selection
  const responsiveImage = useResponsiveImage(backgroundImage, {
    mobile: { width: 768, quality: 80 },
    tablet: { width: 1024, quality: 85 },
    desktop: { width: 1920, quality: 90 }
  });

  // Memoized styles for performance
  const backgroundStyles = useMemo(() => ({
    backgroundImage: imageState === 'error' ? 'none' : `url(${responsiveImage})`,
    backgroundColor: imageState === 'error' ? '#0b2a5a' : 'transparent'
  }), [responsiveImage, imageState]);

  if (loading) return <HeroSkeleton />;
  if (error) return <HeroError message={error} />;

  return (
    <section 
      role="banner"
      aria-labelledby="hero-title"
      className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[70vh] md:min-h-[80vh] flex items-center overflow-hidden"
    >
      {/* Optimized Background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out transform scale-105 hover:scale-100"
        style={backgroundStyles}
        aria-hidden="true"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />

      {/* Content Container */}
      <div className="relative mx-auto w-full px-6 py-28 md:px-10 md:py-40 z-10">
        <FadeIn direction="up" delay={0.2}>
          <div className="max-w-4xl">
            <h1 
              id="hero-title"
              className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight"
            >
              {title}
            </h1>
            {subtitle && (
              <h2 className="text-xl md:text-2xl text-neutral-200 mb-8 font-light">
                {subtitle}
              </h2>
            )}
            
            {/* CTA Section */}
            <FadeIn direction="up" delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button
                  href={primaryCTA.href}
                  variant={primaryCTA.variant || 'primary'}
                  size="lg"
                  className="transform hover:scale-105 transition-transform"
                >
                  {primaryCTA.text}
                </Button>
                {secondaryCTA && (
                  <Button
                    href={secondaryCTA.href}
                    variant="outline"
                    size="lg"
                    className="transform hover:scale-105 transition-transform"
                  >
                    {secondaryCTA.text}
                  </Button>
                )}
              </div>
            </FadeIn>
          </div>
        </FadeIn>
      </div>

      {/* Loading State Overlay */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 bg-[#0b2a5a] animate-pulse z-20">
          <HeroSkeleton />
        </div>
      )}
    </section>
  );
});

Hero.displayName = 'Hero';
```

### Phase 5: Completion

#### Integration Testing
Test the component within the larger application:

```tsx
// integration/Hero.integration.test.tsx
import { render, screen } from '@testing-library/react';
import { RouterContext } from 'next/router';
import Hero from '../Hero';

describe('Hero Integration', () => {
  it('integrates correctly with Next.js router', () => {
    const mockRouter = {
      push: jest.fn(),
      pathname: '/',
      route: '/',
      asPath: '/',
      query: {}
    };

    render(
      <RouterContext.Provider value={mockRouter}>
        <Hero
          title="Test Title"
          backgroundImage="/test.jpg"
          primaryCTA={{ text: 'Services', href: '/services' }}
        />
      </RouterContext.Provider>
    );

    expect(screen.getByRole('link', { name: 'Services' })).toHaveAttribute('href', '/services');
  });

  it('works with layout components', () => {
    render(
      <TWLayout>
        <Hero
          title="Test Title"
          backgroundImage="/test.jpg"
          primaryCTA={{ text: 'Services', href: '/services' }}
        />
      </TWLayout>
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
```

## Tailwind CSS Integration

### Design System Implementation

#### Color Palette
```tsx
// tailwind.config.js color system
const colors = {
  brand: {
    red: {
      50: '#fef2f2',
      500: '#dc2626',
      600: '#dc2626', // Primary red
      700: '#b91c1c'
    },
    blue: {
      900: '#0b2a5a'    // Primary blue
    }
  },
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    700: '#374151',
    900: '#111827'
  }
};
```

#### Typography System
```tsx
// Typography component with Tailwind
const Typography: React.FC<TypographyProps> = ({ variant, children, className, ...props }) => {
  const variants = {
    h1: 'text-4xl md:text-6xl font-extrabold text-neutral-900',
    h2: 'text-3xl md:text-4xl font-bold text-neutral-900',
    h3: 'text-2xl md:text-3xl font-semibold text-neutral-900',
    body: 'text-base text-neutral-700 leading-relaxed',
    caption: 'text-sm text-neutral-500'
  };

  return (
    <div className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};
```

#### Spacing System
```tsx
// Consistent spacing patterns
const spacing = {
  section: 'py-16 md:py-24',        // Section padding
  container: 'px-6 md:px-10',      // Container padding
  card: 'p-6 md:p-8',              // Card padding
  element: 'mb-4 md:mb-6',         // Element margin
  grid: 'gap-6 md:gap-8',          // Grid spacing
};
```

### Responsive Design Patterns

#### Mobile-First Approach
```tsx
const ResponsiveComponent = () => {
  return (
    <div className="
      // Mobile (default)
      flex flex-col space-y-4 px-4 py-6
      
      // Tablet (md: 768px+)
      md:flex-row md:space-y-0 md:space-x-6 md:px-8 md:py-8
      
      // Desktop (lg: 1024px+)
      lg:px-12 lg:py-12
      
      // Large Desktop (xl: 1280px+)
      xl:px-16 xl:py-16 xl:max-w-7xl xl:mx-auto
    ">
      {/* Content */}
    </div>
  );
};
```

#### Container Patterns
```tsx
// Full-width sections (common pattern in the codebase)
const FullWidthSection = ({ children, className }) => {
  return (
    <section className={`
      relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2
      ${className}
    `}>
      <div className="mx-auto w-full px-6 md:px-10 max-w-7xl">
        {children}
      </div>
    </section>
  );
};
```

### Custom Utility Classes

Create custom utilities for common patterns:

```css
/* styles/components.css */
@layer components {
  .btn {
    @apply inline-flex items-center justify-center font-medium transition-colors rounded-md;
  }
  
  .btn-primary {
    @apply bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2;
  }
  
  .btn-secondary {
    @apply bg-[#0b2a5a] text-white hover:bg-[#0b2a5a]/90 focus:ring-2 focus:ring-[#0b2a5a] focus:ring-offset-2;
  }
  
  .card {
    @apply bg-white rounded-xl shadow-lg ring-1 ring-neutral-200 overflow-hidden;
  }
  
  .card-hover {
    @apply transition-all duration-300 hover:shadow-xl hover:ring-neutral-300 hover:-translate-y-1;
  }
  
  .gradient-brand {
    @apply bg-gradient-to-r from-red-700 via-white to-[#0b2a5a];
  }
  
  .text-gradient {
    @apply bg-gradient-to-r from-red-600 to-[#0b2a5a] bg-clip-text text-transparent;
  }
}
```

## Component Patterns

### Compound Component Pattern

```tsx
// Example: Card with compound components
const Card = ({ children, className, ...props }) => {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className, ...props }) => {
  return (
    <div className={`px-6 py-4 border-b border-neutral-200 ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardBody = ({ children, className, ...props }) => {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({ children, className, ...props }) => {
  return (
    <div className={`px-6 py-4 border-t border-neutral-200 bg-neutral-50 ${className}`} {...props}>
      {children}
    </div>
  );
};

// Attach components
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

// Usage
<Card>
  <Card.Header>
    <h3>Card Title</h3>
  </Card.Header>
  <Card.Body>
    <p>Card content goes here</p>
  </Card.Body>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>
```

### Render Props Pattern

```tsx
// Example: DataProvider with render props
interface DataProviderProps<T> {
  url: string;
  children: (data: {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
  }) => React.ReactNode;
}

const DataProvider = <T,>({ url, children }: DataProviderProps<T>) => {
  const { data, loading, error, refetch } = useFetch<T>(url);
  
  return <>{children({ data, loading, error, refetch })}</>;
};

// Usage
<DataProvider<JobPosting[]> url="/api/job-postings">
  {({ data, loading, error, refetch }) => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage error={error} onRetry={refetch} />;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    );
  }}
</DataProvider>
```

### HOC Pattern for Common Functionality

```tsx
// withLoading HOC
const withLoading = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithLoadingComponent = (props: P & { loading?: boolean }) => {
    const { loading, ...restProps } = props;
    
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </div>
      );
    }
    
    return <WrappedComponent {...restProps as P} />;
  };
  
  WithLoadingComponent.displayName = `withLoading(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithLoadingComponent;
};

// Usage
const JobListWithLoading = withLoading(JobList);

<JobListWithLoading jobs={jobs} loading={isLoading} />
```

## Testing Strategy

### Component Testing Hierarchy

1. **Unit Tests**: Test individual component logic
2. **Integration Tests**: Test component interaction
3. **Visual Tests**: Test component appearance
4. **E2E Tests**: Test complete user workflows

### Testing Utilities

```tsx
// test-utils.tsx - Custom render function
import { render, RenderOptions } from '@testing-library/react';
import { RouterContext } from 'next/router';
import { ThemeProvider } from '@/contexts/ThemeContext';

const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockRouter = {
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  };

  return (
    <RouterContext.Provider value={mockRouter}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </RouterContext.Provider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### Component Test Examples

```tsx
// Button.test.tsx
import { render, screen, fireEvent } from './test-utils';
import Button from './Button';

describe('Button Component', () => {
  // Specification tests
  it('meets accessibility requirements', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toHaveAttribute('aria-disabled');
  });

  // Pseudocode tests
  it('handles click events correctly', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Architecture tests
  it('applies correct CSS classes based on props', () => {
    render(<Button variant="primary" size="lg">Click me</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('bg-red-600');
    expect(button).toHaveClass('px-6');
    expect(button).toHaveClass('py-3');
  });

  // Refinement tests
  it('shows loading state correctly', () => {
    render(<Button loading>Loading...</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  // Completion tests
  it('integrates with Next.js Link when href is provided', () => {
    render(<Button href="/contact">Contact</Button>);
    const link = screen.getByRole('link');
    
    expect(link).toHaveAttribute('href', '/contact');
    expect(link).toHaveClass('bg-red-600'); // Still has button styles
  });
});
```

## Performance Guidelines

### Code Splitting

```tsx
// Lazy load heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false // Skip SSR if component is not critical
});

// Conditional loading
const AdminPanel = dynamic(() => import('./AdminPanel'), {
  loading: () => <div>Loading admin panel...</div>
});

const ConditionalAdminPanel = ({ isAdmin }: { isAdmin: boolean }) => {
  if (!isAdmin) return null;
  return <AdminPanel />;
};
```

### Memoization

```tsx
// Memoize expensive calculations
const ExpensiveComponent = ({ data, filters }) => {
  const processedData = useMemo(() => {
    return data.filter(filters.filterFn).sort(filters.sortFn);
  }, [data, filters]);

  return <DataVisualization data={processedData} />;
};

// Memoize components with React.memo
const ListItem = React.memo(({ item, onSelect }) => {
  return (
    <div 
      className="p-4 border-b hover:bg-gray-50 cursor-pointer"
      onClick={() => onSelect(item.id)}
    >
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </div>
  );
});

// Prevent unnecessary re-renders
const List = ({ items, onItemSelect }) => {
  const handleItemSelect = useCallback((id) => {
    onItemSelect(id);
  }, [onItemSelect]);

  return (
    <div>
      {items.map(item => (
        <ListItem 
          key={item.id} 
          item={item} 
          onSelect={handleItemSelect} 
        />
      ))}
    </div>
  );
};
```

### Image Optimization

```tsx
// Optimized image component
const OptimizedImage = ({ src, alt, priority = false, ...props }) => {
  return (
    <Image
      src={src}
      alt={alt}
      priority={priority}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      {...props}
    />
  );
};

// Lazy loading with Intersection Observer
const LazyImage = ({ src, alt, ...props }) => {
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} {...props}>
      {isVisible ? (
        <OptimizedImage src={src} alt={alt} />
      ) : (
        <div className="bg-gray-200 animate-pulse" />
      )}
    </div>
  );
};
```

## Accessibility Standards

### WCAG 2.1 AA Compliance

```tsx
// Accessible form component
const AccessibleForm = () => {
  const [errors, setErrors] = useState({});

  return (
    <form className="space-y-6" noValidate>
      <div>
        <label 
          htmlFor="email" 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          aria-describedby={errors.email ? 'email-error' : 'email-help'}
          aria-invalid={!!errors.email}
          className={`
            w-full px-3 py-2 border rounded-md
            ${errors.email ? 'border-red-500' : 'border-gray-300'}
            focus:outline-none focus:ring-2 focus:ring-red-500
          `}
        />
        {!errors.email && (
          <p id="email-help" className="text-sm text-gray-500 mt-1">
            We'll never share your email address
          </p>
        )}
        {errors.email && (
          <p id="email-error" className="text-sm text-red-600 mt-1" role="alert">
            {errors.email}
          </p>
        )}
      </div>
    </form>
  );
};

// Accessible modal component
const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      const firstFocusable = modalRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
```

### Focus Management

```tsx
// Focus trap hook
const useFocusTrap = (isActive) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return containerRef;
};
```

This comprehensive component guide provides the foundation for building high-quality, accessible, and performant components using SPARC methodology and modern Next.js patterns with Tailwind CSS.