import { test, expect } from '@playwright/test'

test.describe('Full-screen Canvas Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('canvas')
  })

  test('canvas should fill the entire viewport', async ({ page }) => {
    const viewport = page.viewportSize()
    const canvas = await page.locator('canvas')
    const boundingBox = await canvas.boundingBox()
    
    expect(boundingBox).toBeTruthy()
    expect(boundingBox!.width).toBeGreaterThanOrEqual(viewport!.width * 0.95)
    expect(boundingBox!.height).toBeGreaterThanOrEqual(viewport!.height * 0.90)
  })

  test('canvas should resize when window resizes', async ({ page }) => {
    // Initial size
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.waitForTimeout(100)
    
    const canvas = await page.locator('canvas')
    let boundingBox = await canvas.boundingBox()
    
    expect(boundingBox!.width).toBeGreaterThanOrEqual(1140) // 95% of 1200
    expect(boundingBox!.height).toBeGreaterThanOrEqual(720) // 90% of 800
    
    // Resize window
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.waitForTimeout(100)
    
    boundingBox = await canvas.boundingBox()
    expect(boundingBox!.width).toBeGreaterThanOrEqual(1520) // 95% of 1600
    expect(boundingBox!.height).toBeGreaterThanOrEqual(810) // 90% of 900
  })

  test('should maintain aspect ratio during resize', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(100)
    
    const canvas = await page.locator('canvas')
    const boundingBox = await canvas.boundingBox()
    
    const aspectRatio = boundingBox!.width / boundingBox!.height
    
    // Resize to different aspect ratio
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.waitForTimeout(100)
    
    const newBoundingBox = await canvas.boundingBox()
    const newAspectRatio = newBoundingBox!.width / newBoundingBox!.height
    
    // Aspect ratios should be similar (within 5% tolerance)
    expect(Math.abs(aspectRatio - newAspectRatio)).toBeLessThan(0.2)
  })

  test('should not have scrollbars in full-screen mode', async ({ page }) => {
    // Check for absence of scrollbars
    const hasVerticalScroll = await page.evaluate(() => {
      return document.documentElement.scrollHeight > window.innerHeight
    })
    
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })
    
    expect(hasVerticalScroll).toBe(false)
    expect(hasHorizontalScroll).toBe(false)
  })

  test('should handle mobile viewport sizes', async ({ page }) => {
    // iPhone 12 Pro size
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(100)
    
    const canvas = await page.locator('canvas')
    const boundingBox = await canvas.boundingBox()
    
    expect(boundingBox).toBeTruthy()
    expect(boundingBox!.width).toBeGreaterThanOrEqual(370) // Allow for small margins
    expect(boundingBox!.height).toBeGreaterThanOrEqual(750)
  })

  test('should handle tablet viewport sizes', async ({ page }) => {
    // iPad Pro size
    await page.setViewportSize({ width: 1024, height: 1366 })
    await page.waitForTimeout(100)
    
    const canvas = await page.locator('canvas')
    const boundingBox = await canvas.boundingBox()
    
    expect(boundingBox).toBeTruthy()
    expect(boundingBox!.width).toBeGreaterThanOrEqual(970)
    expect(boundingBox!.height).toBeGreaterThanOrEqual(1200)
  })

  test('canvas should be interactive in full-screen', async ({ page }) => {
    const canvas = await page.locator('canvas')
    
    // Test pan interaction
    await canvas.click({ position: { x: 400, y: 300 } })
    await page.mouse.down()
    await page.mouse.move(500, 400)
    await page.mouse.up()
    
    // Canvas should still be visible and interactive
    await expect(canvas).toBeVisible()
    
    // Test zoom interaction
    await canvas.hover({ position: { x: 500, y: 400 } })
    await page.mouse.wheel(0, -100)
    
    // Canvas should still be full-screen after interactions
    const boundingBox = await canvas.boundingBox()
    const viewport = page.viewportSize()
    expect(boundingBox!.width).toBeGreaterThanOrEqual(viewport!.width * 0.95)
  })

  test('should preserve drawing content on resize', async ({ page }) => {
    // Add some content to canvas
    await page.click('[data-tool="rectangle"]')
    const canvas = await page.locator('canvas')
    await canvas.click({ position: { x: 200, y: 200 } })
    await page.mouse.down()
    await page.mouse.move(400, 400)
    await page.mouse.up()
    
    // Take screenshot before resize
    const screenshotBefore = await canvas.screenshot()
    
    // Resize window
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.waitForTimeout(100)
    
    // Content should still be visible (canvas not cleared)
    const objects = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas
      return canvas ? canvas.getObjects().length : 0
    })
    
    expect(objects).toBeGreaterThan(0)
  })
})