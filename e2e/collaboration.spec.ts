import { test, expect, Page } from '@playwright/test'

// Mock user credentials for testing
const testUsers = {
  user1: {
    email: 'user1@test.com',
    password: 'TestPass123!',
    token: 'test-jwt-token-user1'
  },
  user2: {
    email: 'user2@test.com',
    password: 'TestPass123!',
    token: 'test-jwt-token-user2'
  }
}

test.describe('Collaboration Features', () => {
  let page1: Page
  let page2: Page
  const boardId = 'test-board-123'

  test.beforeEach(async ({ browser }) => {
    // Create two browser contexts for two users
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    page1 = await context1.newPage()
    page2 = await context2.newPage()
    
    // Mock authentication for both users
    await page1.evaluate((token) => {
      localStorage.setItem('auth_token', token)
    }, testUsers.user1.token)
    
    await page2.evaluate((token) => {
      localStorage.setItem('auth_token', token)
    }, testUsers.user2.token)
  })

  test.afterEach(async () => {
    await page1.close()
    await page2.close()
  })

  test('users can join the same board', async () => {
    // Both users navigate to the same board
    await page1.goto(`/board/${boardId}`)
    await page2.goto(`/board/${boardId}`)
    
    // Wait for WebSocket connection
    await page1.waitForTimeout(1000)
    await page2.waitForTimeout(1000)
    
    // Check that both users see the collaboration indicator
    await expect(page1.locator('[data-testid="connection-status"]')).toBeVisible()
    await expect(page2.locator('[data-testid="connection-status"]')).toBeVisible()
    
    // Check that user count is updated
    await expect(page1.locator('[data-testid="user-count"]')).toContainText('2')
    await expect(page2.locator('[data-testid="user-count"]')).toContainText('2')
  })

  test('cursor positions are synchronized', async () => {
    await page1.goto(`/board/${boardId}`)
    await page2.goto(`/board/${boardId}`)
    await page1.waitForTimeout(1000)
    
    // User 1 moves cursor
    const canvas1 = page1.locator('[data-testid="canvas"]')
    await canvas1.hover({ position: { x: 100, y: 100 } })
    
    // User 2 should see User 1's cursor
    await page2.waitForTimeout(500)
    const user1Cursor = page2.locator('[data-testid="remote-cursor-user1"]')
    await expect(user1Cursor).toBeVisible()
    
    // Verify cursor position (approximate due to transformations)
    const cursorBox = await user1Cursor.boundingBox()
    expect(cursorBox?.x).toBeCloseTo(100, -1)
    expect(cursorBox?.y).toBeCloseTo(100, -1)
  })

  test('element creation is synchronized', async () => {
    await page1.goto(`/board/${boardId}`)
    await page2.goto(`/board/${boardId}`)
    await page1.waitForTimeout(1000)
    
    // User 1 creates a sticky note
    await page1.click('[data-testid="tool-sticky-note"]')
    const canvas1 = page1.locator('[data-testid="canvas"]')
    await canvas1.click({ position: { x: 200, y: 200 } })
    
    // Type text in the sticky note
    await page1.keyboard.type('Hello from User 1')
    await page1.keyboard.press('Escape')
    
    // User 2 should see the sticky note
    await page2.waitForTimeout(500)
    const stickyNote = page2.locator('text="Hello from User 1"')
    await expect(stickyNote).toBeVisible()
  })

  test('element updates are synchronized', async () => {
    await page1.goto(`/board/${boardId}`)
    await page2.goto(`/board/${boardId}`)
    await page1.waitForTimeout(1000)
    
    // User 1 creates a rectangle
    await page1.click('[data-testid="tool-rectangle"]')
    const canvas1 = page1.locator('[data-testid="canvas"]')
    await canvas1.click({ position: { x: 150, y: 150 } })
    await canvas1.mouse.down()
    await canvas1.mouse.move(250, 250)
    await canvas1.mouse.up()
    
    await page1.waitForTimeout(500)
    
    // User 1 selects and moves the rectangle
    await page1.click('[data-testid="tool-select"]')
    await canvas1.click({ position: { x: 200, y: 200 } })
    await canvas1.mouse.down()
    await canvas1.mouse.move(300, 300)
    await canvas1.mouse.up()
    
    // User 2 should see the updated position
    await page2.waitForTimeout(500)
    const rectangle = page2.locator('[data-testid^="element-"]').first()
    const box = await rectangle.boundingBox()
    expect(box?.x).toBeGreaterThan(250)
    expect(box?.y).toBeGreaterThan(250)
  })

  test('element deletion is synchronized', async () => {
    await page1.goto(`/board/${boardId}`)
    await page2.goto(`/board/${boardId}`)
    await page1.waitForTimeout(1000)
    
    // User 1 creates a circle
    await page1.click('[data-testid="tool-circle"]')
    const canvas1 = page1.locator('[data-testid="canvas"]')
    await canvas1.click({ position: { x: 200, y: 200 } })
    await canvas1.mouse.down()
    await canvas1.mouse.move(300, 300)
    await canvas1.mouse.up()
    
    await page1.waitForTimeout(500)
    
    // Verify both users see the circle
    const circle1 = page1.locator('[data-testid^="element-"]').first()
    const circle2 = page2.locator('[data-testid^="element-"]').first()
    await expect(circle1).toBeVisible()
    await expect(circle2).toBeVisible()
    
    // User 1 deletes the circle
    await page1.click('[data-testid="tool-select"]')
    await canvas1.click({ position: { x: 250, y: 250 } })
    await page1.keyboard.press('Delete')
    
    // Both users should not see the circle anymore
    await page1.waitForTimeout(500)
    await expect(circle1).not.toBeVisible()
    await expect(circle2).not.toBeVisible()
  })

  test('handles disconnection and reconnection', async () => {
    await page1.goto(`/board/${boardId}`)
    await page1.waitForTimeout(1000)
    
    // Check initial connection
    const connectionStatus = page1.locator('[data-testid="connection-status"]')
    await expect(connectionStatus).toHaveAttribute('data-connected', 'true')
    
    // Simulate network disconnection
    await page1.context().setOffline(true)
    await page1.waitForTimeout(2000)
    
    // Check disconnected status
    await expect(connectionStatus).toHaveAttribute('data-connected', 'false')
    
    // Simulate network reconnection
    await page1.context().setOffline(false)
    await page1.waitForTimeout(3000)
    
    // Check reconnected status
    await expect(connectionStatus).toHaveAttribute('data-connected', 'true')
  })

  test('rate limiting prevents spam', async () => {
    await page1.goto(`/board/${boardId}`)
    await page1.waitForTimeout(1000)
    
    // Try to send many cursor updates rapidly
    const canvas = page1.locator('[data-testid="canvas"]')
    
    // Move cursor 50 times very quickly (exceeding rate limit)
    for (let i = 0; i < 50; i++) {
      await canvas.hover({ position: { x: i * 5, y: i * 5 } })
    }
    
    // Listen for rate limit error
    const errorMessage = await page1.waitForEvent('console', {
      predicate: msg => msg.text().includes('rate_limit'),
      timeout: 5000
    }).catch(() => null)
    
    // Should have received a rate limit error
    expect(errorMessage).toBeTruthy()
  })

  test('authentication is required for WebSocket connection', async () => {
    // Clear auth token
    await page1.evaluate(() => {
      localStorage.removeItem('auth_token')
    })
    
    // Try to connect without authentication
    await page1.goto(`/board/${boardId}`)
    await page1.waitForTimeout(2000)
    
    // Should show authentication error or redirect to login
    const authError = page1.locator('[data-testid="auth-error"]')
    const loginPage = page1.url().includes('/login')
    
    expect(await authError.isVisible() || loginPage).toBeTruthy()
  })

  test('handles concurrent operations without conflicts', async () => {
    await page1.goto(`/board/${boardId}`)
    await page2.goto(`/board/${boardId}`)
    await page1.waitForTimeout(1000)
    
    // Both users create elements simultaneously
    const createPromises = [
      (async () => {
        await page1.click('[data-testid="tool-rectangle"]')
        const canvas1 = page1.locator('[data-testid="canvas"]')
        await canvas1.click({ position: { x: 100, y: 100 } })
        await canvas1.mouse.down()
        await canvas1.mouse.move(200, 200)
        await canvas1.mouse.up()
      })(),
      (async () => {
        await page2.click('[data-testid="tool-circle"]')
        const canvas2 = page2.locator('[data-testid="canvas"]')
        await canvas2.click({ position: { x: 300, y: 300 } })
        await canvas2.mouse.down()
        await canvas2.mouse.move(400, 400)
        await canvas2.mouse.up()
      })()
    ]
    
    await Promise.all(createPromises)
    await page1.waitForTimeout(1000)
    
    // Both users should see both elements
    const elements1 = await page1.locator('[data-testid^="element-"]').count()
    const elements2 = await page2.locator('[data-testid^="element-"]').count()
    
    expect(elements1).toBe(2)
    expect(elements2).toBe(2)
  })

  test('shows active collaborators list', async () => {
    await page1.goto(`/board/${boardId}`)
    await page2.goto(`/board/${boardId}`)
    await page1.waitForTimeout(1000)
    
    // Check collaborators panel
    await page1.click('[data-testid="collaborators-toggle"]')
    const collaboratorsList1 = page1.locator('[data-testid="collaborators-list"]')
    await expect(collaboratorsList1).toBeVisible()
    
    // Should show both users
    const user1Avatar = collaboratorsList1.locator('[data-testid="user-avatar-user1"]')
    const user2Avatar = collaboratorsList1.locator('[data-testid="user-avatar-user2"]')
    
    await expect(user1Avatar).toBeVisible()
    await expect(user2Avatar).toBeVisible()
    
    // User 2 leaves
    await page2.close()
    await page1.waitForTimeout(1000)
    
    // User 1 should only see themselves
    await expect(user1Avatar).toBeVisible()
    await expect(user2Avatar).not.toBeVisible()
  })
})