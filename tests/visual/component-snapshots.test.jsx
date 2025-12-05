/**
 * Visual Regression Tests
 * Tests component visual output and prevents unintended styling changes
 */

import { render } from '@testing-library/react'
import NavTailwind from '@/components/NavTailwind'
import HomePage from '@/pages/index'

// Mock Next.js components for consistent snapshots
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />
  },
}))

describe('Visual Regression Tests', () => {
  describe('Navigation Component Snapshots', () => {
    it('should match NavTailwind component snapshot', () => {
      const { container } = render(<NavTailwind />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match NavTailwind mobile menu open state', () => {
      const { container, getByRole } = render(<NavTailwind />)
      
      // Open mobile menu
      const mobileButton = getByRole('button')
      fireEvent.click(mobileButton)
      
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match NavTailwind desktop dropdown states', () => {
      const { container } = render(<NavTailwind />)
      
      // Simulate hover states for dropdowns
      const aboutDropdown = container.querySelector('.relative')
      fireEvent.mouseEnter(aboutDropdown)
      
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('HomePage Component Snapshots', () => {
    it('should match HomePage component snapshot', () => {
      const { container } = render(<HomePage />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match HomePage hero section', () => {
      const { container } = render(<HomePage />)
      const heroSection = container.querySelector('section')
      expect(heroSection).toMatchSnapshot()
    })

    it('should match HomePage info blocks section', () => {
      const { container } = render(<HomePage />)
      const infoSections = container.querySelectorAll('section')
      if (infoSections.length > 1) {
        expect(infoSections[1]).toMatchSnapshot()
      }
    })
  })

  describe('Responsive Design Snapshots', () => {
    beforeEach(() => {
      // Mock window.matchMedia for responsive tests
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('768px'), // Simulate desktop
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })
    })

    it('should match desktop layout snapshot', () => {
      const { container } = render(<NavTailwind />)
      expect(container.firstChild).toMatchSnapshot('desktop-nav')
    })

    it('should match mobile layout snapshot', () => {
      // Simulate mobile viewport
      window.matchMedia.mockImplementation(query => ({
        matches: !query.includes('768px'), // Simulate mobile
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      const { container } = render(<NavTailwind />)
      expect(container.firstChild).toMatchSnapshot('mobile-nav')
    })
  })

  describe('Theme and Styling Snapshots', () => {
    it('should match component with Tailwind classes', () => {
      const StyledComponent = () => (
        <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Styled Component</h2>
          <p className="text-gray-600 leading-relaxed">
            This component uses Tailwind CSS classes for styling.
          </p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Action Button
          </button>
        </div>
      )

      const { container } = render(<StyledComponent />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match color scheme variations', () => {
      const ColorVariations = () => (
        <div className="space-y-4">
          <div className="bg-red-600 text-white p-4 rounded">Red Theme</div>
          <div className="bg-blue-900 text-white p-4 rounded">Navy Theme</div>
          <div className="bg-gray-100 text-gray-900 p-4 rounded">Light Theme</div>
        </div>
      )

      const { container } = render(<ColorVariations />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Interactive State Snapshots', () => {
    it('should match button hover states', () => {
      const InteractiveButton = () => (
        <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 focus:ring-4 focus:ring-red-200 transition-all duration-200">
          Interactive Button
        </button>
      )

      const { container } = render(<InteractiveButton />)
      const button = container.querySelector('button')
      
      // Test normal state
      expect(button).toMatchSnapshot('button-normal')
      
      // Test hover state (simulated through class application)
      button.classList.add('hover:bg-red-700')
      expect(button).toMatchSnapshot('button-hover')
    })

    it('should match form input states', () => {
      const FormInputs = () => (
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Normal input"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <input 
            type="email" 
            placeholder="Email input"
            className="w-full px-4 py-2 border border-red-300 rounded-lg bg-red-50"
          />
          <textarea 
            placeholder="Textarea"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
      )

      const { container } = render(<FormInputs />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Layout Snapshots', () => {
    it('should match grid layouts', () => {
      const GridLayout = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Card {i + 1}</h3>
              <p className="text-gray-600">Content for card {i + 1}</p>
            </div>
          ))}
        </div>
      )

      const { container } = render(<GridLayout />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should match flexbox layouts', () => {
      const FlexLayout = () => (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Flex Item 1</h2>
            <p className="text-gray-600">This item will grow to fill space</p>
          </div>
          <div className="flex-shrink-0">
            <button className="px-4 py-2 bg-blue-600 text-white rounded">Action</button>
          </div>
        </div>
      )

      const { container } = render(<FlexLayout />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Typography Snapshots', () => {
    it('should match typography styles', () => {
      const TypographyShowcase = () => (
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Heading 1</h1>
          <h2 className="text-3xl font-semibold text-gray-800">Heading 2</h2>
          <h3 className="text-2xl font-medium text-gray-700">Heading 3</h3>
          <p className="text-base text-gray-600 leading-relaxed">
            This is a paragraph with regular text. It should have proper line height
            and spacing for optimal readability.
          </p>
          <p className="text-sm text-gray-500">Small text for captions and notes.</p>
          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
            Code snippet
          </code>
        </div>
      )

      const { container } = render(<TypographyShowcase />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Animation Snapshots', () => {
    it('should match transition classes', () => {
      const AnimatedComponent = () => (
        <div className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg">
            <h3 className="text-xl font-bold">Animated Card</h3>
            <p>This card has hover animations</p>
          </div>
        </div>
      )

      const { container } = render(<AnimatedComponent />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Error State Snapshots', () => {
    it('should match error message styling', () => {
      const ErrorStates = () => (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Message</h3>
                <p className="text-sm text-red-600 mt-1">Something went wrong. Please try again.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                <p className="text-sm text-yellow-600 mt-1">This action cannot be undone.</p>
              </div>
            </div>
          </div>
        </div>
      )

      const { container } = render(<ErrorStates />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

// Snapshot serializer for better snapshot formatting
expect.addSnapshotSerializer({
  test: (value) => value && value.classList,
  print: (value, serialize) => {
    const { classList, ...rest } = value
    return serialize({
      ...rest,
      className: Array.from(classList).join(' '),
    })
  },
})