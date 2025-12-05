/**
 * End-to-End Tests for Critical User Journeys
 * Tests complete user workflows using Puppeteer
 */

import puppeteer from 'puppeteer'

const APP_URL = process.env.TEST_URL || 'http://localhost:3001'
const TIMEOUT = 30000

describe('Critical User Journeys E2E Tests', () => {
  let browser
  let page

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.CI !== 'false', // Run headless in CI
      slowMo: process.env.CI ? 0 : 50, // Slow down in development
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
  })

  beforeEach(async () => {
    page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 800 })
    
    // Set user agent to simulate real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    
    // Enable request interception for performance monitoring
    await page.setRequestInterception(true)
    page.on('request', request => {
      request.continue()
    })
  })

  afterEach(async () => {
    if (page) {
      await page.close()
    }
  })

  describe('Homepage User Journey', () => {
    it('should complete full homepage navigation journey', async () => {
      // Navigate to homepage
      await page.goto(APP_URL, { waitUntil: 'networkidle0', timeout: TIMEOUT })
      
      // Verify homepage loads correctly
      await expect(page.title()).resolves.toMatch(/S&W Foundation/)
      
      // Check hero section is visible
      await page.waitForSelector('h1', { timeout: 10000 })
      const heroTitle = await page.$eval('h1', el => el.textContent)
      expect(heroTitle).toContain('S&W Foundation Contractors')
      
      // Test main navigation
      await page.click('a[href="/services"]')
      await page.waitForNavigation({ waitUntil: 'networkidle0' })
      expect(page.url()).toContain('/services')
      
      // Navigate back to home
      await page.click('a[href="/"]')
      await page.waitForNavigation({ waitUntil: 'networkidle0' })
      expect(page.url()).toBe(APP_URL + '/')
      
      // Test contact information click
      const phoneLink = await page.$('a[href*="tel:"]')
      expect(phoneLink).toBeTruthy()
      
      // Test CTA button
      const ctaButtons = await page.$$('a[href="/contact"]')
      expect(ctaButtons.length).toBeGreaterThan(0)
      
      await ctaButtons[0].click()
      await page.waitForNavigation({ waitUntil: 'networkidle0' })
      expect(page.url()).toContain('/contact')
    })

    it('should handle mobile navigation correctly', async () => {
      // Set mobile viewport
      await page.setViewport({ width: 375, height: 667 })
      await page.goto(APP_URL, { waitUntil: 'networkidle0' })
      
      // Check mobile menu button is visible
      const mobileMenuButton = await page.$('button[class*="md:hidden"]')
      expect(mobileMenuButton).toBeTruthy()
      
      // Click mobile menu
      await page.click('button[class*="md:hidden"]')
      
      // Wait for menu to appear
      await page.waitForSelector('.md\\:hidden a[href="/about"]', { visible: true })
      
      // Test mobile menu navigation
      await page.click('.md\\:hidden a[href="/about"]')
      await page.waitForNavigation({ waitUntil: 'networkidle0' })
      expect(page.url()).toContain('/about')
    })
  })

  describe('Contact Form User Journey', () => {
    it('should complete contact form submission successfully', async () => {
      await page.goto(`${APP_URL}/contact`, { waitUntil: 'networkidle0' })
      
      // Wait for contact form to be visible
      await page.waitForSelector('form', { timeout: 10000 })
      
      // Fill out contact form
      await page.type('input[name="name"]', 'Test User')
      await page.type('input[name="email"]', 'test@example.com')
      await page.type('input[name="phone"]', '(555) 123-4567')
      await page.type('textarea[name="message"]', 'This is a test message for E2E testing.')
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Wait for success message or redirect
      try {
        await page.waitForSelector('.success-message', { timeout: 10000 })
        const successMessage = await page.$eval('.success-message', el => el.textContent)
        expect(successMessage).toMatch(/success|sent|received/i)
      } catch {
        // Alternative: check for redirect or other success indicator
        await page.waitForNavigation({ timeout: 10000 })
        const url = page.url()
        expect(url).toMatch(/success|thank-you|contact/)
      }
    })

    it('should validate form fields correctly', async () => {
      await page.goto(`${APP_URL}/contact`, { waitUntil: 'networkidle0' })
      
      // Try to submit empty form
      await page.click('button[type="submit"]')
      
      // Check for validation errors
      const requiredFields = await page.$$('input:required, textarea:required')
      expect(requiredFields.length).toBeGreaterThan(0)
      
      // Test invalid email validation
      await page.type('input[name="email"]', 'invalid-email')
      await page.click('button[type="submit"]')
      
      const emailInput = await page.$('input[name="email"]:invalid')
      expect(emailInput).toBeTruthy()
    })
  })

  describe('Job Application User Journey', () => {
    it('should browse and apply for jobs', async () => {
      await page.goto(`${APP_URL}/careers`, { waitUntil: 'networkidle0' })
      
      // Wait for job listings to load
      await page.waitForSelector('.job-listing, .job-card, [data-testid*="job"]', { timeout: 15000 })
      
      // Check for job listings
      const jobElements = await page.$$('.job-listing, .job-card, [data-testid*="job"]')
      expect(jobElements.length).toBeGreaterThan(0)
      
      // Click on first available job
      await jobElements[0].click()
      
      // Check if application form or job details are shown
      try {
        await page.waitForSelector('form, .job-details, .application-form', { timeout: 10000 })
      } catch {
        // If no form is available, at least job details should be visible
        const jobContent = await page.$('.job-description, .job-content, h2')
        expect(jobContent).toBeTruthy()
      }
    })
  })

  describe('Blog Content User Journey', () => {
    it('should navigate through blog content', async () => {
      await page.goto(`${APP_URL}/blog`, { waitUntil: 'networkidle0' })
      
      // Wait for blog posts to load
      await page.waitForSelector('a[href*="/blog/"], .blog-post, article', { timeout: 15000 })
      
      // Get blog post links
      const blogPosts = await page.$$('a[href*="/blog/"]:not([href="/blog"])')
      
      if (blogPosts.length > 0) {
        // Click on first blog post
        await blogPosts[0].click()
        await page.waitForNavigation({ waitUntil: 'networkidle0' })
        
        // Verify blog post content loads
        const blogContent = await page.$('article, .blog-content, h1')
        expect(blogContent).toBeTruthy()
        
        // Check for proper blog post structure
        const heading = await page.$('h1')
        expect(heading).toBeTruthy()
      }
    })
  })

  describe('Admin Panel User Journey', () => {
    it('should handle admin login flow', async () => {
      await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle0' })
      
      // Check if login form exists
      const loginForm = await page.$('form')
      if (loginForm) {
        // Test login form validation
        await page.click('button[type="submit"]')
        
        // Should show validation errors for empty fields
        const inputs = await page.$$('input:required')
        expect(inputs.length).toBeGreaterThan(0)
        
        // Test with invalid credentials
        await page.type('input[type="email"], input[name="email"]', 'test@example.com')
        await page.type('input[type="password"], input[name="password"]', 'wrongpassword')
        await page.click('button[type="submit"]')
        
        // Should remain on login page or show error
        await page.waitForTimeout(2000)
        const currentUrl = page.url()
        expect(currentUrl).toMatch(/login|auth/)
      }
    })
  })

  describe('Performance and Core Web Vitals', () => {
    it('should meet Core Web Vitals thresholds', async () => {
      await page.goto(APP_URL, { waitUntil: 'networkidle0' })
      
      // Measure Core Web Vitals
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          let vitalsData = {}
          
          // Largest Contentful Paint
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries()
            if (entries.length > 0) {
              vitalsData.lcp = entries[entries.length - 1].startTime
            }
          }).observe({ entryTypes: ['largest-contentful-paint'] })
          
          // First Input Delay (simulated)
          vitalsData.fid = 0 // Will be 0 in automated tests
          
          // Cumulative Layout Shift
          new PerformanceObserver((entryList) => {
            let cls = 0
            entryList.getEntries().forEach((entry) => {
              if (!entry.hadRecentInput) {
                cls += entry.value
              }
            })
            vitalsData.cls = cls
          }).observe({ entryTypes: ['layout-shift'] })
          
          setTimeout(() => resolve(vitalsData), 3000)
        })
      })
      
      // Check thresholds
      if (vitals.lcp) {
        expect(vitals.lcp).toBeLessThan(2500) // LCP should be < 2.5s
      }
      if (vitals.cls !== undefined) {
        expect(vitals.cls).toBeLessThan(0.1) // CLS should be < 0.1
      }
    })

    it('should load critical resources quickly', async () => {
      const startTime = Date.now()
      
      await page.goto(APP_URL, { waitUntil: 'domcontentloaded' })
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
      
      // Check that critical content is visible
      await page.waitForSelector('h1', { timeout: 5000 })
      const isVisible = await page.$eval('h1', el => {
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      })
      expect(isVisible).toBe(true)
    })
  })

  describe('Accessibility Testing', () => {
    it('should be navigable with keyboard only', async () => {
      await page.goto(APP_URL, { waitUntil: 'networkidle0' })
      
      // Test tab navigation
      await page.keyboard.press('Tab')
      let focusedElement = await page.evaluate(() => document.activeElement.tagName)
      expect(['A', 'BUTTON', 'INPUT'].includes(focusedElement)).toBe(true)
      
      // Continue tabbing through several elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
      }
      
      // Should still have focus on interactive element
      focusedElement = await page.evaluate(() => document.activeElement.tagName)
      expect(['A', 'BUTTON', 'INPUT', 'TEXTAREA'].includes(focusedElement)).toBe(true)
    })

    it('should have proper heading hierarchy', async () => {
      await page.goto(APP_URL, { waitUntil: 'networkidle0' })
      
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => 
        elements.map(el => ({
          tag: el.tagName.toLowerCase(),
          text: el.textContent.trim()
        }))
      )
      
      expect(headings.length).toBeGreaterThan(0)
      
      // Should have at least one h1
      const h1Count = headings.filter(h => h.tag === 'h1').length
      expect(h1Count).toBeGreaterThanOrEqual(1)
      
      // Headings should have content
      headings.forEach(heading => {
        expect(heading.text.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle 404 pages gracefully', async () => {
      const response = await page.goto(`${APP_URL}/non-existent-page`, { 
        waitUntil: 'networkidle0',
        timeout: TIMEOUT 
      })
      
      // Should either redirect or show 404
      const status = response.status()
      expect([200, 404]).toContain(status)
      
      // Page should still be functional
      const title = await page.title()
      expect(title.length).toBeGreaterThan(0)
    })

    it('should handle network errors', async () => {
      // Simulate offline condition
      await page.setOfflineMode(true)
      
      try {
        await page.goto(APP_URL, { timeout: 5000 })
      } catch (error) {
        expect(error.message).toMatch(/net::|failed|timeout/)
      }
      
      // Re-enable network
      await page.setOfflineMode(false)
      
      // Should recover
      await page.goto(APP_URL, { waitUntil: 'networkidle0' })
      expect(await page.title()).toBeTruthy()
    })
  })
})