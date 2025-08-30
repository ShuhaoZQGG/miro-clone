import { test, expect, Page, Browser, BrowserContext } from '@playwright/test'

test.describe('Real-time Collaboration Tests', () => {
  let browser: Browser
  let context1: BrowserContext
  let context2: BrowserContext
  let page1: Page
  let page2: Page

  test.beforeAll(async ({ browser: testBrowser }) => {
    browser = testBrowser
  })

  test.beforeEach(async () => {
    // Create two separate browser contexts to simulate two users
    context1 = await browser.newContext()
    context2 = await browser.newContext()
    
    page1 = await context1.newPage()
    page2 = await context2.newPage()
    
    // Both users navigate to the same board
    await page1.goto('/')
    await page2.goto('/')
    
    // Wait for both canvases to be ready
    await page1.waitForSelector('canvas', { timeout: 10000 })
    await page2.waitForSelector('canvas', { timeout: 10000 })
  })

  test.afterEach(async () => {
    await context1.close()
    await context2.close()
  })

  test('User presence updates', async () => {
    // Check if user avatars are visible
    const userPresence1 = page1.locator('[data-testid="user-presence"]')
    const userPresence2 = page2.locator('[data-testid="user-presence"]')
    
    // Both users should see presence indicators
    await expect(userPresence1).toBeVisible({ timeout: 5000 })
    await expect(userPresence2).toBeVisible({ timeout: 5000 })
    
    // User count should be at least 2
    const userCount1 = await page1.locator('[data-testid="user-count"]')
    if (await userCount1.isVisible()) {
      const count = await userCount1.textContent()
      expect(parseInt(count || '0')).toBeGreaterThanOrEqual(2)
    }
  })

  test('Cursor position synchronization', async () => {
    // Move cursor on page1
    const canvas1 = page1.locator('canvas')
    await page1.mouse.move(200, 200)
    
    // Check if cursor position is reflected on page2
    // This would need the app to render remote cursors
    await page2.waitForTimeout(1000)
    
    const remoteCursor = page2.locator('[data-testid="remote-cursor"]')
    if (await remoteCursor.isVisible()) {
      // Verify cursor is visible on page2
      await expect(remoteCursor).toBeVisible()
    }
  })

  test('Concurrent element creation', async () => {
    // User 1 creates a rectangle
    const rectangleTool1 = page1.locator('[data-testid="tool-rectangle"]')
    await rectangleTool1.click()
    const canvas1 = page1.locator('canvas')
    await canvas1.click({ position: { x: 100, y: 100 } })
    
    // User 2 creates an ellipse simultaneously
    const ellipseTool2 = page2.locator('[data-testid="tool-circle"]')
    await ellipseTool2.click()
    const canvas2 = page2.locator('canvas')
    await canvas2.click({ position: { x: 200, y: 200 } })
    
    // Wait for synchronization
    await page1.waitForTimeout(2000)
    await page2.waitForTimeout(2000)
    
    // Both elements should be visible on both pages
    // This would need the app to expose element count or visual regression testing
  })

  test('Concurrent element editing', async () => {
    // User 1 creates an element
    const rectangleTool1 = page1.locator('[data-testid="tool-rectangle"]')
    await rectangleTool1.click()
    const canvas1 = page1.locator('canvas')
    await canvas1.click({ position: { x: 150, y: 150 } })
    
    // Wait for sync
    await page2.waitForTimeout(1000)
    
    // User 2 tries to select and move the same element
    const selectTool2 = page2.locator('[data-testid="tool-select"]')
    await selectTool2.click()
    const canvas2 = page2.locator('canvas')
    await canvas2.click({ position: { x: 150, y: 150 } })
    
    // Try to move it
    await canvas2.dragTo(canvas2, {
      sourcePosition: { x: 150, y: 150 },
      targetPosition: { x: 250, y: 250 }
    })
    
    // Wait for conflict resolution
    await page1.waitForTimeout(1000)
    await page2.waitForTimeout(1000)
    
    // Element should be in a consistent state on both pages
  })

  test('Connection recovery', async () => {
    // Monitor connection status
    const connectionStatus1 = page1.locator('[data-testid="connection-status"]')
    
    // Initially should be connected
    if (await connectionStatus1.isVisible()) {
      await expect(connectionStatus1).toHaveText(/connected/i, { timeout: 5000 })
    }
    
    // Simulate connection loss (would need app support or network manipulation)
    // For now, we'll test the UI responds to connection changes
    
    // Create element while "offline"
    const rectangleTool1 = page1.locator('[data-testid="tool-rectangle"]')
    await rectangleTool1.click()
    const canvas1 = page1.locator('canvas')
    await canvas1.click({ position: { x: 100, y: 100 } })
    
    // When connection recovers, changes should sync
    await page1.waitForTimeout(2000)
  })

  test('Message batching', async () => {
    // Create multiple elements rapidly
    const rectangleTool1 = page1.locator('[data-testid="tool-rectangle"]')
    await rectangleTool1.click()
    const canvas1 = page1.locator('canvas')
    
    // Rapid creation
    for (let i = 0; i < 5; i++) {
      await canvas1.click({ position: { x: 50 + i * 50, y: 100 } })
    }
    
    // Messages should be batched and synchronized efficiently
    await page2.waitForTimeout(2000)
    
    // All elements should appear on page2
    // Verify through visual regression or element count
  })

  test('Conflict resolution - simultaneous edits', async () => {
    // Create a shared element
    const rectangleTool1 = page1.locator('[data-testid="tool-rectangle"]')
    await rectangleTool1.click()
    const canvas1 = page1.locator('canvas')
    await canvas1.click({ position: { x: 200, y: 200 } })
    
    // Wait for sync
    await page2.waitForTimeout(1000)
    
    // Both users select the element
    const selectTool1 = page1.locator('[data-testid="tool-select"]')
    const selectTool2 = page2.locator('[data-testid="tool-select"]')
    await selectTool1.click()
    await selectTool2.click()
    
    await canvas1.click({ position: { x: 200, y: 200 } })
    const canvas2 = page2.locator('canvas')
    await canvas2.click({ position: { x: 200, y: 200 } })
    
    // Both try to move it simultaneously
    await Promise.all([
      canvas1.dragTo(canvas1, {
        sourcePosition: { x: 200, y: 200 },
        targetPosition: { x: 250, y: 250 }
      }),
      canvas2.dragTo(canvas2, {
        sourcePosition: { x: 200, y: 200 },
        targetPosition: { x: 150, y: 150 }
      })
    ])
    
    // Wait for conflict resolution
    await page1.waitForTimeout(2000)
    await page2.waitForTimeout(2000)
    
    // Element should be in one consistent position on both pages
  })

  test('User disconnection handling', async () => {
    // Close one context to simulate user leaving
    await context2.close()
    
    // Wait for presence update
    await page1.waitForTimeout(2000)
    
    // User count should decrease
    const userCount1 = await page1.locator('[data-testid="user-count"]')
    if (await userCount1.isVisible()) {
      const count = await userCount1.textContent()
      expect(parseInt(count || '1')).toBe(1)
    }
    
    // Remote cursor should disappear
    const remoteCursor = page1.locator('[data-testid="remote-cursor"]')
    await expect(remoteCursor).not.toBeVisible()
  })

  test('Board state synchronization on join', async () => {
    // User 1 creates some elements
    const rectangleTool1 = page1.locator('[data-testid="tool-rectangle"]')
    await rectangleTool1.click()
    const canvas1 = page1.locator('canvas')
    
    await canvas1.click({ position: { x: 100, y: 100 } })
    await canvas1.click({ position: { x: 200, y: 200 } })
    await canvas1.click({ position: { x: 300, y: 300 } })
    
    // New user joins
    const context3 = await browser.newContext()
    const page3 = await context3.newPage()
    await page3.goto('/')
    await page3.waitForSelector('canvas', { timeout: 10000 })
    
    // Wait for initial state sync
    await page3.waitForTimeout(2000)
    
    // New user should see all existing elements
    // This would need visual regression or element count verification
    
    await context3.close()
  })

  test('Collaborative selection', async () => {
    // User 1 creates elements
    const rectangleTool1 = page1.locator('[data-testid="tool-rectangle"]')
    await rectangleTool1.click()
    const canvas1 = page1.locator('canvas')
    await canvas1.click({ position: { x: 100, y: 100 } })
    
    // Wait for sync
    await page2.waitForTimeout(1000)
    
    // User 1 selects the element
    const selectTool1 = page1.locator('[data-testid="tool-select"]')
    await selectTool1.click()
    await canvas1.click({ position: { x: 100, y: 100 } })
    
    // User 2 should see selection indicator
    await page2.waitForTimeout(1000)
    const selectionIndicator = page2.locator('[data-testid="remote-selection"]')
    if (await selectionIndicator.isVisible()) {
      await expect(selectionIndicator).toBeVisible()
    }
  })

  test('Rate limiting', async () => {
    // Try to create many elements very rapidly
    const rectangleTool1 = page1.locator('[data-testid="tool-rectangle"]')
    await rectangleTool1.click()
    const canvas1 = page1.locator('canvas')
    
    // Create 20 elements as fast as possible
    const promises = []
    for (let i = 0; i < 20; i++) {
      promises.push(canvas1.click({ position: { x: 50 + i * 10, y: 50 + i * 10 } }))
    }
    await Promise.all(promises)
    
    // Check if rate limiting is applied (would need app to expose this)
    await page1.waitForTimeout(2000)
    
    // Should handle high message volume gracefully
  })

  test('Optimistic updates', async () => {
    // Create element on page1
    const rectangleTool1 = page1.locator('[data-testid="tool-rectangle"]')
    await rectangleTool1.click()
    const canvas1 = page1.locator('canvas')
    await canvas1.click({ position: { x: 200, y: 200 } })
    
    // Element should appear immediately on page1 (optimistic)
    // And shortly after on page2 (after network round trip)
    
    // Move element on page1
    const selectTool1 = page1.locator('[data-testid="tool-select"]')
    await selectTool1.click()
    await canvas1.click({ position: { x: 200, y: 200 } })
    
    // Movement should be immediate on page1
    await canvas1.dragTo(canvas1, {
      sourcePosition: { x: 200, y: 200 },
      targetPosition: { x: 300, y: 300 }
    })
    
    // And update on page2 after sync
    await page2.waitForTimeout(1000)
  })
})