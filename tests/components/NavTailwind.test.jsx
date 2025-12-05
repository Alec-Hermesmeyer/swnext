import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NavTailwind from '@/components/NavTailwind'

// Mock the Lato font
jest.mock('next/font/google', () => ({
  Lato: () => ({
    className: 'mock-lato-font',
  }),
}))

describe('NavTailwind Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the navigation component', () => {
      render(<NavTailwind />)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should display the logo', () => {
      render(<NavTailwind />)
      const logo = screen.getByAltText('S&W Foundation Contractors')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('src', '/swlogorwb.png')
    })

    it('should render desktop navigation links', () => {
      render(<NavTailwind />)
      
      // Check main navigation links
      expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /services/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /careers/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /gallery/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /blog/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    })

    it('should render social media links', () => {
      render(<NavTailwind />)
      
      const facebookLink = screen.getByRole('link', { name: /facebook/i })
      const linkedinLink = screen.getByRole('link', { name: /linkedin/i })
      
      expect(facebookLink).toHaveAttribute('href', 'https://www.facebook.com/SWFoundationContractors')
      expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/company/s-w-foundation-contractors-inc')
      
      // Check for proper attributes
      expect(facebookLink).toHaveAttribute('target', '_blank')
      expect(facebookLink).toHaveAttribute('rel', 'noopener noreferrer')
      expect(linkedinLink).toHaveAttribute('target', '_blank')
      expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('Mobile Menu Functionality', () => {
    it('should toggle mobile menu when button is clicked', () => {
      render(<NavTailwind />)
      
      const mobileMenuButton = screen.getByRole('button')
      expect(mobileMenuButton).toBeInTheDocument()
      
      // Initially mobile menu should not be visible
      expect(screen.queryByText('Home')).not.toBeInTheDocument()
      
      // Click to open mobile menu
      fireEvent.click(mobileMenuButton)
      
      // Check that mobile menu items are now visible
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('About')).toBeInTheDocument()
      expect(screen.getByText('Services')).toBeInTheDocument()
    })

    it('should close mobile menu when a link is clicked', () => {
      render(<NavTailwind />)
      
      const mobileMenuButton = screen.getByRole('button')
      
      // Open mobile menu
      fireEvent.click(mobileMenuButton)
      expect(screen.getByText('Home')).toBeInTheDocument()
      
      // Click on a menu item
      const homeLink = screen.getByText('Home')
      fireEvent.click(homeLink)
      
      // Mobile menu should be closed
      expect(screen.queryByText('Home')).not.toBeInTheDocument()
    })

    it('should show correct icon based on menu state', () => {
      render(<NavTailwind />)
      
      const mobileMenuButton = screen.getByRole('button')
      
      // Initially should show bars icon
      expect(screen.getByTestId('bars-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('times-icon')).not.toBeInTheDocument()
      
      // After clicking, should show times icon
      fireEvent.click(mobileMenuButton)
      expect(screen.getByTestId('times-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('bars-icon')).not.toBeInTheDocument()
    })
  })

  describe('Desktop Dropdown Functionality', () => {
    it('should show About dropdown on mouse enter', async () => {
      render(<NavTailwind />)
      
      const aboutLink = screen.getByRole('link', { name: /about/i })
      const aboutContainer = aboutLink.closest('.relative')
      
      // Initially dropdown should not be visible
      expect(screen.queryByText('Safety')).not.toBeInTheDocument()
      expect(screen.queryByText('Core Values')).not.toBeInTheDocument()
      
      // Mouse enter on About
      fireEvent.mouseEnter(aboutContainer)
      
      await waitFor(() => {
        expect(screen.getByText('Safety')).toBeInTheDocument()
        expect(screen.getByText('Core Values')).toBeInTheDocument()
        expect(screen.getByText('Blog')).toBeInTheDocument()
      })
    })

    it('should hide About dropdown on mouse leave', async () => {
      render(<NavTailwind />)
      
      const aboutLink = screen.getByRole('link', { name: /about/i })
      const aboutContainer = aboutLink.closest('.relative')
      
      // Show dropdown
      fireEvent.mouseEnter(aboutContainer)
      await waitFor(() => {
        expect(screen.getByText('Safety')).toBeInTheDocument()
      })
      
      // Hide dropdown
      fireEvent.mouseLeave(aboutContainer)
      await waitFor(() => {
        expect(screen.queryByText('Safety')).not.toBeInTheDocument()
      })
    })

    it('should show Services dropdown on mouse enter', async () => {
      render(<NavTailwind />)
      
      const servicesLink = screen.getByRole('link', { name: /services/i })
      const servicesContainer = servicesLink.closest('.relative')
      
      // Initially dropdown should not be visible
      expect(screen.queryByText('Pier Drilling')).not.toBeInTheDocument()
      expect(screen.queryByText('Limited Access Pier Drilling')).not.toBeInTheDocument()
      
      // Mouse enter on Services
      fireEvent.mouseEnter(servicesContainer)
      
      await waitFor(() => {
        expect(screen.getByText('Pier Drilling')).toBeInTheDocument()
        expect(screen.getByText('Limited Access Pier Drilling')).toBeInTheDocument()
        expect(screen.getByText('Turn Key Drilling Solutions')).toBeInTheDocument()
        expect(screen.getByText('Crane Services')).toBeInTheDocument()
        expect(screen.getByText('Helical Piles')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<NavTailwind />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
      
      const mobileMenuButton = screen.getByRole('button')
      expect(mobileMenuButton).toBeInTheDocument()
    })

    it('should have proper link structure', () => {
      render(<NavTailwind />)
      
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
      
      // Check that all links have href attributes
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('should hide desktop navigation on mobile', () => {
      render(<NavTailwind />)
      
      // Desktop navigation should have md:flex class (hidden on mobile)
      const desktopNav = screen.getByRole('navigation').querySelector('.hidden.md\\:flex')
      expect(desktopNav).toBeInTheDocument()
    })

    it('should show mobile menu button on mobile only', () => {
      render(<NavTailwind />)
      
      const mobileMenuButton = screen.getByRole('button')
      expect(mobileMenuButton).toHaveClass('md:hidden')
    })
  })

  describe('Visual Styling', () => {
    it('should apply correct CSS classes for styling', () => {
      render(<NavTailwind />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-white/95', 'backdrop-blur', 'shadow-sm', 'sticky', 'top-0', 'z-50')
    })

    it('should apply hover effects on links', () => {
      render(<NavTailwind />)
      
      const aboutLink = screen.getByRole('link', { name: /about/i })
      expect(aboutLink).toHaveClass('hover:text-red-600')
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid menu toggling', () => {
      render(<NavTailwind />)
      
      const mobileMenuButton = screen.getByRole('button')
      
      // Rapidly toggle menu multiple times
      for (let i = 0; i < 5; i++) {
        fireEvent.click(mobileMenuButton)
      }
      
      // Should still work correctly
      expect(screen.getByText('Home')).toBeInTheDocument()
    })

    it('should handle mouse events on dropdowns correctly', async () => {
      render(<NavTailwind />)
      
      const aboutContainer = screen.getByRole('link', { name: /about/i }).closest('.relative')
      const servicesContainer = screen.getByRole('link', { name: /services/i }).closest('.relative')
      
      // Rapidly hover between dropdowns
      fireEvent.mouseEnter(aboutContainer)
      fireEvent.mouseLeave(aboutContainer)
      fireEvent.mouseEnter(servicesContainer)
      fireEvent.mouseLeave(servicesContainer)
      
      // Should handle gracefully without errors
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })
  })
})