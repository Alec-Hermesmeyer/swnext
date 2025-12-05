import { useEffect, useState } from 'react';

/**
 * Performance Monitor Component
 * Tracks Core Web Vitals and runtime performance metrics
 */
export default function PerformanceMonitor({ enabled = true, debug = false }) {
  const [metrics, setMetrics] = useState({
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    fcp: null
  });

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Track Core Web Vitals
    const trackWebVitals = () => {
      // Import web-vitals dynamically to avoid SSR issues
      import('web-vitals').then(({ getLCP, getFID, getCLS, getTTFB, getFCP }) => {
        getLCP((metric) => {
          setMetrics(prev => ({ ...prev, lcp: metric.value }));
          if (debug) console.log('LCP:', metric);
        });

        getFID((metric) => {
          setMetrics(prev => ({ ...prev, fid: metric.value }));
          if (debug) console.log('FID:', metric);
        });

        getCLS((metric) => {
          setMetrics(prev => ({ ...prev, cls: metric.value }));
          if (debug) console.log('CLS:', metric);
        });

        getTTFB((metric) => {
          setMetrics(prev => ({ ...prev, ttfb: metric.value }));
          if (debug) console.log('TTFB:', metric);
        });

        getFCP((metric) => {
          setMetrics(prev => ({ ...prev, fcp: metric.value }));
          if (debug) console.log('FCP:', metric);
        });
      }).catch(err => {
        if (debug) console.warn('Web Vitals not available:', err);
      });
    };

    // Track bundle size and performance
    const trackBundlePerformance = () => {
      if (window.performance && window.performance.getEntriesByType) {
        const navigationEntries = window.performance.getEntriesByType('navigation');
        const resourceEntries = window.performance.getEntriesByType('resource');
        
        if (debug) {
          console.log('Navigation Timing:', navigationEntries[0]);
          console.log('Resource Count:', resourceEntries.length);
          
          // Log JS bundle sizes
          const jsResources = resourceEntries.filter(entry => 
            entry.name.includes('.js') && 
            (entry.name.includes('_next') || entry.name.includes('static'))
          );
          
          const totalBundleSize = jsResources.reduce((sum, resource) => {
            return sum + (resource.transferSize || resource.encodedBodySize || 0);
          }, 0);
          
          console.log('Total Bundle Size:', Math.round(totalBundleSize / 1024), 'KB');
        }
      }
    };

    // Initialize tracking
    trackWebVitals();
    trackBundlePerformance();

    // Store metrics for SPARC workflow analysis
    const storeMetrics = async () => {
      try {
        // Send metrics to Claude Flow for analysis
        if (window.claudeFlow && window.claudeFlow.hooks) {
          await window.claudeFlow.hooks.postEdit({
            file: 'performance-metrics',
            memoryKey: 'performance/web-vitals',
            data: {
              timestamp: Date.now(),
              metrics,
              url: window.location.pathname,
              userAgent: navigator.userAgent
            }
          });
        }
      } catch (error) {
        if (debug) console.warn('Failed to store performance metrics:', error);
      }
    };

    // Store metrics after 5 seconds to capture initial load
    const storeTimer = setTimeout(storeMetrics, 5000);

    return () => clearTimeout(storeTimer);
  }, [enabled, debug, metrics]);

  // Don't render anything in production unless debug is enabled
  if (!debug || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs z-50">
      <div className="font-bold mb-2">Performance Metrics</div>
      <div>LCP: {metrics.lcp ? `${Math.round(metrics.lcp)}ms` : 'Loading...'}</div>
      <div>FID: {metrics.fid ? `${Math.round(metrics.fid)}ms` : 'Loading...'}</div>
      <div>CLS: {metrics.cls ? Math.round(metrics.cls * 1000) / 1000 : 'Loading...'}</div>
      <div>TTFB: {metrics.ttfb ? `${Math.round(metrics.ttfb)}ms` : 'Loading...'}</div>
      <div>FCP: {metrics.fcp ? `${Math.round(metrics.fcp)}ms` : 'Loading...'}</div>
    </div>
  );
}

// Hook for using performance metrics in components
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
        } else if (entry.entryType === 'first-input') {
          setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
    } catch (error) {
      console.warn('Performance Observer not supported');
    }

    return () => observer.disconnect();
  }, []);

  return metrics;
}