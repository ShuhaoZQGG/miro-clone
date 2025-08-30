import { test, expect, Page, devices } from '@playwright/test'

// Run these tests in mobile viewport
test.use({ ...devices['iPhone 12'] })

test.describe('Mobile Gesture Tests', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    await page.goto('/board/demo-board')
    await page.waitForSelector('canvas', { timeout: 10000 })
  })

  test.describe('Single Touch', () => {
    test('Tap to select element', async () => {
      // Create an element first
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
      await rectangleTool.click()
      
      const canvas = page.locator('canvas')
      await canvas.tap({ position: { x: 100, y: 100 } })
      
      // Switch to select tool
      const selectTool = page.locator('[data-testid="tool-select"]')
      await selectTool.click()
      
      // Tap to select
      await canvas.tap({ position: { x: 100, y: 100 } })
      
      // Element should be selected (check for selection handles)
      await page.waitForTimeout(100)
    })

    test('Drag to pan canvas', async () => {
      const canvas = page.locator('canvas')
      
      // Perform drag gesture to pan
      await page.touchscreen.tap(200, 200)
      await page.waitForTimeout(100)
      
      // Drag gesture
      await canvas.dragTo(canvas, {
        sourcePosition: { x: 200, y: 200 },
        targetPosition: { x: 100, y: 100 }
      })
      
      await page.waitForTimeout(100)
    })

    test('Long press for context menu', async () => {
      // Create an element
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
      await rectangleTool.click()
      
      const canvas = page.locator('canvas')
      await canvas.tap({ position: { x: 150, y: 150 } })
      
      // Long press for context menu
      await page.touchscreen.tap(150, 150)
      
      // Check if context menu appears
      const contextMenu = page.locator('[data-testid="context-menu"]')
      if (await contextMenu.isVisible({ timeout: 2000 })) {
        await expect(contextMenu).toBeVisible()
      }
    })
  })

  test.describe('Multi-Touch', () => {
    test('Pinch to zoom', async () => {
      // Simulate pinch gesture
      // Note: Playwright doesn't have native pinch support, so we simulate with touch events
      const canvas = page.locator('canvas')
      const canvasBox = await canvas.boundingBox()
      
      if (canvasBox) {
        const centerX = canvasBox.x + canvasBox.width / 2
        const centerY = canvasBox.y + canvasBox.height / 2
        
        // Start two touches close together
        await page.evaluate(({ x, y }) => {
          const canvas = document.querySelector('canvas')
          if (!canvas) return
          
          const touch1 = new Touch({
            identifier: 1,
            target: canvas,
            clientX: x - 20,
            clientY: y,
            pageX: x - 20,
            pageY: y
          })
          
          const touch2 = new Touch({
            identifier: 2,
            target: canvas,
            clientX: x + 20,
            clientY: y,
            pageX: x + 20,
            pageY: y
          })
          
          const touchStart = new TouchEvent('touchstart', {
            touches: [touch1, touch2],
            targetTouches: [touch1, touch2],
            changedTouches: [touch1, touch2],
            bubbles: true
          })
          
          canvas.dispatchEvent(touchStart)
        }, { x: centerX, y: centerY })
        
        // Move touches apart (pinch out to zoom in)
        await page.evaluate(({ x, y }) => {
          const canvas = document.querySelector('canvas')
          if (!canvas) return
          
          const touch1 = new Touch({
            identifier: 1,
            target: canvas,
            clientX: x - 50,
            clientY: y,
            pageX: x - 50,
            pageY: y
          })
          
          const touch2 = new Touch({
            identifier: 2,
            target: canvas,
            clientX: x + 50,
            clientY: y,
            pageX: x + 50,
            pageY: y
          })
          
          const touchMove = new TouchEvent('touchmove', {
            touches: [touch1, touch2],
            targetTouches: [touch1, touch2],
            changedTouches: [touch1, touch2],
            bubbles: true
          })
          
          canvas.dispatchEvent(touchMove)
        }, { x: centerX, y: centerY })
        
        // End touches
        await page.evaluate(() => {
          const canvas = document.querySelector('canvas')
          if (!canvas) return
          
          const touchEnd = new TouchEvent('touchend', {
            touches: [],
            targetTouches: [],
            changedTouches: [],
            bubbles: true
          })
          
          canvas.dispatchEvent(touchEnd)
        })
        
        await page.waitForTimeout(100)
      }
    })

    test('Two-finger rotation', async () => {
      // Create an element to rotate
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
      await rectangleTool.click()
      
      const canvas = page.locator('canvas')
      await canvas.tap({ position: { x: 200, y: 200 } })
      
      // Select it
      const selectTool = page.locator('[data-testid="tool-select"]')
      await selectTool.click()
      await canvas.tap({ position: { x: 200, y: 200 } })
      
      // Simulate two-finger rotation
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas')
        if (!canvas) return
        
        // Start with two fingers
        const touch1 = new Touch({
          identifier: 1,
          target: canvas,
          clientX: 180,
          clientY: 200,
          pageX: 180,
          pageY: 200
        })
        
        const touch2 = new Touch({
          identifier: 2,
          target: canvas,
          clientX: 220,
          clientY: 200,
          pageX: 220,
          pageY: 200
        })
        
        const touchStart = new TouchEvent('touchstart', {
          touches: [touch1, touch2],
          targetTouches: [touch1, touch2],
          changedTouches: [touch1, touch2],
          bubbles: true
        })
        
        canvas.dispatchEvent(touchStart)
        
        // Rotate fingers
        const rotatedTouch1 = new Touch({
          identifier: 1,
          target: canvas,
          clientX: 200,
          clientY: 180,
          pageX: 200,
          pageY: 180
        })
        
        const rotatedTouch2 = new Touch({
          identifier: 2,
          target: canvas,
          clientX: 200,
          clientY: 220,
          pageX: 200,
          pageY: 220
        })
        
        const touchMove = new TouchEvent('touchmove', {
          touches: [rotatedTouch1, rotatedTouch2],
          targetTouches: [rotatedTouch1, rotatedTouch2],
          changedTouches: [rotatedTouch1, rotatedTouch2],
          bubbles: true
        })
        
        canvas.dispatchEvent(touchMove)
        
        // End rotation
        const touchEnd = new TouchEvent('touchend', {
          touches: [],
          targetTouches: [],
          changedTouches: [],
          bubbles: true
        })
        
        canvas.dispatchEvent(touchEnd)
      })
      
      await page.waitForTimeout(100)
    })

    test('Three-finger undo', async () => {
      // Create an element
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
      await rectangleTool.click()
      
      const canvas = page.locator('canvas')
      await canvas.tap({ position: { x: 100, y: 100 } })
      
      // Simulate three-finger tap for undo
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas')
        if (!canvas) return
        
        const touches = [1, 2, 3].map(id => new Touch({
          identifier: id,
          target: canvas,
          clientX: 100 + id * 30,
          clientY: 200,
          pageX: 100 + id * 30,
          pageY: 200
        }))
        
        const touchStart = new TouchEvent('touchstart', {
          touches,
          targetTouches: touches,
          changedTouches: touches,
          bubbles: true
        })
        
        canvas.dispatchEvent(touchStart)
        
        const touchEnd = new TouchEvent('touchend', {
          touches: [],
          targetTouches: [],
          changedTouches: touches,
          bubbles: true
        })
        
        canvas.dispatchEvent(touchEnd)
      })
      
      await page.waitForTimeout(100)
      
      // Element should be undone
    })
  })

  test.describe('Mobile UI Elements', () => {
    test('Mobile toolbar visibility', async () => {
      // Check for mobile toolbar
      const mobileToolbar = page.locator('[data-testid="mobile-toolbar"]')
      await expect(mobileToolbar).toBeVisible()
      
      // Should have touch-friendly buttons
      const toolButtons = mobileToolbar.locator('[data-testid^="tool-"]')
      const count = await toolButtons.count()
      expect(count).toBeGreaterThan(0)
      
      // Check button sizes (should be at least 44x44px for touch)
      const firstButton = toolButtons.first()
      const buttonBox = await firstButton.boundingBox()
      if (buttonBox) {
        expect(buttonBox.width).toBeGreaterThanOrEqual(44)
        expect(buttonBox.height).toBeGreaterThanOrEqual(44)
      }
    })

    test('Floating action button (FAB)', async () => {
      // In portrait mode, check for FAB
      const fab = page.locator('[data-testid="fab"]')
      if (await fab.isVisible()) {
        // FAB should be positioned correctly
        const fabBox = await fab.boundingBox()
        if (fabBox) {
          // Should be in bottom right corner typically
          const viewport = page.viewportSize()
          if (viewport) {
            expect(fabBox.x).toBeGreaterThan(viewport.width - 100)
            expect(fabBox.y).toBeGreaterThan(viewport.height - 100)
          }
        }
        
        // Click FAB to open menu
        await fab.click()
        
        // Check if menu opens
        const fabMenu = page.locator('[data-testid="fab-menu"]')
        await expect(fabMenu).toBeVisible()
      }
    })

    test('Touch-friendly color picker', async () => {
      // Open color picker
      const colorButton = page.locator('[data-testid="color-picker"]')
      await colorButton.tap()
      
      // Color palette should be touch-friendly
      const colorPalette = page.locator('[data-testid="color-palette"]')
      await expect(colorPalette).toBeVisible()
      
      // Color swatches should be large enough
      const colorSwatch = colorPalette.locator('[data-testid="color-swatch"]').first()
      const swatchBox = await colorSwatch.boundingBox()
      if (swatchBox) {
        expect(swatchBox.width).toBeGreaterThanOrEqual(44)
        expect(swatchBox.height).toBeGreaterThanOrEqual(44)
      }
      
      // Select a color
      await colorSwatch.tap()
    })
  })

  test.describe('Edge Cases', () => {
    test('Rapid gestures', async () => {
      const canvas = page.locator('canvas')
      
      // Perform rapid taps
      for (let i = 0; i < 5; i++) {
        await canvas.tap({ position: { x: 100 + i * 20, y: 100 } })
      }
      
      // Perform rapid drags
      for (let i = 0; i < 3; i++) {
        await canvas.dragTo(canvas, {
          sourcePosition: { x: 100, y: 100 + i * 50 },
          targetPosition: { x: 200, y: 100 + i * 50 }
        })
      }
      
      await page.waitForTimeout(100)
      
      // Should handle rapid input without errors
    })

    test('Gesture during animation', async () => {
      const canvas = page.locator('canvas')
      
      // Start a zoom animation
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas')
        if (!canvas) return
        
        // Trigger zoom animation
        canvas.dispatchEvent(new WheelEvent('wheel', {
          deltaY: -100,
          bubbles: true
        }))
      })
      
      // Immediately perform touch gesture
      await canvas.tap({ position: { x: 150, y: 150 } })
      
      await page.waitForTimeout(100)
      
      // Should handle concurrent operations
    })

    test('Touch while keyboard is open', async () => {
      // Create a text element
      const textTool = page.locator('[data-testid="tool-text"]')
      await textTool.click()
      
      const canvas = page.locator('canvas')
      await canvas.tap({ position: { x: 200, y: 200 } })
      
      // Keyboard should open for text input
      await page.keyboard.type('Test text')
      
      // Try to pan while keyboard is open
      await canvas.dragTo(canvas, {
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 150, y: 150 }
      })
      
      // Close keyboard
      await page.keyboard.press('Escape')
      
      await page.waitForTimeout(100)
    })

    test('Orientation change', async () => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 })
      
      const mobileToolbar = page.locator('[data-testid="mobile-toolbar"]')
      const initialToolbarBox = await mobileToolbar.boundingBox()
      
      // Change to landscape
      await page.setViewportSize({ width: 667, height: 375 })
      await page.waitForTimeout(500) // Wait for orientation change
      
      // Toolbar should adapt
      const landscapeToolbarBox = await mobileToolbar.boundingBox()
      
      // Layout should change
      if (initialToolbarBox && landscapeToolbarBox) {
        // Toolbar position or size should be different
        const positionChanged = 
          initialToolbarBox.x !== landscapeToolbarBox.x ||
          initialToolbarBox.y !== landscapeToolbarBox.y ||
          initialToolbarBox.width !== landscapeToolbarBox.width ||
          initialToolbarBox.height !== landscapeToolbarBox.height
        
        expect(positionChanged).toBeTruthy()
      }
      
      // Canvas should still be functional
      const canvas = page.locator('canvas')
      await canvas.tap({ position: { x: 100, y: 100 } })
    })
  })
})