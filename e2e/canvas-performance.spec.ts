import { test, expect } from '@playwright/test'

test.describe('Canvas Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/board/test-board')
    await page.waitForSelector('canvas', { state: 'visible' })
  })

  test('canvas should fill entire viewport', async ({ page }) => {
    // Get viewport dimensions
    const viewportSize = page.viewportSize()
    expect(viewportSize).toBeTruthy()
    
    // Get canvas dimensions
    const canvasDimensions = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      return {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      }
    })
    
    expect(canvasDimensions).toBeTruthy()
    expect(canvasDimensions?.width).toBe(viewportSize?.width)
    expect(canvasDimensions?.height).toBe(viewportSize?.height)
    expect(canvasDimensions?.top).toBe(0)
    expect(canvasDimensions?.left).toBe(0)
  })

  test('canvas should resize when window resizes', async ({ page }) => {
    // Initial size
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(500) // Wait for resize debounce
    
    let canvasSize = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      return canvas ? { width: canvas.width, height: canvas.height } : null
    })
    
    expect(canvasSize?.width).toBeGreaterThanOrEqual(1920)
    expect(canvasSize?.height).toBeGreaterThanOrEqual(1080)
    
    // Resize window
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForTimeout(500) // Wait for resize debounce
    
    canvasSize = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      return canvas ? { width: canvas.width, height: canvas.height } : null
    })
    
    expect(canvasSize?.width).toBeGreaterThanOrEqual(1280)
    expect(canvasSize?.height).toBeGreaterThanOrEqual(720)
  })

  test('smooth drag operation', async ({ page }) => {
    // Select rectangle tool
    await page.click('[data-testid="tool-rectangle"]')
    
    // Create a rectangle
    await page.mouse.click(400, 300)
    
    // Select the select tool
    await page.click('[data-testid="tool-select"]')
    
    // Measure drag smoothness
    const startTime = Date.now()
    
    // Drag the rectangle
    await page.mouse.move(400, 300)
    await page.mouse.down()
    
    // Perform smooth drag with multiple steps
    for (let i = 0; i <= 20; i++) {
      await page.mouse.move(400 + i * 10, 300 + i * 5)
      await page.waitForTimeout(10) // Small delay for smooth animation
    }
    
    await page.mouse.up()
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // Should complete smooth drag in reasonable time (under 1 second for 200px drag)
    expect(duration).toBeLessThan(1000)
    
    // Verify element moved
    const elementPosition = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas
      if (!canvas) return null
      const objects = canvas.getObjects()
      if (objects.length === 0) return null
      return {
        left: objects[0].left,
        top: objects[0].top
      }
    })
    
    // Element should have moved approximately to the new position
    expect(elementPosition?.left).toBeGreaterThan(500)
    expect(elementPosition?.top).toBeGreaterThan(350)
  })

  test('smooth resize operation', async ({ page }) => {
    // Select rectangle tool
    await page.click('[data-testid="tool-rectangle"]')
    
    // Create a rectangle
    await page.mouse.click(400, 300)
    
    // Select the select tool
    await page.click('[data-testid="tool-select"]')
    
    // Click on the rectangle to select it
    await page.mouse.click(400, 300)
    
    // Find resize handle (approximate position)
    const handleX = 450
    const handleY = 350
    
    // Measure resize smoothness
    const startTime = Date.now()
    
    // Drag resize handle
    await page.mouse.move(handleX, handleY)
    await page.mouse.down()
    
    // Perform smooth resize
    for (let i = 0; i <= 10; i++) {
      await page.mouse.move(handleX + i * 5, handleY + i * 5)
      await page.waitForTimeout(10)
    }
    
    await page.mouse.up()
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // Should complete smooth resize quickly
    expect(duration).toBeLessThan(500)
  })

  test('smooth zoom operation', async ({ page }) => {
    // Test zoom performance
    const startTime = Date.now()
    
    // Perform multiple zoom operations
    for (let i = 0; i < 5; i++) {
      await page.keyboard.down('Control')
      await page.keyboard.press('+')
      await page.keyboard.up('Control')
      await page.waitForTimeout(50)
    }
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // Should complete 5 zoom operations smoothly
    expect(duration).toBeLessThan(500)
    
    // Verify zoom changed
    const zoomLevel = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas
      return canvas ? canvas.getZoom() : 1
    })
    
    expect(zoomLevel).toBeGreaterThan(1)
  })

  test('smooth pan operation', async ({ page }) => {
    // Select pan tool
    await page.click('[data-testid="tool-pan"]')
    
    const startTime = Date.now()
    
    // Perform smooth pan
    await page.mouse.move(500, 400)
    await page.mouse.down()
    
    for (let i = 0; i <= 20; i++) {
      await page.mouse.move(500 - i * 10, 400 - i * 5)
      await page.waitForTimeout(10)
    }
    
    await page.mouse.up()
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // Should complete smooth pan quickly
    expect(duration).toBeLessThan(1000)
  })

  test('rapid element creation performance', async ({ page }) => {
    // Select sticky note tool
    await page.click('[data-testid="tool-sticky_note"]')
    
    const startTime = Date.now()
    
    // Create multiple sticky notes rapidly
    const positions = [
      { x: 200, y: 200 },
      { x: 400, y: 200 },
      { x: 600, y: 200 },
      { x: 200, y: 400 },
      { x: 400, y: 400 },
      { x: 600, y: 400 }
    ]
    
    for (const pos of positions) {
      await page.mouse.click(pos.x, pos.y)
      await page.waitForTimeout(50) // Small delay between creations
    }
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // Should create 6 elements quickly
    expect(duration).toBeLessThan(1000)
    
    // Verify all elements were created
    const elementCount = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas
      return canvas ? canvas.getObjects().length : 0
    })
    
    expect(elementCount).toBe(6)
  })

  test('no memory leaks during rapid operations', async ({ page }) => {
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })
    
    // Perform many operations
    for (let i = 0; i < 10; i++) {
      // Create element
      await page.click('[data-testid="tool-rectangle"]')
      await page.mouse.click(200 + i * 50, 200)
      
      // Select and delete
      await page.click('[data-testid="tool-select"]')
      await page.mouse.click(200 + i * 50, 200)
      await page.keyboard.press('Delete')
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as any).gc()
      }
    })
    
    // Wait a bit for cleanup
    await page.waitForTimeout(1000)
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })
    
    // Memory should not have increased significantly (allow 10MB increase)
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // 10MB
    }
  })
})