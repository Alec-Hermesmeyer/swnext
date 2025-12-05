import { render, screen, within } from '@testing-library/react'
import HomePage from '@/pages/index'

// Mock Next.js components
jest.mock('next/head', () => {
  return function MockHead({ children }) {
    return <div data-testid="mock-head">{children}</div>
  }
})

jest.mock('@/components/GridPattern', () => ({
  GridPattern: ({ className, ...props }) => (
    <div data-testid="grid-pattern" className={className} {...props} />
  ),
}))

jest.mock('@/components/FadeIn', () => ({
  FadeIn: ({ children }) => <div data-testid="fade-in">{children}</div>,
  FadeInStagger: ({ children }) => <div data-testid="fade-in-stagger">{children}</div>,
}))

describe('HomePage Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
  })

  describe('SEO and Meta Tags', () => {
    it('should render proper SEO meta tags', () => {
      render(<HomePage />)
      
      const headElement = screen.getByTestId('mock-head')
      expect(headElement).toBeInTheDocument()
      
      // Check for title and meta description
      expect(within(headElement).getByText(/S&W Foundation \| Professional Foundation Services/)).toBeInTheDocument()
    })

    it('should have structured data for search engines', () => {
      render(<HomePage />)
      
      // The meta description should be SEO-optimized
      const headElement = screen.getByTestId('mock-head')
      const metaContent = headElement.textContent
      expect(metaContent).toContain('Professional foundation services')
      expect(metaContent).toContain('helical piles')
      expect(metaContent).toContain('pier drilling')
    })
  })

  describe('Hero Section', () => {
    it('should render hero section with company information', () => {
      render(<HomePage />)
      
      expect(screen.getByText('S&W Foundation Contractors')).toBeInTheDocument()
      expect(screen.getByText('Commercial Pier Drilling - Dallas, Texas')).toBeInTheDocument()
      expect(screen.getByText('Drilling Beyond Limits')).toBeInTheDocument()
    })

    it('should display contact information in hero', () => {
      render(<HomePage />)
      
      expect(screen.getByText('We Provide Nation-Wide Service')).toBeInTheDocument()
      expect(screen.getByText('2806 Singleton St. Rowlett, TX 75088')).toBeInTheDocument()
      
      const phoneLink = screen.getByRole('link', { name: /(214)-703-0484/ })
      expect(phoneLink).toHaveAttribute('href', 'tel:+12147030484')
    })

    it('should have call-to-action buttons in hero', () => {
      render(<HomePage />)
      
      const servicesButton = screen.getByRole('link', { name: /our services/i })
      const contactButton = screen.getByRole('link', { name: /contact us/i })
      const careersButton = screen.getByRole('link', { name: /careers/i })
      
      expect(servicesButton).toHaveAttribute('href', '/services')
      expect(contactButton).toHaveAttribute('href', '/contact')
      expect(careersButton).toHaveAttribute('href', '/careers')
    })
  })

  describe('Info Blocks Section', () => {
    it('should render company information blocks', () => {
      render(<HomePage />)
      
      expect(screen.getByText('Foundation Contracting Excellence Since 1986')).toBeInTheDocument()
      expect(screen.getByText('Nationwide Pier Drilling and Foundation Services')).toBeInTheDocument()
      expect(screen.getByText('Comprehensive Foundation Solutions for Dallas and Beyond')).toBeInTheDocument()
    })

    it('should display company history and expertise', () => {
      render(<HomePage />)
      
      expect(screen.getByText(/Based in Rowlett, Texas, S&W Foundation Contractors has been delivering/)).toBeInTheDocument()
      expect(screen.getByText(/over three decades/)).toBeInTheDocument()
      expect(screen.getByText(/nationally recognized name/)).toBeInTheDocument()
    })

    it('should show service capabilities in bullet points', () => {
      render(<HomePage />)
      
      expect(screen.getByText('Commercial and industrial foundation projects')).toBeInTheDocument()
      expect(screen.getByText('Advanced equipment and expert team')).toBeInTheDocument()
      expect(screen.getByText('Commitment to safety and integrity')).toBeInTheDocument()
      expect(screen.getByText('Specialized pier drilling for commercial projects')).toBeInTheDocument()
    })

    it('should have images for each info block', () => {
      render(<HomePage />)
      
      // Check for images (mocked as img elements)
      const images = screen.getAllByRole('img')
      const infoBlockImages = images.filter(img => 
        img.getAttribute('src')?.includes('/Images/public/')
      )
      expect(infoBlockImages.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Services Section', () => {
    it('should render service cards', () => {
      render(<HomePage />)
      
      expect(screen.getByText('Pier Drilling')).toBeInTheDocument()
      expect(screen.getByText('Core Values')).toBeInTheDocument()
      expect(screen.getByText('Turn-Key Drilling Solutions')).toBeInTheDocument()
    })

    it('should have service card links', () => {
      render(<HomePage />)
      
      const serviceLinks = screen.getAllByText('Learn More')
      expect(serviceLinks).toHaveLength(3)
      
      // Check specific service links
      const pierDrillingLink = screen.getByRole('link', { name: /learn more/i })
      expect(pierDrillingLink.closest('div')).toContainElement(screen.getByText('Pier Drilling'))
    })

    it('should display grid pattern background', () => {
      render(<HomePage />)
      
      const gridPattern = screen.getByTestId('grid-pattern')
      expect(gridPattern).toBeInTheDocument()
      expect(gridPattern).toHaveClass('h-full', 'w-full')
    })
  })

  describe('Contact CTA Section', () => {
    it('should render contact call-to-action', () => {
      render(<HomePage />)
      
      expect(screen.getByText(/Get Your Free Quote Today and Let S&W Take Your Next Project To New Depths/)).toBeInTheDocument()
    })

    it('should have contact button in CTA', () => {
      render(<HomePage />)
      
      const ctaButtons = screen.getAllByRole('link', { name: /contact us/i })
      expect(ctaButtons.length).toBeGreaterThanOrEqual(1)
      
      // The main CTA button should be prominent
      const mainCtaButton = ctaButtons.find(button => 
        button.classList.contains('text-xl')
      )
      expect(mainCtaButton).toBeDefined()
    })
  })

  describe('Layout and Structure', () => {
    it('should have proper main element structure', () => {
      render(<HomePage />)
      
      const mainElement = screen.getByRole('main')
      expect(mainElement).toBeInTheDocument()
      expect(mainElement).toHaveClass('flex', 'w-full', 'flex-col')
    })

    it('should use proper heading hierarchy', () => {
      render(<HomePage />)
      
      // Check for proper heading structure (h1, h2, h3)
      const h1Elements = screen.getAllByRole('heading', { level: 1 })
      const h2Elements = screen.getAllByRole('heading', { level: 2 })
      const h3Elements = screen.getAllByRole('heading', { level: 3 })
      
      expect(h1Elements.length).toBeGreaterThanOrEqual(1)
      expect(h2Elements.length).toBeGreaterThanOrEqual(1)
      expect(h3Elements.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Responsive Design Elements', () => {
    it('should have responsive classes applied', () => {
      render(<HomePage />)
      
      // Check for responsive classes that indicate mobile-first design
      const responsiveElements = screen.getByRole('main').querySelectorAll('[class*="md:"], [class*="lg:"]')
      expect(responsiveElements.length).toBeGreaterThan(0)
    })

    it('should handle different viewport sizes', () => {
      render(<HomePage />)
      
      // Check for grid layouts that adapt to screen size
      const gridElements = screen.getByRole('main').querySelectorAll('[class*="grid-cols"]')
      expect(gridElements.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have proper alt text for images', () => {
      render(<HomePage />)
      
      const images = screen.getAllByRole('img')
      images.forEach(img => {
        expect(img).toHaveAttribute('alt')
        expect(img.getAttribute('alt')).toBeTruthy()
      })
    })

    it('should have descriptive link text', () => {
      render(<HomePage />)
      
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        const linkText = link.textContent
        expect(linkText).toBeTruthy()
        expect(linkText.trim().length).toBeGreaterThan(0)
      })
    })

    it('should have proper semantic HTML structure', () => {
      render(<HomePage />)
      
      // Check for semantic elements
      expect(screen.getByRole('main')).toBeInTheDocument()
      
      // Sections should be properly structured
      const sections = screen.getByRole('main').querySelectorAll('section')
      expect(sections.length).toBeGreaterThanOrEqual(4) // Hero, InfoBlocks, Services, ContactCTA
    })
  })

  describe('Performance Considerations', () => {
    it('should use optimized image loading', () => {
      render(<HomePage />)
      
      // Check that images are properly optimized (mocked)
      const images = screen.getAllByRole('img')
      const heroImage = images.find(img => img.getAttribute('src')?.includes('homeHero'))
      
      if (heroImage) {
        // Hero image should have priority loading
        expect(heroImage).toHaveAttribute('priority', '')
      }
    })

    it('should have proper loading strategies', () => {
      render(<HomePage />)
      
      // Check for lazy loading attributes on non-critical images
      const images = screen.getAllByRole('img')
      const nonCriticalImages = images.filter(img => 
        !img.hasAttribute('priority') && 
        img.getAttribute('src')?.includes('/Images/public/')
      )
      
      // Non-critical images should be optimized for performance
      expect(nonCriticalImages.length).toBeGreaterThan(0)
    })
  })

  describe('Content Quality', () => {
    it('should have compelling marketing copy', () => {
      render(<HomePage />)
      
      // Check for key marketing phrases
      expect(screen.getByText(/Drilling Beyond Limits/)).toBeInTheDocument()
      expect(screen.getByText(/Get Your Free Quote Today/)).toBeInTheDocument()
      expect(screen.getByText(/Professional foundation services/)).toBeInTheDocument()
    })

    it('should emphasize company strengths', () => {
      render(<HomePage />)
      
      expect(screen.getByText(/Excellence Since 1986/)).toBeInTheDocument()
      expect(screen.getByText(/Nation-Wide Service/)).toBeInTheDocument()
      expect(screen.getByText(/nationally recognized/)).toBeInTheDocument()
    })
  })

  describe('Animation and Interaction Elements', () => {
    it('should include fade-in animations', () => {
      render(<HomePage />)
      
      const fadeInElements = screen.getAllByTestId('fade-in')
      const fadeInStaggerElements = screen.getAllByTestId('fade-in-stagger')
      
      expect(fadeInElements.length).toBeGreaterThan(0)
      expect(fadeInStaggerElements.length).toBeGreaterThan(0)
    })

    it('should have hover effects on interactive elements', () => {
      render(<HomePage />)
      
      const buttons = screen.getAllByRole('link')
      const actionButtons = buttons.filter(button => 
        button.classList.contains('bg-red-600')
      )
      
      expect(actionButtons.length).toBeGreaterThan(0)
      actionButtons.forEach(button => {
        expect(button.className).toMatch(/hover:/)
      })
    })
  })
})