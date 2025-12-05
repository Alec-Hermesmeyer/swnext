# Tailwind CSS Architecture Patterns

## Design System Patterns

### Color System
```jsx
// Brand Colors (S&W Foundation Contractors)
const colorSystem = {
  // Primary brand colors
  primary: {
    50: '#fef2f2',   // Very light red
    100: '#fee2e2',  // Light red
    500: '#ef4444',  // Medium red  
    600: '#dc2626',  // Brand red (primary)
    700: '#b91c1c',  // Dark red (hover)
    900: '#7f1d1d'   // Very dark red
  },
  
  // Secondary brand colors
  secondary: {
    50: '#f0f9ff',   // Very light blue
    100: '#e0f2fe',  // Light blue
    500: '#0ea5e9',  // Medium blue
    600: '#0284c7',  // Blue
    700: '#0369a1',  // Dark blue
    900: '#0b2a5a'   // Brand navy (secondary)
  },
  
  // Neutral system
  neutral: {
    50: '#fafafa',   // Near white
    100: '#f5f5f5',  // Light gray
    200: '#e5e5e5',  // Light-medium gray
    400: '#a3a3a3',  // Medium gray
    600: '#525252',  // Dark-medium gray
    900: '#171717'   // Near black
  }
};

// Usage in components
const Button = ({ variant = 'primary' }) => {
  const variants = {
    primary: 'bg-red-600 hover:bg-red-700 text-white',
    secondary: 'bg-[#0b2a5a] hover:bg-[#0a2551] text-white',
    outline: 'border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white'
  };
  
  return (
    <button className={`px-6 py-3 font-bold rounded-md transition-colors ${variants[variant]}`}>
      {children}
    </button>
  );
};
```

### Typography Scale
```jsx
// Typography System
const typography = {
  // Display text (heroes, major headings)
  display: {
    sm: 'text-3xl font-extrabold leading-tight',
    md: 'text-4xl md:text-5xl font-extrabold leading-tight',
    lg: 'text-5xl md:text-6xl font-extrabold leading-tight'
  },
  
  // Headings
  heading: {
    h1: 'text-3xl md:text-4xl font-bold leading-tight',
    h2: 'text-2xl md:text-3xl font-bold leading-tight',
    h3: 'text-xl md:text-2xl font-semibold leading-tight',
    h4: 'text-lg md:text-xl font-semibold leading-tight'
  },
  
  // Body text
  body: {
    lg: 'text-lg leading-relaxed',
    base: 'text-base leading-relaxed md:text-[1.02rem]',
    sm: 'text-sm leading-relaxed'
  },
  
  // Captions and small text
  caption: 'text-sm text-neutral-600 leading-normal'
};

// Usage with Lato font
import { Lato } from 'next/font/google';
const lato = Lato({ weight: ['400', '700', '900'], subsets: ['latin'] });

const Heading = ({ level = 'h1', children, className = '' }) => {
  const Tag = level;
  return (
    <Tag className={`${lato.className} ${typography.heading[level]} ${className}`}>
      {children}
    </Tag>
  );
};
```

### Spacing System
```jsx
// Consistent spacing patterns
const spacing = {
  // Section spacing
  section: {
    sm: 'py-8',
    md: 'py-8 md:py-12',
    lg: 'py-12 md:py-16',
    xl: 'py-16 md:py-20'
  },
  
  // Container spacing
  container: {
    sm: 'px-4',
    md: 'px-6 md:px-10',
    lg: 'px-6 md:px-16',
    full: 'px-0'
  },
  
  // Content width constraints
  content: {
    sm: 'max-w-2xl mx-auto',
    md: 'max-w-4xl mx-auto',
    lg: 'max-w-6xl mx-auto',
    xl: 'max-w-[1600px] mx-auto',
    full: 'w-full'
  },
  
  // Component spacing
  stack: {
    xs: 'space-y-2',
    sm: 'space-y-4',
    md: 'space-y-6',
    lg: 'space-y-8'
  }
};
```

### Layout Patterns

#### Full-Width Section Pattern
```jsx
// Standard full-width section for hero and major sections
const FullWidthSection = ({ children, className = '', background = 'white' }) => {
  const backgrounds = {
    white: 'bg-white',
    gray: 'bg-neutral-50',
    navy: 'bg-[#0b2a5a] text-white',
    transparent: 'bg-transparent'
  };

  return (
    <section className={`relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 ${backgrounds[background]} ${className}`}>
      <div className="relative mx-auto w-full max-w-[1600px] px-6 md:px-10">
        {children}
      </div>
    </section>
  );
};

// Usage
<FullWidthSection background="navy" className="min-h-[50vh] flex items-center">
  <HeroContent />
</FullWidthSection>
```

#### Grid Layout Patterns
```jsx
// Responsive grid patterns
const GridPatterns = {
  // Two column layout (text + image)
  twoColumn: 'grid grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-12',
  
  // Three column layout (services, features)
  threeColumn: 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',
  
  // Four column layout (testimonials, team)
  fourColumn: 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4',
  
  // Auto-fit grid (responsive card layouts)
  autoFit: 'grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6',
  
  // Masonry-like layout
  masonry: 'columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4'
};

// Usage
<div className={GridPatterns.twoColumn}>
  <div>Content</div>
  <div>Image</div>
</div>
```

### Component Patterns

#### Card Pattern
```jsx
const Card = ({ 
  variant = 'default',
  padding = 'md',
  shadow = 'md',
  border = true,
  className = '',
  children 
}) => {
  const variants = {
    default: 'bg-white',
    navy: 'bg-[#0b2a5a] text-white',
    gray: 'bg-neutral-50'
  };
  
  const paddings = {
    sm: 'p-4',
    md: 'p-6 md:p-8',
    lg: 'p-8 md:p-12'
  };
  
  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-lg',
    lg: 'shadow-2xl'
  };
  
  return (
    <div className={`
      rounded-xl overflow-hidden
      ${variants[variant]}
      ${paddings[padding]}
      ${shadows[shadow]}
      ${border ? 'ring-1 ring-black/5' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};
```

#### Button Pattern
```jsx
const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-bold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white shadow-md hover:shadow-lg',
    secondary: 'bg-[#0b2a5a] hover:bg-[#0a2551] focus:ring-blue-500 text-white shadow-md hover:shadow-lg',
    outline: 'border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white focus:ring-red-500',
    ghost: 'bg-white/10 text-white hover:bg-white/20 ring-1 ring-white/30'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  };
  
  const disabledClasses = 'opacity-50 cursor-not-allowed hover:bg-current';
  
  return (
    <button
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? disabledClasses : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </>
      ) : children}
    </button>
  );
};
```

### Animation Patterns

#### Fade In Animations
```jsx
// Using Framer Motion with consistent patterns
const fadeInVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

const staggerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

// Usage in components
<motion.div
  variants={staggerVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-100px' }}
>
  {items.map(item => (
    <motion.div key={item.id} variants={fadeInVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Responsive Design Patterns

#### Mobile-First Approach
```jsx
// Mobile-first responsive utilities
const ResponsivePatterns = {
  // Stack on mobile, side-by-side on desktop
  mobileStack: 'flex flex-col md:flex-row',
  
  // Hide on mobile, show on desktop
  desktopOnly: 'hidden md:block',
  
  // Show on mobile, hide on desktop
  mobileOnly: 'block md:hidden',
  
  // Responsive text sizing
  heroText: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl',
  
  // Responsive spacing
  responsivePadding: 'p-4 sm:p-6 md:p-8 lg:p-12',
  
  // Responsive grid
  responsiveGrid: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
};
```

#### Container Patterns
```jsx
// Standard container patterns
const Container = ({ size = 'default', className = '', children }) => {
  const sizes = {
    sm: 'max-w-2xl',
    default: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-[1600px]'
  };
  
  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${sizes[size]} ${className}`}>
      {children}
    </div>
  );
};
```

### Utility Classes

#### Custom Utility Classes
```css
/* Add to globals.css or create utilities.css */
@layer utilities {
  /* Full viewport width (for sections inside containers) */
  .full-width {
    width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
  }
  
  /* Aspect ratio utilities (for older browser support) */
  .aspect-4-3 {
    aspect-ratio: 4/3;
  }
  
  .aspect-16-9 {
    aspect-ratio: 16/9;
  }
  
  /* Glass effect */
  .glass {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  /* Custom scrollbar */
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #dc2626;
    border-radius: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #b91c1c;
  }
}
```

### Performance Patterns

#### Optimized Class Usage
```jsx
// Use CSS-in-JS alternatives for dynamic styles
const DynamicStyles = ({ isActive, variant }) => {
  // Instead of template literals with many conditions
  const classes = clsx(
    'base-classes',
    {
      'active-classes': isActive,
      'inactive-classes': !isActive
    },
    variant === 'primary' && 'primary-classes',
    variant === 'secondary' && 'secondary-classes'
  );
  
  return <div className={classes} />;
};

// Memoize expensive class calculations
const ExpensiveComponent = memo(({ items, theme }) => {
  const containerClasses = useMemo(() => {
    return clsx(
      'base-container',
      theme === 'dark' && 'dark-theme',
      items.length > 10 && 'large-list'
    );
  }, [items.length, theme]);
  
  return <div className={containerClasses}>{/* content */}</div>;
});
```

This documentation provides comprehensive Tailwind CSS patterns specifically tailored for the S&W Foundation Contractors project, ensuring consistency and maintainability across the entire application.