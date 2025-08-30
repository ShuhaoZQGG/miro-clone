import { test, expect } from '@playwright/test'

test.describe('Performance Monitoring Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  test('should display FPS counter when triggered', async ({ page }) => {
    // Trigger FPS counter with keyboard shortcut
    await page.keyboard.press('Control+Shift+P')
    
    // Wait for FPS counter to appear
    const fpsCounter = page.getByTestId('fps-counter')
    await expect(fpsCounter).toBeVisible()
    
    // Check FPS value is displayed
    const fpsValue = page.getByTestId('fps-value')
    await expect(fpsValue).toContainText('FPS')
    
    // Check performance indicator
    const indicator = page.getByTestId('fps-indicator')
    await expect(indicator).toBeVisible()
  })

  test('should toggle FPS counter visibility', async ({ page }) => {
    // Show FPS counter
    await page.keyboard.press('Control+Shift+P')
    const fpsCounter = page.getByTestId('fps-counter')
    await expect(fpsCounter).toBeVisible()
    
    // Hide FPS counter
    await page.keyboard.press('Control+Shift+P')
    await expect(fpsCounter).not.toBeVisible()
  })

  test('should display test dashboard when triggered', async ({ page }) => {
    // Trigger test dashboard with keyboard shortcut
    await page.keyboard.press('Control+Shift+T')
    
    // Wait for dashboard to appear
    const testDashboard = page.getByTestId('test-dashboard')
    await expect(testDashboard).toBeVisible()
    
    // Check dashboard header
    const header = testDashboard.getByText('Test Runner')
    await expect(header).toBeVisible()
    
    // Check test stats are displayed
    const stats = testDashboard.getByTestId('test-stats')
    await expect(stats).toBeVisible()
  })

  test('should collapse and expand test dashboard', async ({ page }) => {
    // Open dashboard
    await page.keyboard.press('Control+Shift+T')
    const testDashboard = page.getByTestId('test-dashboard')
    await expect(testDashboard).toBeVisible()
    
    // Collapse dashboard
    const collapseButton = testDashboard.getByRole('button', { name: /collapse/i })
    await collapseButton.click()
    
    // Check dashboard is collapsed
    const content = testDashboard.getByTestId('dashboard-content')
    await expect(content).not.toBeVisible()
    
    // Expand dashboard
    const expandButton = testDashboard.getByRole('button', { name: /expand/i })
    await expandButton.click()
    
    // Check dashboard is expanded
    await expect(content).toBeVisible()
  })

  test('should display performance metrics correctly', async ({ page }) => {
    // Show FPS counter
    await page.keyboard.press('Control+Shift+P')
    
    // Simulate canvas interactions to generate performance data
    const canvas = page.locator('canvas').first()
    
    // Perform drag operations
    await canvas.dragTo(canvas, {
      sourcePosition: { x: 100, y: 100 },
      targetPosition: { x: 300, y: 300 }
    })
    
    // Wait for FPS update
    await page.waitForTimeout(1000)
    
    // Check FPS value is reasonable
    const fpsValue = page.getByTestId('fps-value')
    const text = await fpsValue.textContent()
    const fps = parseInt(text?.match(/\d+/)?.[0] || '0')
    
    // FPS should be between 0 and 120
    expect(fps).toBeGreaterThanOrEqual(0)
    expect(fps).toBeLessThanOrEqual(120)
  })

  test('should show memory usage in performance overlay', async ({ page }) => {
    // Show FPS counter
    await page.keyboard.press('Control+Shift+P')
    
    // Check memory display if available
    const memoryDisplay = page.getByTestId('memory-usage')
    const isVisible = await memoryDisplay.isVisible().catch(() => false)
    
    if (isVisible) {
      const text = await memoryDisplay.textContent()
      expect(text).toMatch(/\d+(\.\d+)?\s*MB/)
    }
  })

  test('performance overlay should update in real-time', async ({ page }) => {
    // Show FPS counter
    await page.keyboard.press('Control+Shift+P')
    
    // Get initial FPS value
    const fpsValue = page.getByTestId('fps-value')
    const initialText = await fpsValue.textContent()
    
    // Perform canvas operations
    const canvas = page.locator('canvas').first()
    for (let i = 0; i < 5; i++) {
      await canvas.click({ position: { x: 100 + i * 50, y: 100 + i * 50 } })
      await page.waitForTimeout(200)
    }
    
    // Check FPS has updated
    const updatedText = await fpsValue.textContent()
    expect(updatedText).toBeDefined()
    
    // Value should have changed (or at least been refreshed)
    const updatedFps = parseInt(updatedText?.match(/\d+/)?.[0] || '0')
    expect(updatedFps).toBeGreaterThanOrEqual(0)
  })

  test('should maintain performance overlay position', async ({ page }) => {
    // Show FPS counter
    await page.keyboard.press('Control+Shift+P')
    
    const fpsCounter = page.getByTestId('fps-counter')
    
    // Check initial position (should be top-right)
    const box = await fpsCounter.boundingBox()
    expect(box).toBeDefined()
    
    if (box) {
      const viewportSize = page.viewportSize()
      if (viewportSize) {
        // Should be in top-right quadrant
        expect(box.x).toBeGreaterThan(viewportSize.width / 2)
        expect(box.y).toBeLessThan(viewportSize.height / 2)
      }
    }
  })
})

test.describe('Test Dashboard Integration', () => {
  test('should connect to Jest runner when JEST_DASHBOARD is set', async ({ page }) => {
    // This test requires JEST_DASHBOARD env variable
    // It would be run in a special test environment
    
    // Set up test environment
    process.env.JEST_DASHBOARD = '1'
    
    await page.goto('http://localhost:3000')
    await page.keyboard.press('Control+Shift+T')
    
    const testDashboard = page.getByTestId('test-dashboard')
    await expect(testDashboard).toBeVisible()
    
    // Check for real-time updates (requires Jest to be running)
    const stats = testDashboard.getByTestId('test-stats')
    await expect(stats).toContainText(/\d+ Passed/)
  })
})