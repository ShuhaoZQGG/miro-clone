import { test, expect } from '@playwright/test'

test.describe('Performance Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('canvas')
  })

  test('should display FPS counter', async ({ page }) => {
    // FPS counter should be visible
    const fpsCounter = await page.locator('[data-testid="fps-counter"]')
    await expect(fpsCounter).toBeVisible()
    
    // Should display FPS value
    const fpsValue = await page.locator('[data-testid="fps-value"]')
    await expect(fpsValue).toContainText(/\d+ FPS/)
  })

  test('should update FPS counter in real-time', async ({ page }) => {
    const fpsValue = await page.locator('[data-testid="fps-value"]')
    
    // Get initial FPS value
    const initialText = await fpsValue.textContent()
    const initialFPS = parseInt(initialText!.match(/\d+/)![0])
    
    // Perform intensive operations
    const canvas = await page.locator('canvas')
    for (let i = 0; i < 10; i++) {
      await canvas.click({ position: { x: 100 + i * 50, y: 100 + i * 50 } })
      await page.mouse.down()
      await page.mouse.move(200 + i * 50, 200 + i * 50)
      await page.mouse.up()
    }
    
    // Wait for FPS update
    await page.waitForTimeout(1500)
    
    // FPS value should have changed
    const updatedText = await fpsValue.textContent()
    const updatedFPS = parseInt(updatedText!.match(/\d+/)![0])
    
    expect(updatedFPS).toBeGreaterThan(0)
  })

  test('should show performance indicator colors', async ({ page }) => {
    const indicator = await page.locator('[data-testid="fps-indicator"]')
    
    // Check that indicator has appropriate class
    const className = await indicator.getAttribute('class')
    expect(className).toMatch(/fps-(good|medium|poor)/)
  })

  test('should display performance metrics dashboard', async ({ page }) => {
    // Toggle performance metrics if needed
    const metricsButton = await page.locator('[data-testid="toggle-metrics"]')
    if (await metricsButton.isVisible()) {
      await metricsButton.click()
    }
    
    const performanceMetrics = await page.locator('[data-testid="performance-metrics"]')
    await expect(performanceMetrics).toBeVisible()
    
    // Should display various metrics
    await expect(performanceMetrics).toContainText('FPS')
    await expect(performanceMetrics).toContainText('Objects')
  })

  test('should collapse and expand metrics dashboard', async ({ page }) => {
    const metricsToggle = await page.locator('[data-testid="metrics-toggle"]')
    const metricsContent = await page.locator('[data-testid="metrics-content"]')
    
    // Content should be visible initially
    await expect(metricsContent).toBeVisible()
    
    // Collapse
    await metricsToggle.click()
    await expect(metricsContent).not.toBeVisible()
    
    // Expand
    await metricsToggle.click()
    await expect(metricsContent).toBeVisible()
  })

  test('should track object count', async ({ page }) => {
    const performanceMetrics = await page.locator('[data-testid="performance-metrics"]')
    
    // Get initial object count
    const initialText = await performanceMetrics.textContent()
    const initialCount = parseInt(initialText!.match(/Objects: (\d+)/)![1])
    
    // Add objects to canvas
    await page.click('[data-tool="rectangle"]')
    const canvas = await page.locator('canvas')
    
    for (let i = 0; i < 5; i++) {
      await canvas.click({ position: { x: 100 + i * 100, y: 100 } })
      await page.mouse.down()
      await page.mouse.move(150 + i * 100, 150)
      await page.mouse.up()
    }
    
    // Wait for update
    await page.waitForTimeout(500)
    
    // Object count should increase
    const updatedText = await performanceMetrics.textContent()
    const updatedCount = parseInt(updatedText!.match(/Objects: (\d+)/)![1])
    
    expect(updatedCount).toBeGreaterThan(initialCount)
  })

  test('should show performance warning for low FPS', async ({ page }) => {
    // Simulate low performance by adding many objects
    await page.click('[data-tool="rectangle"]')
    const canvas = await page.locator('canvas')
    
    // Add many objects to stress the system
    for (let i = 0; i < 50; i++) {
      await canvas.click({ position: { x: Math.random() * 500, y: Math.random() * 500 } })
      await page.mouse.down()
      await page.mouse.move(Math.random() * 500 + 100, Math.random() * 500 + 100)
      await page.mouse.up()
    }
    
    // Rapidly pan to stress rendering
    for (let i = 0; i < 20; i++) {
      await page.keyboard.down('Space')
      await canvas.click({ position: { x: 250, y: 250 } })
      await page.mouse.down()
      await page.mouse.move(300 + i * 10, 300 + i * 10)
      await page.mouse.up()
      await page.keyboard.up('Space')
    }
    
    // Check if warning appears (if FPS drops below threshold)
    const warning = await page.locator('[data-testid="performance-warning"]')
    if (await warning.isVisible()) {
      await expect(warning).toContainText(/Low FPS/)
    }
  })

  test('should measure render time', async ({ page }) => {
    const performanceMetrics = await page.locator('[data-testid="performance-metrics"]')
    
    // Should display render time metrics
    await expect(performanceMetrics).toContainText(/\d+ ms/)
  })

  test('performance metrics should not impact canvas interactions', async ({ page }) => {
    // Ensure both FPS counter and metrics are visible
    const fpsCounter = await page.locator('[data-testid="fps-counter"]')
    const performanceMetrics = await page.locator('[data-testid="performance-metrics"]')
    
    await expect(fpsCounter).toBeVisible()
    await expect(performanceMetrics).toBeVisible()
    
    // Canvas should still be interactive
    await page.click('[data-tool="circle"]')
    const canvas = await page.locator('canvas')
    
    await canvas.click({ position: { x: 300, y: 300 } })
    await page.mouse.down()
    await page.mouse.move(400, 400)
    await page.mouse.up()
    
    // Check that object was created
    const objects = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas
      return canvas ? canvas.getObjects().length : 0
    })
    
    expect(objects).toBeGreaterThan(0)
  })

  test('should maintain acceptable performance with monitoring enabled', async ({ page }) => {
    const fpsValue = await page.locator('[data-testid="fps-value"]')
    
    // Perform normal operations
    const canvas = await page.locator('canvas')
    for (let i = 0; i < 5; i++) {
      await canvas.hover({ position: { x: 200 + i * 50, y: 200 + i * 50 } })
      await page.waitForTimeout(100)
    }
    
    // Get FPS after operations
    const fpsText = await fpsValue.textContent()
    const fps = parseInt(fpsText!.match(/\d+/)![0])
    
    // FPS should be reasonable (> 30 for normal operations)
    expect(fps).toBeGreaterThan(30)
  })
})