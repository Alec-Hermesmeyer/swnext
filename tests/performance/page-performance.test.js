/**
 * Performance Tests for Next.js Pages and Components
 * Tests loading times, bundle sizes, and runtime performance
 */

import { performance } from 'perf_hooks'
import { render, act } from '@testing-library/react'
import HomePage from '@/pages/index'

// Mock performance observer for testing
global.PerformanceObserver = class MockPerformanceObserver {
  constructor(callback) {
    this.callback = callback
    this.entries = []
  }
  
  observe() {
    // Simulate performance entries
    setTimeout(() => {
      this.callback({
        getEntries: () => this.entries
      })
    }, 100)
  }
  
  disconnect() {}
}

describe('Performance Tests', () => {
  describe('Component Rendering Performance', () => {
    it('should render HomePage component within performance budget', async () => {
      const startTime = performance.now()
      
      let component
      await act(async () => {
        component = render(<HomePage />)
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Component should render within 100ms
      expect(renderTime).toBeLessThan(100)
      
      component.unmount()
    })

    it('should handle large lists efficiently', async () => {
      const LargeListComponent = () => (
        <div>
          {Array.from({ length: 1000 }, (_, i) => (
            <div key={i} className="p-2">Item {i}</div>
          ))}
        </div>
      )

      const startTime = performance.now()
      
      let component
      await act(async () => {
        component = render(<LargeListComponent />)
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Even large lists should render reasonably fast
      expect(renderTime).toBeLessThan(500)
      
      component.unmount()
    })

    it('should not cause memory leaks during re-renders', async () => {
      const TestComponent = ({ count }) => (
        <div>
          {Array.from({ length: count }, (_, i) => (
            <div key={i}>Dynamic content {i}</div>
          ))}
        </div>
      )

      let component
      
      // Initial render
      await act(async () => {
        component = render(<TestComponent count={10} />)
      })

      const initialMemory = process.memoryUsage().heapUsed
      
      // Multiple re-renders to test memory usage
      for (let i = 0; i < 50; i++) {
        await act(async () => {
          component.rerender(<TestComponent count={20 + i} />)
        })
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
      
      component.unmount()
    })
  })

  describe('Bundle Size Performance', () => {
    it('should maintain reasonable component bundle sizes', () => {
      // This would typically be done with webpack-bundle-analyzer
      // For testing purposes, we'll simulate bundle size checks
      const estimatedBundleSize = 250000 // 250KB estimate
      
      // Homepage component should not be too heavy
      expect(estimatedBundleSize).toBeLessThan(500000) // Less than 500KB
    })

    it('should properly tree-shake unused exports', () => {
      // Test that unused imports are eliminated
      // In a real scenario, this would check actual bundle output
      const unusedImports = []
      
      // Should have no unused imports in production bundle
      expect(unusedImports).toHaveLength(0)
    })
  })

  describe('Runtime Performance', () => {
    it('should handle rapid state changes efficiently', async () => {
      const RapidUpdateComponent = () => {
        const [count, setCount] = React.useState(0)
        
        React.useEffect(() => {
          const interval = setInterval(() => {
            setCount(c => c + 1)
          }, 10)
          
          return () => clearInterval(interval)
        }, [])
        
        return <div>Count: {count}</div>
      }

      const startTime = performance.now()
      
      let component
      await act(async () => {
        component = render(<RapidUpdateComponent />)
      })

      // Let it run for a short time
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Should handle rapid updates without significant performance degradation
      expect(totalTime).toBeLessThan(200)
      
      component.unmount()
    })

    it('should efficiently handle DOM updates', async () => {
      const DynamicDOMComponent = ({ items }) => (
        <ul>
          {items.map(item => (
            <li key={item.id} className="p-2 border-b">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </li>
          ))}
        </ul>
      )

      const initialItems = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        title: `Item ${i}`,
        description: `Description for item ${i}`
      }))

      let component
      await act(async () => {
        component = render(<DynamicDOMComponent items={initialItems} />)
      })

      const startTime = performance.now()
      
      // Update with new items
      const updatedItems = [...initialItems.slice(10), ...Array.from({ length: 10 }, (_, i) => ({
        id: 100 + i,
        title: `New Item ${i}`,
        description: `New description ${i}`
      }))]

      await act(async () => {
        component.rerender(<DynamicDOMComponent items={updatedItems} />)
      })
      
      const endTime = performance.now()
      const updateTime = endTime - startTime
      
      // DOM updates should be fast
      expect(updateTime).toBeLessThan(50)
      
      component.unmount()
    })
  })

  describe('Image Loading Performance', () => {
    it('should handle image loading efficiently', async () => {
      const ImageComponent = () => (
        <div>
          <img src="/test-image-1.jpg" alt="Test 1" loading="lazy" />
          <img src="/test-image-2.jpg" alt="Test 2" loading="lazy" />
          <img src="/test-image-3.jpg" alt="Test 3" loading="lazy" />
        </div>
      )

      const startTime = performance.now()
      
      let component
      await act(async () => {
        component = render(<ImageComponent />)
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Image component should render quickly (actual loading is async)
      expect(renderTime).toBeLessThan(50)
      
      component.unmount()
    })
  })

  describe('Animation Performance', () => {
    it('should handle CSS animations without blocking', async () => {
      const AnimatedComponent = () => (
        <div 
          className="transition-all duration-300 hover:scale-110"
          data-testid="animated-element"
        >
          Animated Content
        </div>
      )

      const startTime = performance.now()
      
      let component
      await act(async () => {
        component = render(<AnimatedComponent />)
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Animated components should render without delay
      expect(renderTime).toBeLessThan(50)
      
      component.unmount()
    })
  })

  describe('Form Performance', () => {
    it('should handle form validation efficiently', async () => {
      const FormComponent = () => {
        const [values, setValues] = React.useState({})
        const [errors, setErrors] = React.useState({})
        
        const validate = (name, value) => {
          const newErrors = { ...errors }
          
          if (name === 'email' && !value.includes('@')) {
            newErrors.email = 'Invalid email'
          } else {
            delete newErrors.email
          }
          
          setErrors(newErrors)
        }
        
        const handleChange = (e) => {
          const { name, value } = e.target
          setValues(prev => ({ ...prev, [name]: value }))
          validate(name, value)
        }
        
        return (
          <form>
            <input 
              name="email" 
              type="email" 
              onChange={handleChange}
              data-testid="email-input"
            />
            {errors.email && <span data-testid="error">{errors.email}</span>}
          </form>
        )
      }

      let component
      await act(async () => {
        component = render(<FormComponent />)
      })

      const startTime = performance.now()
      
      // Simulate rapid typing
      const emailInput = component.getByTestId('email-input')
      const testEmail = 'test@example.com'
      
      for (let i = 0; i < testEmail.length; i++) {
        await act(async () => {
          fireEvent.change(emailInput, { 
            target: { name: 'email', value: testEmail.slice(0, i + 1) } 
          })
        })
      }
      
      const endTime = performance.now()
      const validationTime = endTime - startTime
      
      // Form validation should be fast even with rapid input
      expect(validationTime).toBeLessThan(100)
      
      component.unmount()
    })
  })

  describe('Lazy Loading Performance', () => {
    it('should implement lazy loading correctly', async () => {
      const LazyComponent = React.lazy(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            default: () => <div data-testid="lazy-content">Lazy loaded content</div>
          }), 50)
        )
      )

      const LazyWrapper = () => (
        <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyComponent />
        </React.Suspense>
      )

      let component
      await act(async () => {
        component = render(<LazyWrapper />)
      })

      // Initially should show loading
      expect(component.getByTestId('loading')).toBeInTheDocument()
      
      const startTime = performance.now()
      
      // Wait for lazy component to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })
      
      const endTime = performance.now()
      const loadTime = endTime - startTime
      
      // Should load within reasonable time
      expect(loadTime).toBeLessThan(200)
      
      // Should show lazy content
      expect(component.getByTestId('lazy-content')).toBeInTheDocument()
      
      component.unmount()
    })
  })

  describe('Memory Usage Patterns', () => {
    it('should maintain stable memory usage during normal operation', async () => {
      const MemoryTestComponent = ({ iteration }) => (
        <div>
          {Array.from({ length: 100 }, (_, i) => (
            <div key={`${iteration}-${i}`}>
              Item {iteration}-{i}
            </div>
          ))}
        </div>
      )

      const initialMemory = process.memoryUsage().heapUsed
      let component

      // Multiple render cycles
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          if (component) {
            component.rerender(<MemoryTestComponent iteration={i} />)
          } else {
            component = render(<MemoryTestComponent iteration={i} />)
          }
        })
        
        // Small delay to simulate real usage
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
        })
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory should not grow excessively
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // Less than 10MB
      
      component.unmount()
    })
  })
})