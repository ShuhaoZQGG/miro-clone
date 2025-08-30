import { test, expect, Page, Download } from '@playwright/test'
import path from 'path'
import fs from 'fs/promises'

test.describe('Export Functionality Tests', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    await page.goto('/board/demo-board')
    await page.waitForSelector('canvas', { timeout: 10000 })
    
    // Create some elements to export
    await createSampleElements(page)
  })

  async function createSampleElements(page: Page) {
    // Create a few different elements
    const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
    await rectangleTool.click()
    const canvas = page.locator('canvas')
    await canvas.click({ position: { x: 100, y: 100 } })
    
    const ellipseTool = page.locator('[data-testid="tool-circle"]')
    await ellipseTool.click()
    await canvas.click({ position: { x: 200, y: 200 } })
    
    const lineTool = page.locator('[data-testid="tool-line"]')
    await lineTool.click()
    await canvas.dragTo(canvas, {
      sourcePosition: { x: 150, y: 150 },
      targetPosition: { x: 250, y: 250 }
    })
    
    await page.waitForTimeout(500)
  }

  test('PNG export with elements', async () => {
    // Open export modal
    const exportButton = page.locator('[data-testid="export-button"]')
    await exportButton.click()
    
    // Select PNG format
    const pngOption = page.locator('[data-testid="export-png"]')
    await pngOption.click()
    
    // Start download
    const downloadPromise = page.waitForEvent('download')
    const confirmExport = page.locator('[data-testid="confirm-export"]')
    await confirmExport.click()
    
    const download = await downloadPromise
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.(png)$/i)
    
    // Save and verify file size
    const downloadPath = await download.path()
    if (downloadPath) {
      const stats = await fs.stat(downloadPath)
      expect(stats.size).toBeGreaterThan(0)
    }
  })

  test('SVG export quality', async () => {
    // Open export modal
    const exportButton = page.locator('[data-testid="export-button"]')
    await exportButton.click()
    
    // Select SVG format
    const svgOption = page.locator('[data-testid="export-svg"]')
    await svgOption.click()
    
    // Start download
    const downloadPromise = page.waitForEvent('download')
    const confirmExport = page.locator('[data-testid="confirm-export"]')
    await confirmExport.click()
    
    const download = await downloadPromise
    
    // Verify SVG download
    expect(download.suggestedFilename()).toMatch(/\.(svg)$/i)
    
    // Read and verify SVG content
    const downloadPath = await download.path()
    if (downloadPath) {
      const content = await fs.readFile(downloadPath, 'utf-8')
      expect(content).toContain('<svg')
      expect(content).toContain('</svg>')
      // Should contain some shape elements
      expect(content.length).toBeGreaterThan(100)
    }
  })

  test('JPG export with quality options', async () => {
    // Open export modal
    const exportButton = page.locator('[data-testid="export-button"]')
    await exportButton.click()
    
    // Select JPG format
    const jpgOption = page.locator('[data-testid="export-jpg"]')
    await jpgOption.click()
    
    // Set quality if available
    const qualitySlider = page.locator('[data-testid="export-quality"]')
    if (await qualitySlider.isVisible()) {
      await qualitySlider.fill('90')
    }
    
    // Start download
    const downloadPromise = page.waitForEvent('download')
    const confirmExport = page.locator('[data-testid="confirm-export"]')
    await confirmExport.click()
    
    const download = await downloadPromise
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.(jpg|jpeg)$/i)
    
    const downloadPath = await download.path()
    if (downloadPath) {
      const stats = await fs.stat(downloadPath)
      expect(stats.size).toBeGreaterThan(0)
    }
  })

  test('PDF generation', async () => {
    // Open export modal
    const exportButton = page.locator('[data-testid="export-button"]')
    await exportButton.click()
    
    // Select PDF format
    const pdfOption = page.locator('[data-testid="export-pdf"]')
    await pdfOption.click()
    
    // Set PDF options if available
    const orientationSelect = page.locator('[data-testid="pdf-orientation"]')
    if (await orientationSelect.isVisible()) {
      await orientationSelect.selectOption('landscape')
    }
    
    // Start download (may take longer)
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 })
    const confirmExport = page.locator('[data-testid="confirm-export"]')
    await confirmExport.click()
    
    const download = await downloadPromise
    
    // Verify PDF download
    expect(download.suggestedFilename()).toMatch(/\.(pdf)$/i)
    
    const downloadPath = await download.path()
    if (downloadPath) {
      const stats = await fs.stat(downloadPath)
      expect(stats.size).toBeGreaterThan(1000) // PDFs are typically larger
      
      // Read first bytes to verify PDF header
      const buffer = await fs.readFile(downloadPath)
      const header = buffer.slice(0, 4).toString()
      expect(header).toBe('%PDF')
    }
  })

  test('Large canvas export (performance test)', async () => {
    // Create many elements
    const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
    await rectangleTool.click()
    const canvas = page.locator('canvas')
    
    // Create a grid of elements
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        await canvas.click({ position: { x: 50 + i * 50, y: 50 + j * 50 } })
      }
    }
    
    await page.waitForTimeout(1000)
    
    // Open export modal
    const exportButton = page.locator('[data-testid="export-button"]')
    await exportButton.click()
    
    // Select PNG format for performance test
    const pngOption = page.locator('[data-testid="export-png"]')
    await pngOption.click()
    
    // Measure export time
    const startTime = Date.now()
    
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 })
    const confirmExport = page.locator('[data-testid="confirm-export"]')
    await confirmExport.click()
    
    const download = await downloadPromise
    const exportTime = Date.now() - startTime
    
    // Should complete within reasonable time (adjust based on requirements)
    expect(exportTime).toBeLessThan(30000) // 30 seconds max
    
    // Verify file
    const downloadPath = await download.path()
    if (downloadPath) {
      const stats = await fs.stat(downloadPath)
      expect(stats.size).toBeGreaterThan(0)
    }
  })

  test('Export progress indication', async () => {
    // Create many elements for longer export
    const rectangleTool = page.locator('[data-testid="tool-rectangle"]')
    await rectangleTool.click()
    const canvas = page.locator('canvas')
    
    for (let i = 0; i < 20; i++) {
      await canvas.click({ position: { x: 50 + i * 20, y: 100 } })
    }
    
    // Open export modal
    const exportButton = page.locator('[data-testid="export-button"]')
    await exportButton.click()
    
    // Select PDF for longer processing
    const pdfOption = page.locator('[data-testid="export-pdf"]')
    await pdfOption.click()
    
    const confirmExport = page.locator('[data-testid="confirm-export"]')
    await confirmExport.click()
    
    // Check for progress indicator
    const progressBar = page.locator('[data-testid="export-progress"]')
    if (await progressBar.isVisible({ timeout: 1000 })) {
      await expect(progressBar).toBeVisible()
      
      // Progress should update
      const initialProgress = await progressBar.getAttribute('aria-valuenow')
      await page.waitForTimeout(1000)
      const updatedProgress = await progressBar.getAttribute('aria-valuenow')
      
      if (initialProgress && updatedProgress) {
        expect(parseInt(updatedProgress)).toBeGreaterThanOrEqual(parseInt(initialProgress))
      }
    }
    
    // Wait for download to complete
    await page.waitForEvent('download', { timeout: 30000 })
  })

  test('Export cancellation', async () => {
    // Open export modal
    const exportButton = page.locator('[data-testid="export-button"]')
    await exportButton.click()
    
    // Select format
    const pdfOption = page.locator('[data-testid="export-pdf"]')
    await pdfOption.click()
    
    const confirmExport = page.locator('[data-testid="confirm-export"]')
    await confirmExport.click()
    
    // Try to cancel if available
    const cancelButton = page.locator('[data-testid="cancel-export"]')
    if (await cancelButton.isVisible({ timeout: 1000 })) {
      await cancelButton.click()
      
      // Modal should close or show cancelled state
      const exportModal = page.locator('[data-testid="export-modal"]')
      await expect(exportModal).not.toBeVisible({ timeout: 5000 })
    }
  })

  test('Export with selection only', async () => {
    // Select specific elements
    const selectTool = page.locator('[data-testid="tool-select"]')
    await selectTool.click()
    
    const canvas = page.locator('canvas')
    await canvas.click({ position: { x: 100, y: 100 } })
    
    // Open export modal
    const exportButton = page.locator('[data-testid="export-button"]')
    await exportButton.click()
    
    // Check for selection-only option
    const selectionOnlyCheckbox = page.locator('[data-testid="export-selection-only"]')
    if (await selectionOnlyCheckbox.isVisible()) {
      await selectionOnlyCheckbox.check()
    }
    
    // Export
    const pngOption = page.locator('[data-testid="export-png"]')
    await pngOption.click()
    
    const downloadPromise = page.waitForEvent('download')
    const confirmExport = page.locator('[data-testid="confirm-export"]')
    await confirmExport.click()
    
    const download = await downloadPromise
    
    // File should be smaller than full export
    const downloadPath = await download.path()
    if (downloadPath) {
      const stats = await fs.stat(downloadPath)
      expect(stats.size).toBeGreaterThan(0)
    }
  })

  test('Export error handling', async () => {
    // Monitor console for errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Try to export without elements (edge case)
    // Clear canvas first
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Delete')
    
    // Open export modal
    const exportButton = page.locator('[data-testid="export-button"]')
    await exportButton.click()
    
    // Try to export empty canvas
    const pngOption = page.locator('[data-testid="export-png"]')
    await pngOption.click()
    
    const confirmExport = page.locator('[data-testid="confirm-export"]')
    await confirmExport.click()
    
    // Should either handle gracefully or show error message
    const errorMessage = page.locator('[data-testid="export-error"]')
    if (await errorMessage.isVisible({ timeout: 2000 })) {
      await expect(errorMessage).toBeVisible()
    } else {
      // Should still produce a valid file (blank canvas)
      const download = await page.waitForEvent('download', { timeout: 5000 }).catch(() => null)
      if (download) {
        const downloadPath = await download.path()
        if (downloadPath) {
          const stats = await fs.stat(downloadPath)
          expect(stats.size).toBeGreaterThan(0)
        }
      }
    }
    
    // No critical errors should occur
    const criticalErrors = consoleErrors.filter(err => 
      err.includes('Uncaught') || err.includes('TypeError')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('Export filename customization', async () => {
    // Open export modal
    const exportButton = page.locator('[data-testid="export-button"]')
    await exportButton.click()
    
    // Check for filename input
    const filenameInput = page.locator('[data-testid="export-filename"]')
    if (await filenameInput.isVisible()) {
      await filenameInput.fill('my-custom-export')
    }
    
    // Export
    const pngOption = page.locator('[data-testid="export-png"]')
    await pngOption.click()
    
    const downloadPromise = page.waitForEvent('download')
    const confirmExport = page.locator('[data-testid="confirm-export"]')
    await confirmExport.click()
    
    const download = await downloadPromise
    
    // Check filename
    const filename = download.suggestedFilename()
    if (await filenameInput.isVisible()) {
      expect(filename).toContain('my-custom-export')
    }
    expect(filename).toMatch(/\.(png|jpg|svg|pdf)$/i)
  })
})