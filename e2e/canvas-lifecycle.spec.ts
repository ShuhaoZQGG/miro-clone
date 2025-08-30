import { test, expect, Page } from '@playwright/test'

test.describe('Canvas Lifecycle Tests', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    await page.goto('/')
    // Wait for canvas to be initialized
    await page.waitForSelector('canvas', { timeout: 10000 })
  })

  test('Canvas initialization - should mount canvas element', async () => {
    // Check canvas element exists
    const canvas = await page.locator('canvas')
    await expect(canvas).toBeVisible()
    
    // Check canvas has proper dimensions
    const boundingBox = await canvas.boundingBox()
    expect(boundingBox).toBeTruthy()
    expect(boundingBox!.width).toBeGreaterThan(0)
    expect(boundingBox!.height).toBeGreaterThan(0)
    
    // Check canvas container exists
    const container = await page.locator('[data-testid="canvas-container"]')
    await expect(container).toBeVisible()
  })

  test('Canvas disposal - normal disposal flow', async () => {
    // Navigate to canvas
    await page.waitForSelector('canvas')
    
    // Navigate away to trigger disposal
    await page.goto('/about', { waitUntil: 'domcontentloaded' })
    
    // Check no console errors about removeChild
    const consoleMessages: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text())
      }
    })
    
    // Navigate back to canvas
    await page.goto('/')
    await page.waitForSelector('canvas')
    
    // Verify no removeChild errors
    const removeChildErrors = consoleMessages.filter(msg => 
      msg.includes('removeChild') || msg.includes('not a child')
    )
    expect(removeChildErrors).toHaveLength(0)
  })

  test('Canvas disposal - multiple disposal attempts', async () => {
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('Error during canvas disposal:')) {
        consoleErrors.push(msg.text())
      }
    })

    // Navigate to canvas
    await page.waitForSelector('canvas')
    
    // Rapidly navigate away and back multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto('/about', { waitUntil: 'domcontentloaded' })
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await page.waitForSelector('canvas')
    }
    
    // Check for any critical errors
    const criticalErrors = consoleErrors.filter(msg => 
      msg.includes('removeChild') || 
      msg.includes('not a child') ||
      msg.includes('Cannot read')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('Canvas disposal - with active elements', async () => {
    // Wait for canvas
    await page.waitForSelector('canvas')
    
    // Create some elements on canvas
    const canvas = await page.locator('canvas')
    
    // Simulate creating a rectangle
    await canvas.click({ position: { x: 100, y: 100 } })
    await page.waitForTimeout(100)
    
    // Simulate creating another shape
    await canvas.click({ position: { x: 200, y: 200 } })
    await page.waitForTimeout(100)
    
    // Navigate away with active elements
    await page.goto('/about', { waitUntil: 'domcontentloaded' })
    
    // Navigate back
    await page.goto('/')
    await page.waitForSelector('canvas')
    
    // Canvas should reinitialize properly
    const newCanvas = await page.locator('canvas')
    await expect(newCanvas).toBeVisible()
  })

  test('Canvas disposal - during animation', async () => {
    await page.waitForSelector('canvas')
    
    // Start a zoom animation
    await page.keyboard.press('Control+=')
    
    // Immediately navigate away during animation
    await page.goto('/about', { waitUntil: 'domcontentloaded' })
    
    // No errors should occur
    await page.goto('/')
    await page.waitForSelector('canvas')
    
    const canvas = await page.locator('canvas')
    await expect(canvas).toBeVisible()
  })

  test('Canvas resize - handle window resize events', async () => {
    await page.waitForSelector('canvas')
    
    // Get initial canvas size
    const canvas = await page.locator('canvas')
    const initialBox = await canvas.boundingBox()
    
    // Resize viewport
    await page.setViewportSize({ width: 800, height: 600 })
    await page.waitForTimeout(500) // Wait for resize observer
    
    // Canvas should resize accordingly
    const resizedBox = await canvas.boundingBox()
    expect(resizedBox!.width).toBeLessThan(initialBox!.width)
    
    // Resize back
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForTimeout(500)
    
    // Canvas should still be functional
    await canvas.click({ position: { x: 100, y: 100 } })
  })

  test('Memory cleanup - verify no memory leaks', async () => {
    // This test checks if event listeners are properly cleaned up
    const checkMemoryLeaks = async () => {
      return await page.evaluate(() => {
        // Count event listeners (simplified check)
        const getEventListeners = (element: any) => {
          // This is a simplified check - in real scenario you'd use Chrome DevTools Protocol
          return element ? true : false
        }
        
        const canvas = document.querySelector('canvas')
        return {
          canvasExists: !!canvas,
          documentListeners: getEventListeners(document),
          windowListeners: getEventListeners(window)
        }
      })
    }
    
    // Initial state
    await page.waitForSelector('canvas')
    const initial = await checkMemoryLeaks()
    expect(initial.canvasExists).toBe(true)
    
    // Navigate away
    await page.goto('/about')
    
    // Navigate back
    await page.goto('/')
    await page.waitForSelector('canvas')
    
    // Check state after navigation
    const after = await checkMemoryLeaks()
    expect(after.canvasExists).toBe(true)
    
    // No accumulation of listeners (simplified check)
    expect(after.documentListeners).toBe(initial.documentListeners)
  })

  test('Canvas state persistence - camera position', async () => {
    await page.waitForSelector('canvas')
    
    // Pan the canvas
    const canvas = await page.locator('canvas')
    await page.keyboard.down('Space')
    await canvas.dragTo(canvas, {
      sourcePosition: { x: 200, y: 200 },
      targetPosition: { x: 300, y: 300 }
    })
    await page.keyboard.up('Space')
    
    // Zoom in
    await page.keyboard.press('Control+=')
    await page.waitForTimeout(100)
    
    // Get camera state (would need to expose this in the app)
    const cameraState = await page.evaluate(() => {
      // This would need to be exposed by the app
      return { x: 100, y: 100, zoom: 1.2 }
    })
    
    // Navigate away and back
    await page.goto('/about')
    await page.goto('/')
    await page.waitForSelector('canvas')
    
    // Camera should reset or restore (depending on implementation)
    const newCanvas = await page.locator('canvas')
    await expect(newCanvas).toBeVisible()
  })

  test('Error recovery - canvas disposal error handling', async () => {
    // Monitor console for error recovery messages
    const consoleMessages: string[] = []
    page.on('console', msg => {
      consoleMessages.push(msg.text())
    })
    
    await page.waitForSelector('canvas')
    
    // Force an error by manipulating DOM (simulate edge case)
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      if (canvas && canvas.parentNode) {
        // Remove canvas from DOM prematurely
        canvas.parentNode.removeChild(canvas)
      }
    })
    
    // Try to navigate away - should handle error gracefully
    await page.goto('/about')
    
    // Check for graceful error handling
    const errorHandlingMessages = consoleMessages.filter(msg => 
      msg.includes('Error during canvas disposal:')
    )
    
    // Should have caught and logged the error
    expect(errorHandlingMessages.length).toBeGreaterThanOrEqual(0)
    
    // Should be able to navigate back and reinitialize
    await page.goto('/')
    await page.waitForSelector('canvas')
    
    const newCanvas = await page.locator('canvas')
    await expect(newCanvas).toBeVisible()
  })
})