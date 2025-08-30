import { test, expect } from '@playwright/test'

test.describe('Canvas Disposal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/board/test-board')
    await page.waitForSelector('canvas', { timeout: 10000 })
  })

  test('should dispose canvas without DOM errors', async ({ page }) => {
    // Create some elements on canvas
    await page.click('[data-testid="tool-rectangle"]')
    await page.mouse.move(200, 200)
    await page.mouse.down()
    await page.mouse.move(400, 400)
    await page.mouse.up()

    // Create another element
    await page.click('[data-testid="tool-ellipse"]')
    await page.mouse.move(300, 300)
    await page.mouse.down()
    await page.mouse.move(500, 500)
    await page.mouse.up()

    // Listen for console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Navigate away to trigger canvas disposal
    await page.goto('/about')
    await page.waitForTimeout(500)

    // Check no DOM errors occurred
    const domErrors = consoleErrors.filter(err => 
      err.includes('removeChild') || 
      err.includes('not a child of this node')
    )
    expect(domErrors).toHaveLength(0)

    // Navigate back to canvas
    await page.goto('/board/test-board')
    await page.waitForSelector('canvas', { timeout: 10000 })

    // Verify canvas is functional after re-initialization
    await page.click('[data-testid="tool-rectangle"]')
    await page.mouse.move(150, 150)
    await page.mouse.down()
    await page.mouse.move(250, 250)
    await page.mouse.up()

    // Verify element was created
    const canvasObjects = await page.evaluate(() => {
      const canvas = (window as any).canvasEngine?.canvas
      return canvas?.getObjects()?.length || 0
    })
    expect(canvasObjects).toBeGreaterThan(0)
  })

  test('should handle multiple disposal attempts gracefully', async ({ page }) => {
    // Create an element
    await page.click('[data-testid="tool-rectangle"]')
    await page.mouse.move(100, 100)
    await page.mouse.down()
    await page.mouse.move(300, 300)
    await page.mouse.up()

    // Attempt to dispose multiple times programmatically
    const errors = await page.evaluate(async () => {
      const errors: string[] = []
      const canvas = (window as any).canvasEngine
      
      if (canvas) {
        try {
          canvas.dispose()
        } catch (e: any) {
          errors.push(e.message)
        }
        
        // Attempt second disposal
        try {
          canvas.dispose()
        } catch (e: any) {
          errors.push(e.message)
        }
      }
      
      return errors
    })

    // Should not throw errors on multiple disposal attempts
    expect(errors).toHaveLength(0)
  })

  test('should clean up event listeners on disposal', async ({ page }) => {
    // Create an element
    await page.click('[data-testid="tool-rectangle"]')
    await page.mouse.move(100, 100)
    await page.mouse.down()
    await page.mouse.move(200, 200)
    await page.mouse.up()

    // Check event listeners before disposal
    const listenerCountBefore = await page.evaluate(() => {
      const canvas = (window as any).canvasEngine?.canvas
      if (!canvas) return 0
      
      // Count Fabric event listeners
      const events = (canvas as any).__eventListeners || {}
      let count = 0
      for (const event in events) {
        count += events[event]?.length || 0
      }
      return count
    })

    expect(listenerCountBefore).toBeGreaterThan(0)

    // Navigate away to trigger disposal
    await page.goto('/about')
    await page.waitForTimeout(500)

    // Navigate back
    await page.goto('/')
    await page.waitForSelector('canvas', { timeout: 10000 })

    // Check that listeners are properly set up after re-initialization
    const listenerCountAfter = await page.evaluate(() => {
      const canvas = (window as any).canvasEngine?.canvas
      if (!canvas) return 0
      
      const events = (canvas as any).__eventListeners || {}
      let count = 0
      for (const event in events) {
        count += events[event]?.length || 0
      }
      return count
    })

    // Should have listeners after re-initialization
    expect(listenerCountAfter).toBeGreaterThan(0)
  })

  test('should not leak memory on disposal', async ({ page }) => {
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })

    // Create many elements
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="tool-rectangle"]')
      await page.mouse.move(50 + i * 30, 50 + i * 30)
      await page.mouse.down()
      await page.mouse.move(100 + i * 30, 100 + i * 30)
      await page.mouse.up()
    }

    // Navigate away and back multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto('/about')
      await page.waitForTimeout(200)
      await page.goto('/board/test-board')
      await page.waitForSelector('canvas', { timeout: 10000 })
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc()
      }
    })

    // Check memory hasn't grown excessively
    const finalMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })

    // Memory should not grow by more than 50MB
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryGrowth = finalMemory - initialMemory
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // 50MB
    }
  })

  test('should handle disposal during active animations', async ({ page }) => {
    // Create an element and start an animation
    await page.click('[data-testid="tool-rectangle"]')
    await page.mouse.move(100, 100)
    await page.mouse.down()
    await page.mouse.move(300, 300)
    await page.mouse.up()

    // Start moving the element (animation)
    await page.mouse.move(200, 200)
    await page.mouse.down()
    await page.mouse.move(250, 250)

    // Navigate away while dragging (animation in progress)
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/about')
    await page.waitForTimeout(500)

    // Check no errors occurred
    expect(consoleErrors).toHaveLength(0)
  })

  test('should handle disposal with resize observer active', async ({ page }) => {
    // Set up resize observer monitoring
    await page.evaluate(() => {
      const canvas = (window as any).canvasEngine
      if (canvas && canvas.setupResizeObserver) {
        canvas.setupResizeObserver()
      }
    })

    // Resize window to trigger resize observer
    await page.setViewportSize({ width: 800, height: 600 })
    await page.waitForTimeout(100)
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.waitForTimeout(100)

    // Navigate away to trigger disposal
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/about')
    await page.waitForTimeout(500)

    // Check no resize observer errors
    const resizeErrors = consoleErrors.filter(err => 
      err.includes('ResizeObserver') || 
      err.includes('observe') ||
      err.includes('disconnect')
    )
    expect(resizeErrors).toHaveLength(0)
  })
})