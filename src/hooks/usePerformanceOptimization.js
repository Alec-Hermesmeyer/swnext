import { useEffect, useCallback, useRef } from 'react';

/**
 * Performance Optimization Hooks for SPARC Workflow
 * Provides utilities for runtime performance optimization
 */

// Hook for debounced operations
export function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

// Hook for lazy loading images
export function useLazyImage(src, options = {}) {
  const { threshold = 0.1, rootMargin = '0px' } = options;
  const imgRef = useRef(null);
  
  useEffect(() => {
    if (!imgRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = src;
            img.classList.remove('opacity-0');
            img.classList.add('opacity-100', 'transition-opacity', 'duration-300');
            observer.unobserve(img);
          }
        });
      },
      { threshold, rootMargin }
    );
    
    observer.observe(imgRef.current);
    
    return () => observer.disconnect();
  }, [src, threshold, rootMargin]);
  
  return imgRef;
}

// Hook for performance monitoring
export function usePerformanceMonitor() {
  const metricsRef = useRef({
    renderCount: 0,
    renderTimes: [],
    memoryUsage: []
  });
  
  useEffect(() => {
    const startTime = performance.now();
    metricsRef.current.renderCount++;
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      metricsRef.current.renderTimes.push(renderTime);
      
      // Keep only last 10 render times
      if (metricsRef.current.renderTimes.length > 10) {
        metricsRef.current.renderTimes.shift();
      }
      
      // Track memory usage if available
      if (performance.memory) {
        metricsRef.current.memoryUsage.push({
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          timestamp: Date.now()
        });
        
        // Keep only last 10 memory snapshots
        if (metricsRef.current.memoryUsage.length > 10) {
          metricsRef.current.memoryUsage.shift();
        }
      }
    };
  });
  
  return {
    getMetrics: () => metricsRef.current,
    getAverageRenderTime: () => {
      const times = metricsRef.current.renderTimes;
      return times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    },
    getMemoryTrend: () => {
      const usage = metricsRef.current.memoryUsage;
      if (usage.length < 2) return 'stable';
      
      const recent = usage.slice(-3);
      const isIncreasing = recent.every((current, i, arr) => 
        i === 0 || current.used > arr[i - 1].used
      );
      
      return isIncreasing ? 'increasing' : 'stable';
    }
  };
}

// Hook for bundle size optimization tracking
export function useBundleOptimization() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Track bundle loading performance
    const trackBundlePerformance = () => {
      const resourceEntries = performance.getEntriesByType('resource');
      const jsResources = resourceEntries.filter(entry => 
        entry.name.includes('.js') && 
        entry.name.includes('_next')
      );
      
      const bundleMetrics = {
        totalScripts: jsResources.length,
        totalSize: jsResources.reduce((sum, resource) => 
          sum + (resource.transferSize || resource.encodedBodySize || 0), 0),
        loadTime: jsResources.reduce((max, resource) => 
          Math.max(max, resource.duration || 0), 0),
        timestamp: Date.now()
      };
      
      // Store metrics for SPARC analysis
      if (window.claudeFlow?.hooks) {
        window.claudeFlow.hooks.postEdit({
          file: 'bundle-performance',
          memoryKey: 'performance/bundle-metrics',
          data: bundleMetrics
        }).catch(console.warn);
      }
      
      return bundleMetrics;
    };
    
    // Run after initial load
    setTimeout(trackBundlePerformance, 2000);
  }, []);
}

// Hook for API performance tracking
export function useAPIPerformance() {
  const trackingRef = useRef(new Map());
  
  const trackRequest = useCallback((url, method = 'GET') => {
    const startTime = performance.now();
    const requestId = `${method}-${url}-${Date.now()}`;
    
    trackingRef.current.set(requestId, {
      url,
      method,
      startTime,
      status: 'pending'
    });
    
    return {
      complete: (status, error) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        const requestData = trackingRef.current.get(requestId);
        if (requestData) {
          requestData.status = error ? 'error' : 'success';
          requestData.duration = duration;
          requestData.httpStatus = status;
          requestData.error = error?.message;
          
          // Store API performance metrics
          if (window.claudeFlow?.hooks) {
            window.claudeFlow.hooks.postEdit({
              file: 'api-performance',
              memoryKey: 'performance/api-metrics',
              data: {
                requests: Array.from(trackingRef.current.values()),
                timestamp: Date.now()
              }
            }).catch(console.warn);
          }
        }
        
        trackingRef.current.delete(requestId);
      }
    };
  }, []);
  
  const getMetrics = useCallback(() => {
    const requests = Array.from(trackingRef.current.values());
    const completed = requests.filter(req => req.status !== 'pending');
    
    return {
      totalRequests: requests.length,
      completedRequests: completed.length,
      averageResponseTime: completed.length ? 
        completed.reduce((sum, req) => sum + req.duration, 0) / completed.length : 0,
      errorRate: completed.length ? 
        completed.filter(req => req.status === 'error').length / completed.length : 0
    };
  }, []);
  
  return { trackRequest, getMetrics };
}

// Hook for SPARC workflow performance integration
export function useSPARCIntegration() {
  useEffect(() => {
    // Initialize SPARC performance tracking
    const initSPARC = async () => {
      try {
        if (window.claudeFlow?.hooks) {
          await window.claudeFlow.hooks.preTask({
            description: 'Client-side performance monitoring initialization'
          });
        }
      } catch (error) {
        console.warn('SPARC integration failed:', error);
      }
    };
    
    initSPARC();
    
    // Cleanup on unmount
    return () => {
      if (window.claudeFlow?.hooks) {
        window.claudeFlow.hooks.postTask({
          taskId: 'client-performance-monitor'
        }).catch(console.warn);
      }
    };
  }, []);
}

export default {
  useDebounce,
  useLazyImage,
  usePerformanceMonitor,
  useBundleOptimization,
  useAPIPerformance,
  useSPARCIntegration
};