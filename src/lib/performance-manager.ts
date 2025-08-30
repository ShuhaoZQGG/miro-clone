import { fabric } from 'fabric'

export interface LODSettings {
  enableLOD: boolean
  qualityMode: 'auto' | 'high' | 'medium' | 'low'
  thresholds: {
    high: number
    medium: number
    low: number
  }
}

export interface ViewportCullingSettings {
  enabled: boolean
  padding: number
  updateInterval: number
}

export class PerformanceManager {
  private canvas: fabric.Canvas
  private lodSettings: LODSettings
  private cullingSettings: ViewportCullingSettings
  private visibleObjects: Set<fabric.Object>
  private cullingInterval: NodeJS.Timeout | null = null
  private objectCount: number = 0
  private currentLOD: 'high' | 'medium' | 'low' = 'high'
  private frameTime: number = 0
  private frameCount: number = 0
  private lastFrameTime: number = 0

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas
    this.visibleObjects = new Set()
    
    this.lodSettings = {
      enableLOD: true,
      qualityMode: 'auto',
      thresholds: {
        high: 100,
        medium: 500,
        low: 1000
      }
    }

    this.cullingSettings = {
      enabled: true,
      padding: 100,
      updateInterval: 100
    }

    this.initializePerformanceMonitoring()
  }

  private initializePerformanceMonitoring() {
    // Monitor frame rate
    const measureFrameRate = () => {
      const currentTime = performance.now()
      if (this.lastFrameTime) {
        this.frameTime += currentTime - this.lastFrameTime
        this.frameCount++
        
        if (this.frameCount >= 60) {
          const avgFrameTime = this.frameTime / this.frameCount
          const fps = 1000 / avgFrameTime
          this.adjustQualityBasedOnPerformance(fps)
          this.frameTime = 0
          this.frameCount = 0
        }
      }
      this.lastFrameTime = currentTime
      requestAnimationFrame(measureFrameRate)
    }
    measureFrameRate()
  }

  private adjustQualityBasedOnPerformance(fps: number) {
    if (this.lodSettings.qualityMode !== 'auto') return

    if (fps < 30 && this.currentLOD !== 'low') {
      this.setLODLevel('low')
    } else if (fps < 45 && this.currentLOD === 'high') {
      this.setLODLevel('medium')
    } else if (fps > 55 && this.currentLOD !== 'high') {
      this.setLODLevel('high')
    }
  }

  enableViewportCulling(settings?: Partial<ViewportCullingSettings>) {
    this.cullingSettings = { ...this.cullingSettings, ...settings, enabled: true }
    
    if (this.cullingInterval) {
      clearInterval(this.cullingInterval)
    }

    this.updateVisibleObjects()
    
    this.cullingInterval = setInterval(() => {
      this.updateVisibleObjects()
    }, this.cullingSettings.updateInterval)

    // Update on viewport change
    this.canvas.on('viewportTransform', () => {
      this.updateVisibleObjects()
    })
  }

  disableViewportCulling() {
    this.cullingSettings.enabled = false
    
    if (this.cullingInterval) {
      clearInterval(this.cullingInterval)
      this.cullingInterval = null
    }

    // Show all objects
    this.canvas.getObjects().forEach(obj => {
      obj.visible = true
    })
    this.canvas.requestRenderAll()
  }

  private updateVisibleObjects() {
    if (!this.cullingSettings.enabled) return

    const viewport = this.getViewportBounds()
    const objects = this.canvas.getObjects()
    let visibilityChanged = false

    objects.forEach(obj => {
      const objBounds = obj.getBoundingRect(true, true)
      const isVisible = this.isInViewport(objBounds, viewport)
      
      if (obj.visible !== isVisible) {
        obj.visible = isVisible
        visibilityChanged = true
      }

      if (isVisible) {
        this.visibleObjects.add(obj)
      } else {
        this.visibleObjects.delete(obj)
      }
    })

    if (visibilityChanged) {
      this.canvas.requestRenderAll()
    }
  }

  private getViewportBounds() {
    const vpt = this.canvas.viewportTransform!
    const zoom = this.canvas.getZoom()
    const padding = this.cullingSettings.padding
    
    return {
      left: (-vpt[4] / zoom) - padding,
      top: (-vpt[5] / zoom) - padding,
      right: (this.canvas.getWidth() - vpt[4]) / zoom + padding,
      bottom: (this.canvas.getHeight() - vpt[5]) / zoom + padding
    }
  }

  private isInViewport(
    objBounds: { left: number; top: number; width: number; height: number },
    viewport: { left: number; top: number; right: number; bottom: number }
  ): boolean {
    return !(
      objBounds.left > viewport.right ||
      objBounds.left + objBounds.width < viewport.left ||
      objBounds.top > viewport.bottom ||
      objBounds.top + objBounds.height < viewport.top
    )
  }

  enableLOD(settings?: Partial<LODSettings>) {
    this.lodSettings = { ...this.lodSettings, ...settings, enableLOD: true }
    this.updateLOD()
  }

  disableLOD() {
    this.lodSettings.enableLOD = false
    this.setLODLevel('high')
  }

  updateLOD() {
    if (!this.lodSettings.enableLOD) return

    this.objectCount = this.canvas.getObjects().length

    if (this.lodSettings.qualityMode !== 'auto') {
      this.setLODLevel(this.lodSettings.qualityMode as 'high' | 'medium' | 'low')
      return
    }

    // Auto mode - adjust based on object count
    if (this.objectCount <= this.lodSettings.thresholds.high) {
      this.setLODLevel('high')
    } else if (this.objectCount <= this.lodSettings.thresholds.medium) {
      this.setLODLevel('medium')
    } else {
      this.setLODLevel('low')
    }
  }

  private setLODLevel(level: 'high' | 'medium' | 'low') {
    this.currentLOD = level
    const objects = this.canvas.getObjects()

    objects.forEach(obj => {
      switch (level) {
        case 'high':
          this.applyHighQuality(obj)
          break
        case 'medium':
          this.applyMediumQuality(obj)
          break
        case 'low':
          this.applyLowQuality(obj)
          break
      }
    })

    // Adjust canvas settings based on LOD
    switch (level) {
      case 'high':
        this.canvas.renderOnAddRemove = true
        this.canvas.skipOffscreen = false
        break
      case 'medium':
        this.canvas.renderOnAddRemove = true
        this.canvas.skipOffscreen = true
        break
      case 'low':
        this.canvas.renderOnAddRemove = false
        this.canvas.skipOffscreen = true
        break
    }

    this.canvas.requestRenderAll()
  }

  private applyHighQuality(obj: fabric.Object) {
    obj.objectCaching = true
    obj.statefullCache = true
    obj.noScaleCache = false
    
    if ('shadow' in obj && obj.shadow) {
      (obj.shadow as fabric.Shadow).blur = 10
    }
  }

  private applyMediumQuality(obj: fabric.Object) {
    obj.objectCaching = true
    obj.statefullCache = false
    obj.noScaleCache = false
    
    if ('shadow' in obj && obj.shadow) {
      (obj.shadow as fabric.Shadow).blur = 5
    }
  }

  private applyLowQuality(obj: fabric.Object) {
    obj.objectCaching = true
    obj.statefullCache = false
    obj.noScaleCache = true
    
    // Disable shadows in low quality mode
    if ('shadow' in obj) {
      obj.shadow = null
    }
  }

  getPerformanceStats() {
    return {
      objectCount: this.objectCount,
      visibleObjects: this.visibleObjects.size,
      currentLOD: this.currentLOD,
      fps: this.frameCount > 0 ? 1000 / (this.frameTime / this.frameCount) : 60,
      cullingEnabled: this.cullingSettings.enabled,
      lodEnabled: this.lodSettings.enableLOD
    }
  }

  setQualityMode(mode: 'auto' | 'high' | 'medium' | 'low') {
    this.lodSettings.qualityMode = mode
    this.updateLOD()
  }

  destroy() {
    if (this.cullingInterval) {
      clearInterval(this.cullingInterval)
    }
    this.visibleObjects.clear()
  }
}