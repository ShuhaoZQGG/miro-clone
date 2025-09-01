import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { fabric } from 'fabric'

export class PDFExportManager {
  private canvas: fabric.Canvas

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas
  }

  /**
   * Export the canvas as a PDF document
   * @param filename - Name of the PDF file
   * @param options - Export options
   */
  async exportToPDF(
    filename: string = 'canvas-export.pdf',
    options: {
      format?: 'a4' | 'letter' | 'a3'
      orientation?: 'portrait' | 'landscape'
      quality?: number
      includeBackground?: boolean
    } = {}
  ): Promise<void> {
    const {
      format = 'a4',
      orientation = 'landscape',
      quality = 0.95,
      includeBackground = true,
    } = options

    try {
      // Get canvas element
      const canvasElement = this.canvas.getElement()
      const container = canvasElement.parentElement

      if (!container) {
        throw new Error('Canvas container not found')
      }

      // Store original canvas state
      const originalZoom = this.canvas.getZoom()
      const originalViewport = this.canvas.viewportTransform

      // Reset zoom and viewport for clean export
      this.canvas.setZoom(1)
      this.canvas.absolutePan({ x: 0, y: 0 })

      // Calculate bounds of all objects
      const bounds = this.calculateContentBounds()

      // Create a temporary container for rendering
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.width = `${bounds.width}px`
      tempContainer.style.height = `${bounds.height}px`
      document.body.appendChild(tempContainer)

      // Create a new canvas for export
      const exportCanvas = document.createElement('canvas')
      exportCanvas.width = bounds.width
      exportCanvas.height = bounds.height
      tempContainer.appendChild(exportCanvas)

      // Get 2D context and draw the fabric canvas content
      const ctx = exportCanvas.getContext('2d')
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      // Set background if needed
      if (includeBackground) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, bounds.width, bounds.height)
      }

      // Draw fabric canvas content
      const fabricCanvas = this.canvas.toCanvasElement()
      ctx.drawImage(
        fabricCanvas,
        bounds.left,
        bounds.top,
        bounds.width,
        bounds.height,
        0,
        0,
        bounds.width,
        bounds.height
      )

      // Convert to image using html2canvas for better quality
      const imgData = await html2canvas(exportCanvas, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: includeBackground ? '#ffffff' : null,
      })

      // Create PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format,
      })

      // Get PDF page dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // Calculate scaling to fit content on page
      const imgWidth = bounds.width
      const imgHeight = bounds.height
      const scale = Math.min(pdfWidth / imgWidth * 25.4, pdfHeight / imgHeight * 25.4)

      // Calculate centered position
      const scaledWidth = imgWidth * scale / 25.4
      const scaledHeight = imgHeight * scale / 25.4
      const x = (pdfWidth - scaledWidth) / 2
      const y = (pdfHeight - scaledHeight) / 2

      // Add image to PDF
      pdf.addImage(
        imgData.toDataURL('image/png', quality),
        'PNG',
        x,
        y,
        scaledWidth,
        scaledHeight
      )

      // Save the PDF
      pdf.save(filename)

      // Restore original canvas state
      this.canvas.setZoom(originalZoom)
      this.canvas.setViewportTransform(originalViewport!)

      // Clean up
      document.body.removeChild(tempContainer)

    } catch (error) {
      console.error('Failed to export PDF:', error)
      throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Calculate the bounding box of all canvas content
   */
  private calculateContentBounds(): {
    left: number
    top: number
    width: number
    height: number
  } {
    const objects = this.canvas.getObjects()

    if (objects.length === 0) {
      // Return default size if canvas is empty
      return {
        left: 0,
        top: 0,
        width: this.canvas.getWidth(),
        height: this.canvas.getHeight(),
      }
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    objects.forEach((obj) => {
      const bounds = obj.getBoundingRect()
      minX = Math.min(minX, bounds.left)
      minY = Math.min(minY, bounds.top)
      maxX = Math.max(maxX, bounds.left + bounds.width)
      maxY = Math.max(maxY, bounds.top + bounds.height)
    })

    // Add padding
    const padding = 50
    minX -= padding
    minY -= padding
    maxX += padding
    maxY += padding

    return {
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  /**
   * Export canvas as multi-page PDF for large canvases
   */
  async exportToMultiPagePDF(
    filename: string = 'canvas-export.pdf',
    options: {
      format?: 'a4' | 'letter' | 'a3'
      orientation?: 'portrait' | 'landscape'
      quality?: number
    } = {}
  ): Promise<void> {
    const {
      format = 'a4',
      orientation = 'landscape',
      quality = 0.95,
    } = options

    try {
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format,
      })

      const bounds = this.calculateContentBounds()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // Calculate number of pages needed
      const pagesX = Math.ceil(bounds.width / (pageWidth * 3.78)) // Convert mm to px
      const pagesY = Math.ceil(bounds.height / (pageHeight * 3.78))

      let firstPage = true

      for (let y = 0; y < pagesY; y++) {
        for (let x = 0; x < pagesX; x++) {
          if (!firstPage) {
            pdf.addPage()
          }
          firstPage = false

          // Calculate section to capture
          const sectionX = bounds.left + x * (pageWidth * 3.78)
          const sectionY = bounds.top + y * (pageHeight * 3.78)
          const sectionWidth = Math.min(pageWidth * 3.78, bounds.width - x * (pageWidth * 3.78))
          const sectionHeight = Math.min(pageHeight * 3.78, bounds.height - y * (pageHeight * 3.78))

          // Create temporary canvas for this section
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = sectionWidth
          tempCanvas.height = sectionHeight
          const ctx = tempCanvas.getContext('2d')

          if (ctx) {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, sectionWidth, sectionHeight)

            const fabricCanvas = this.canvas.toCanvasElement()
            ctx.drawImage(
              fabricCanvas,
              sectionX,
              sectionY,
              sectionWidth,
              sectionHeight,
              0,
              0,
              sectionWidth,
              sectionHeight
            )

            // Add to PDF
            pdf.addImage(
              tempCanvas.toDataURL('image/png', quality),
              'PNG',
              0,
              0,
              pageWidth,
              pageHeight
            )
          }
        }
      }

      pdf.save(filename)

    } catch (error) {
      console.error('Failed to export multi-page PDF:', error)
      throw new Error(`Multi-page PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}