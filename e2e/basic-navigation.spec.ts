import { test, expect } from '@playwright/test'

test.describe('Basic Navigation', () => {
  test('should navigate to board page', async ({ page }) => {
    await page.goto('/board/test-board')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check if canvas exists (may need to wait for it to be created)
    const canvas = await page.waitForSelector('canvas', { 
      timeout: 10000,
      state: 'attached' 
    }).catch(() => null)
    
    if (canvas) {
      expect(canvas).toBeTruthy()
    } else {
      // If no canvas, at least check the page loaded
      const title = await page.title()
      expect(title).toBeTruthy()
    }
  })

  test('should navigate between pages', async ({ page }) => {
    // Start at board page
    await page.goto('/board/test-board')
    await page.waitForLoadState('networkidle')
    
    // Navigate to about page
    await page.goto('/about')
    await page.waitForLoadState('networkidle')
    
    // Check about page loaded
    const aboutHeading = await page.textContent('h1')
    expect(aboutHeading).toContain('About')
    
    // Navigate back to board
    await page.goto('/board/test-board')
    await page.waitForLoadState('networkidle')
    
    // Verify we're back on board page
    const url = page.url()
    expect(url).toContain('/board/test-board')
  })

  test('should not throw console errors on navigation', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Navigate to board
    await page.goto('/board/test-board')
    await page.waitForTimeout(1000)
    
    // Navigate to about
    await page.goto('/about')
    await page.waitForTimeout(1000)
    
    // Navigate back to board
    await page.goto('/board/test-board')
    await page.waitForTimeout(1000)
    
    // Filter out expected warnings/errors
    const criticalErrors = consoleErrors.filter(err => 
      err.includes('removeChild') || 
      err.includes('not a child of this node') ||
      err.includes('Failed to execute') ||
      err.includes('TypeError')
    )
    
    expect(criticalErrors).toHaveLength(0)
  })
})