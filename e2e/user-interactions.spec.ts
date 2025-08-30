import { test, expect, Page } from '@playwright/test'

test.describe('User Interaction Tests', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    await page.goto('/board/demo-board')
    await page.waitForSelector('canvas', { timeout: 10000 })
  })

  test.describe('Drawing Elements', () => {
    test('Rectangle creation', async () => {
      // Select rectangle tool
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
      await rectangleTool.click()
      
      // Draw rectangle on canvas
      const canvas = page.locator('canvas')
      await canvas.click({ position: { x: 100, y: 100 } })
      
      // Verify element was created (would need app to expose element count)
      await page.waitForTimeout(100)
      
      // Try to select the created rectangle
      const selectTool = page.locator('[data-testid="tool-select"]')
      await selectTool.click()
      await canvas.click({ position: { x: 100, y: 100 } })
    })

    test('Ellipse creation', async () => {
      // Select ellipse tool
      const ellipseTool = page.locator('[data-testid="tool-circle"]')
      await ellipseTool.click()
      
      // Draw ellipse on canvas
      const canvas = page.locator('canvas')
      await canvas.click({ position: { x: 200, y: 200 } })
      
      await page.waitForTimeout(100)
    })

    test('Line drawing', async () => {
      // Select line tool
      const lineTool = page.locator('[data-testid="tool-line"]')
      await lineTool.click()
      
      // Draw line on canvas
      const canvas = page.locator('canvas')
      await canvas.dragTo(canvas, {
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 300, y: 300 }
      })
      
      await page.waitForTimeout(100)
    })

    test('Freehand drawing', async () => {
      // Select freehand tool
      const freehandTool = page.locator('[data-testid="tool-freehand"]')
      await freehandTool.click()
      
      // Draw freehand path
      const canvas = page.locator('canvas')
      await page.mouse.move(100, 100)
      await page.mouse.down()
      
      // Create a curved path
      for (let i = 0; i < 10; i++) {
        await page.mouse.move(100 + i * 20, 100 + Math.sin(i) * 50)
      }
      
      await page.mouse.up()
      await page.waitForTimeout(100)
    })

    test('Sticky note creation', async () => {
      // Select sticky note tool
      const stickyNoteTool = page.locator('[data-testid="tool-sticky-note"]')
      await stickyNoteTool.click()
      
      // Create sticky note
      const canvas = page.locator('canvas')
      await canvas.click({ position: { x: 150, y: 150 } })
      
      // Type text in sticky note
      await page.keyboard.type('Test note content')
      await page.keyboard.press('Escape')
      
      await page.waitForTimeout(100)
    })
  })

  test.describe('Selection & Manipulation', () => {
    test('Single selection', async () => {
      // Create an element first
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
      await rectangleTool.click()
      
      const canvas = page.locator('canvas')
      await canvas.click({ position: { x: 100, y: 100 } })
      
      // Select the element
      const selectTool = page.locator('[data-testid="tool-select"]')
      await selectTool.click()
      await canvas.click({ position: { x: 100, y: 100 } })
      
      // Verify selection (would need visual regression or exposed state)
      await page.waitForTimeout(100)
    })

    test('Multi-selection with drag', async () => {
      // Create multiple elements
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
      await rectangleTool.click()
      
      const canvas = page.locator('canvas')
      await canvas.click({ position: { x: 100, y: 100 } })
      await canvas.click({ position: { x: 200, y: 200 } })
      await canvas.click({ position: { x: 300, y: 300 } })
      
      // Select all with drag
      const selectTool = page.locator('[data-testid="tool-select"]')
      await selectTool.click()
      
      await canvas.dragTo(canvas, {
        sourcePosition: { x: 50, y: 50 },
        targetPosition: { x: 350, y: 350 }
      })
      
      await page.waitForTimeout(100)
    })

    test('Multi-selection with Shift+Click', async () => {
      // Create multiple elements
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
      await rectangleTool.click()
      
      const canvas = page.locator('canvas')
      await canvas.click({ position: { x: 100, y: 100 } })
      await canvas.click({ position: { x: 200, y: 200 } })
      
      // Select with Shift
      const selectTool = page.locator('[data-testid="tool-select"]')
      await selectTool.click()
      
      await canvas.click({ position: { x: 100, y: 100 } })
      await page.keyboard.down('Shift')
      await canvas.click({ position: { x: 200, y: 200 } })
      await page.keyboard.up('Shift')
      
      await page.waitForTimeout(100)
    })

    test('Move element', async () => {
      // Create element
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
      await rectangleTool.click()
      
      const canvas = page.locator('canvas')
      await canvas.click({ position: { x: 100, y: 100 } })
      
      // Select and move
      const selectTool = page.locator('[data-testid="tool-select"]')
      await selectTool.click()
      
      await canvas.dragTo(canvas, {
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 }
      })
      
      await page.waitForTimeout(100)
    })

    test('Resize element', async () => {
      // Create element
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
      await rectangleTool.click()
      
      const canvas = page.locator('canvas')
      await canvas.click({ position: { x: 100, y: 100 } })
      
      // Select element
      const selectTool = page.locator('[data-testid="tool-select"]')
      await selectTool.click()
      await canvas.click({ position: { x: 100, y: 100 } })
      
      // Resize (would need to target resize handles)
      // This is a simplified version - real implementation would target handles
      await canvas.dragTo(canvas, {
        sourcePosition: { x: 150, y: 150 },
        targetPosition: { x: 200, y: 200 }
      })
      
      await page.waitForTimeout(100)
    })

    test('Delete elements', async () => {
      // Create element
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
      await rectangleTool.click()
      
      const canvas = page.locator('canvas')
      await canvas.click({ position: { x: 100, y: 100 } })
      
      // Select and delete
      const selectTool = page.locator('[data-testid="tool-select"]')
      await selectTool.click()
      await canvas.click({ position: { x: 100, y: 100 } })
      
      await page.keyboard.press('Delete')
      
      await page.waitForTimeout(100)
    })
  })

  test.describe('Canvas Navigation', () => {
    test('Pan with mouse', async () => {
      const canvas = page.locator('canvas')
      
      // Hold space and drag to pan
      await page.keyboard.down('Space')
      await canvas.dragTo(canvas, {
        sourcePosition: { x: 200, y: 200 },
        targetPosition: { x: 400, y: 400 }
      })
      await page.keyboard.up('Space')
      
      await page.waitForTimeout(100)
    })

    test('Pan with middle mouse button', async () => {
      const canvas = page.locator('canvas')
      
      // Middle mouse drag
      await page.mouse.move(200, 200)
      await page.mouse.down({ button: 'middle' })
      await page.mouse.move(400, 400)
      await page.mouse.up({ button: 'middle' })
      
      await page.waitForTimeout(100)
    })

    test('Zoom with wheel', async () => {
      const canvas = page.locator('canvas')
      const canvasBox = await canvas.boundingBox()
      
      if (canvasBox) {
        // Zoom in
        await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2)
        await page.mouse.wheel(0, -100)
        await page.waitForTimeout(100)
        
        // Zoom out
        await page.mouse.wheel(0, 100)
        await page.waitForTimeout(100)
      }
    })

    test('Zoom with keyboard shortcuts', async () => {
      // Zoom in
      await page.keyboard.press('Control+=')
      await page.waitForTimeout(100)
      
      // Zoom out
      await page.keyboard.press('Control+-')
      await page.waitForTimeout(100)
      
      // Reset zoom
      await page.keyboard.press('Control+0')
      await page.waitForTimeout(100)
    })

    test('Reset view', async () => {
      const canvas = page.locator('canvas')
      
      // Pan and zoom
      await page.keyboard.down('Space')
      await canvas.dragTo(canvas, {
        sourcePosition: { x: 200, y: 200 },
        targetPosition: { x: 400, y: 400 }
      })
      await page.keyboard.up('Space')
      
      await page.keyboard.press('Control+=')
      
      // Reset view
      const resetButton = page.locator('[data-testid="reset-view"]')
      if (await resetButton.isVisible()) {
        await resetButton.click()
      } else {
        await page.keyboard.press('Control+0')
      }
      
      await page.waitForTimeout(100)
    })
  })

  test.describe('Keyboard Shortcuts', () => {
    test('Select all (Ctrl+A)', async () => {
      // Create multiple elements
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
      await rectangleTool.click()
      
      const canvas = page.locator('canvas')
      await canvas.click({ position: { x: 100, y: 100 } })
      await canvas.click({ position: { x: 200, y: 200 } })
      await canvas.click({ position: { x: 300, y: 300 } })
      
      // Select all
      await page.keyboard.press('Control+a')
      
      await page.waitForTimeout(100)
    })

    test('Undo/Redo (Ctrl+Z/Ctrl+Y)', async () => {
      // Create element
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
      await rectangleTool.click()
      
      const canvas = page.locator('canvas')
      await canvas.click({ position: { x: 100, y: 100 } })
      
      // Undo
      await page.keyboard.press('Control+z')
      await page.waitForTimeout(100)
      
      // Redo
      await page.keyboard.press('Control+y')
      await page.waitForTimeout(100)
    })

    test('Copy/Paste (Ctrl+C/Ctrl+V)', async () => {
      // Create and select element
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
      await rectangleTool.click()
      
      const canvas = page.locator('canvas')
      await canvas.click({ position: { x: 100, y: 100 } })
      
      const selectTool = page.locator('[data-testid="tool-select"]')
      await selectTool.click()
      await canvas.click({ position: { x: 100, y: 100 } })
      
      // Copy
      await page.keyboard.press('Control+c')
      
      // Paste
      await page.keyboard.press('Control+v')
      
      await page.waitForTimeout(100)
    })

    test('Escape to deselect', async () => {
      // Create and select element
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
      await rectangleTool.click()
      
      const canvas = page.locator('canvas')
      await canvas.click({ position: { x: 100, y: 100 } })
      
      const selectTool = page.locator('[data-testid="tool-select"]')
      await selectTool.click()
      await canvas.click({ position: { x: 100, y: 100 } })
      
      // Deselect with Escape
      await page.keyboard.press('Escape')
      
      await page.waitForTimeout(100)
    })
  })

  test.describe('Edge Cases', () => {
    test('Rapid tool switching', async () => {
      const tools = [
        '[data-testid="tool-select"]',
        '[data-testid="tool-rectangle"]',
        '[data-testid="tool-circle"]',
        '[data-testid="tool-line"]',
        '[data-testid="tool-freehand"]'
      ]
      
      // Rapidly switch between tools
      for (let i = 0; i < 10; i++) {
        const tool = page.locator(tools[i % tools.length])
        if (await tool.isVisible()) {
          await tool.click()
        }
      }
      
      await page.waitForTimeout(100)
    })

    test('Multiple rapid clicks', async () => {
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
      await rectangleTool.click()
      
      const canvas = page.locator('canvas')
      
      // Rapid clicks
      for (let i = 0; i < 5; i++) {
        await canvas.click({ position: { x: 100 + i * 50, y: 100 + i * 50 } })
      }
      
      await page.waitForTimeout(100)
    })

    test('Large selection area', async () => {
      // Create many elements
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
      await rectangleTool.click()
      
      const canvas = page.locator('canvas')
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          await canvas.click({ position: { x: 50 + i * 50, y: 50 + j * 50 } })
        }
      }
      
      // Select all with large drag
      const selectTool = page.locator('[data-testid="tool-select"]')
      await selectTool.click()
      
      await canvas.dragTo(canvas, {
        sourcePosition: { x: 0, y: 0 },
        targetPosition: { x: 600, y: 600 }
      })
      
      await page.waitForTimeout(100)
    })
  })
})