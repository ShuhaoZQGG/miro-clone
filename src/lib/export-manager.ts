import { fabric } from 'fabric'
import { CanvasElement } from '@/types'

export interface ExportOptions {
  format: 'png' | 'jpg' | 'pdf' | 'svg'
  quality?: number
  scale?: number
  bounds?: 'visible' | 'all' | 'selection'
  includeBackground?: boolean
  backgroundColor?: string
}

export class ExportManager {
  private canvas: fabric.Canvas

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas
  }

  async exportCanvas(options: ExportOptions): Promise<Blob> {
    switch (options.format) {
      case 'png':
        return this.exportAsPNG(options)
      case 'jpg':
        return this.exportAsJPG(options)
      case 'svg':
        return this.exportAsSVG(options)
      case 'pdf':
        return this.exportAsPDF(options)
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  private async exportAsPNG(options: ExportOptions): Promise<Blob> {
    const dataUrl = this.getCanvasDataURL('png', options)
    return this.dataURLToBlob(dataUrl)
  }

  private async exportAsJPG(options: ExportOptions): Promise<Blob> {
    const dataUrl = this.getCanvasDataURL('jpeg', options)
    return this.dataURLToBlob(dataUrl)
  }

  private async exportAsSVG(options: ExportOptions): Promise<Blob> {
    const bounds = this.getExportBounds(options.bounds || 'all')
    const originalViewport = this.canvas.viewportTransform
    
    try {
      if (bounds) {
        const scale = options.scale || 1
        this.canvas.viewportTransform = [
          scale, 0, 0, scale,
          -bounds.left * scale,
          -bounds.top * scale
        ]
      }

      const svg = this.canvas.toSVG({
        viewBox: bounds ? {
          x: bounds.left,
          y: bounds.top,
          width: bounds.width,
          height: bounds.height
        } : undefined,
        encoding: 'UTF-8'
      })

      return new Blob([svg], { type: 'image/svg+xml' })
    } finally {
      this.canvas.viewportTransform = originalViewport
    }
  }

  private async exportAsPDF(options: ExportOptions): Promise<Blob> {
    const bounds = this.getExportBounds(options.bounds || 'all')
    const scale = options.scale || 1
    
    const exportData = {
      format: 'pdf',
      bounds,
      scale,
      backgroundColor: options.backgroundColor || '#ffffff',
      dataUrl: this.getCanvasDataURL('png', options)
    }

    const response = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportData)
    })

    if (!response.ok) {
      throw new Error('PDF export failed')
    }

    return response.blob()
  }

  private getCanvasDataURL(format: 'png' | 'jpeg', options: ExportOptions): string {
    const bounds = this.getExportBounds(options.bounds || 'all')
    const scale = options.scale || 1
    const quality = options.quality || 1

    if (!bounds) {
      return this.canvas.toDataURL({
        format,
        quality,
        multiplier: scale
      })
    }

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = bounds.width * scale
    tempCanvas.height = bounds.height * scale
    
    const tempCtx = tempCanvas.getContext('2d')!
    
    if (options.includeBackground !== false) {
      tempCtx.fillStyle = options.backgroundColor || '#ffffff'
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    }

    const originalCanvas = this.canvas.getElement() as HTMLCanvasElement
    tempCtx.drawImage(
      originalCanvas,
      bounds.left,
      bounds.top,
      bounds.width,
      bounds.height,
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    )

    return tempCanvas.toDataURL(`image/${format}`, quality)
  }

  private getExportBounds(boundsType: 'visible' | 'all' | 'selection'): {
    left: number
    top: number
    width: number
    height: number
  } | null {
    switch (boundsType) {
      case 'visible':
        return this.getVisibleBounds()
      case 'all':
        return this.getAllObjectsBounds()
      case 'selection':
        return this.getSelectionBounds()
      default:
        return null
    }
  }

  private getVisibleBounds(): {
    left: number
    top: number
    width: number
    height: number
  } {
    const vpt = this.canvas.viewportTransform!
    const zoom = this.canvas.getZoom()
    
    return {
      left: -vpt[4] / zoom,
      top: -vpt[5] / zoom,
      width: this.canvas.getWidth() / zoom,
      height: this.canvas.getHeight() / zoom
    }
  }

  private getAllObjectsBounds(): {
    left: number
    top: number
    width: number
    height: number
  } | null {
    const objects = this.canvas.getObjects()
    if (objects.length === 0) return null

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    objects.forEach(obj => {
      const bounds = obj.getBoundingRect(true, true)
      minX = Math.min(minX, bounds.left)
      minY = Math.min(minY, bounds.top)
      maxX = Math.max(maxX, bounds.left + bounds.width)
      maxY = Math.max(maxY, bounds.top + bounds.height)
    })

    const padding = 20
    return {
      left: minX - padding,
      top: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2
    }
  }

  private getSelectionBounds(): {
    left: number
    top: number
    width: number
    height: number
  } | null {
    const activeObject = this.canvas.getActiveObject()
    if (!activeObject) return null

    const bounds = activeObject.getBoundingRect(true, true)
    const padding = 20

    return {
      left: bounds.left - padding,
      top: bounds.top - padding,
      width: bounds.width + padding * 2,
      height: bounds.height + padding * 2
    }
  }

  private async dataURLToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl)
    return response.blob()
  }

  downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async exportAndDownload(options: ExportOptions & { filename?: string }): Promise<void> {
    try {
      const blob = await this.exportCanvas(options)
      const extension = options.format === 'jpg' ? 'jpg' : options.format
      const filename = options.filename || `whiteboard-export-${Date.now()}.${extension}`
      this.downloadFile(blob, filename)
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    }
  }
}