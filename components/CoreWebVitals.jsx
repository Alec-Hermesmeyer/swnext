// Core Web Vitals optimization component
import { useEffect } from 'react';

export function WebVitals({ analyticsId }) {
  useEffect(() => {
    // Load Web Vitals library dynamically
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      function sendToAnalytics(metric) {
        // Send to Google Analytics 4 if available
        if (typeof gtag !== 'undefined') {
          gtag('event', metric.name, {
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            event_category: 'Web Vitals',
            event_label: metric.id,
            non_interaction: true,
          });
        }

        // Send to console for development
        if (process.env.NODE_ENV === 'development') {
          console.log('Web Vital:', metric);
        }
      }

      // Measure all Core Web Vitals
      getCLS(sendToAnalytics);
      getFID(sendToAnalytics);
      getFCP(sendToAnalytics);
      getLCP(sendToAnalytics);
      getTTFB(sendToAnalytics);
    });
  }, [analyticsId]);

  return null; // This component doesn't render anything
}

// Performance optimization utilities
export const performanceOptimizations = {
  // Preload critical resources
  preloadCriticalResources: () => {
    if (typeof window !== 'undefined') {
      // Preload critical fonts
      const fontLink = document.createElement('link');
      fontLink.rel = 'preload';
      fontLink.href = 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wXg.woff2';
      fontLink.as = 'font';
      fontLink.type = 'font/woff2';
      fontLink.crossOrigin = 'anonymous';
      document.head.appendChild(fontLink);

      // Preload hero image
      const heroImageLink = document.createElement('link');
      heroImageLink.rel = 'preload';
      heroImageLink.href = '/homeHero.webp';
      heroImageLink.as = 'image';
      document.head.appendChild(heroImageLink);
    }
  },

  // Optimize images with proper sizing
  getOptimizedImageProps: (src, alt, priority = false, sizes = '100vw') => ({
    src,
    alt,
    priority,
    sizes,
    quality: priority ? 85 : 75,
    placeholder: 'blur',
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==',
    style: { maxWidth: '100%', height: 'auto' }
  }),

  // Reduce layout shift with aspect ratio containers
  createAspectRatioContainer: (aspectRatio = '16/9') => ({
    position: 'relative',
    width: '100%',
    aspectRatio,
    overflow: 'hidden'
  }),

  // Optimize third-party scripts
  loadScriptOptimized: (src, options = {}) => {
    if (typeof window === 'undefined') return;

    const { defer = true, async = false, onLoad } = options;
    const script = document.createElement('script');
    script.src = src;
    script.defer = defer;
    script.async = async;
    
    if (onLoad) {
      script.onload = onLoad;
    }
    
    document.head.appendChild(script);
  }
};

// Critical CSS inlining utility
export const criticalCSS = `
  /* Critical above-the-fold styles */
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    margin: 0;
    padding: 0;
    line-height: 1.6;
  }
  
  /* Navigation styles */
  nav {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
  }
  
  /* Hero section styles */
  .hero-section {
    min-height: 70vh;
    display: flex;
    align-items: center;
    position: relative;
  }
  
  /* Loading state styles */
  .loading {
    opacity: 0;
    animation: fadeIn 0.3s ease-in-out forwards;
  }
  
  @keyframes fadeIn {
    to { opacity: 1; }
  }
  
  /* Core Web Vitals optimization */
  img {
    max-width: 100%;
    height: auto;
  }
  
  /* Prevent layout shift */
  .aspect-ratio {
    aspect-ratio: var(--aspect-ratio, 16/9);
  }
`;

export default WebVitals;