import { fabric } from 'fabric'
import { Position, Size, Camera, CanvasElement, Bounds } from '@/types'

interface CameraState {
  x: number
  y: number
  zoom: number
}

interface PanBoundaries {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

interface ZoomLimits {
  min: number
  max: number
}

interface CanvasEngineEvents {
  pan: { position: Position; delta: Position }
  zoom: { zoom: number; previousZoom: number; center: Position }
  stateChange: { type: string; camera?: Camera; [key: string]: any }
}

export class CanvasEngine {
  private canvas: fabric.Canvas
  private container: HTMLElement
  private camera: Camera = { x: 0, y: 0, zoom: 1 }
  private elements: CanvasElement[] = []
  private selectedElementIds: string[] = []
  private panBoundaries: PanBoundaries | null = null
  private zoomLimits: ZoomLimits = { min: 0.1, max: 10 }
  private virtualizationEnabled = false
  private isPanningActive = false
  private isSpacePressed = false
  private lastFrameTime = 0
  private frameCount = 0
  private currentFrameRate = 60
  private renderThrottleId: number | null = null
  
  // Event system
  private eventListeners: Map<string, Set<Function>> = new Map()
  
  // Touch/gesture handling
  private lastTouchDistance = 0
  private touchStartPoints: Position[] = []

  constructor(container: HTMLElement) {
    this.container = container
    this.canvas = this.initializeCanvas()
    this.setupEventListeners()
    this.startFrameRateMonitoring()
  }

  private initializeCanvas(): fabric.Canvas {
    const rect = this.container.getBoundingClientRect()
    
    const canvas = new fabric.Canvas(null, {
      width: rect.width,
      height: rect.height,
      selection: true,
      preserveObjectStacking: true,
      imageSmoothingEnabled: true,
    })
    
    // Append canvas to container
    const canvasEl = canvas.getElement()
    if (canvasEl) {
      this.container.appendChild(canvasEl)
    }
    
    return canvas
  }

  private setupEventListeners(): void {
    // Mouse wheel zoom
    this.canvas.on('mouse:wheel', this.handleMouseWheel.bind(this))
    
    // Mouse/touch pan
    this.canvas.on('mouse:down', this.handleMouseDown.bind(this))
    this.canvas.on('mouse:move', this.handleMouseMove.bind(this))
    this.canvas.on('mouse:up', this.handleMouseUp.bind(this))
    
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    document.addEventListener('keyup', this.handleKeyUp.bind(this))
    
    // Touch events
    const canvasEl = this.canvas.getElement()
    if (canvasEl) {
      canvasEl.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
      canvasEl.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
      canvasEl.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })
    }
    
    // Resize observer
    const resizeObserver = new ResizeObserver(this.handleResize.bind(this))
    resizeObserver.observe(this.container)
  }

  private handleMouseWheel(opt: any): void {
    const delta = opt.e.deltaY
    const zoom = this.camera.zoom
    const pointer = this.canvas.getPointer(opt.e)
    
    opt.e.preventDefault()
    opt.e.stopPropagation()
    
    const zoomStep = 0.1
    const newZoom = delta > 0 ? zoom - zoomStep : zoom + zoomStep
    
    this.zoomToPoint(pointer, newZoom)
  }

  private handleMouseDown(opt: any): void {
    const evt = opt.e
    const isMiddleButton = evt.button === 1
    const isSpacePan = this.isSpacePressed && evt.button === 0
    
    if (isMiddleButton || isSpacePan) {
      this.isPanningActive = true
      this.canvas.selection = false
      this.canvas.hoverCursor = 'grabbing'
      this.canvas.moveCursor = 'grabbing'
    }
  }

  private handleMouseMove(opt: any): void {
    if (this.isPanningActive) {
      const delta = {
        x: opt.e.movementX || 0,
        y: opt.e.movementY || 0
      }
      
      this.panBy(delta)
    }
  }

  private handleMouseUp(): void {
    this.isPanningActive = false
    this.canvas.selection = true
    this.canvas.hoverCursor = 'pointer'
    this.canvas.moveCursor = 'grab'
  }

  private handleKeyDown(evt: KeyboardEvent): void {
    if (evt.code === 'Space') {
      this.isSpacePressed = true
      this.canvas.defaultCursor = 'grab'
      evt.preventDefault()
    }
  }

  private handleKeyUp(evt: KeyboardEvent): void {
    if (evt.code === 'Space') {
      this.isSpacePressed = false
      this.canvas.defaultCursor = 'default'
    }
  }

  handleTouchStart(evt: TouchEvent): void {
    evt.preventDefault()
    
    if (evt.touches.length === 2) {
      // Two-finger gesture (pinch/pan)
      this.touchStartPoints = [
        { x: evt.touches[0].clientX, y: evt.touches[0].clientY },
        { x: evt.touches[1].clientX, y: evt.touches[1].clientY }
      ]
      
      this.lastTouchDistance = this.getTouchDistance(evt.touches)
    } else if (evt.touches.length === 1) {
      // Single finger pan
      this.isPanningActive = true
    }
  }

  private handleTouchMove(evt: TouchEvent): void {
    evt.preventDefault()
    
    if (evt.touches.length === 2 && this.touchStartPoints.length === 2) {
      // Handle pinch zoom
      const currentDistance = this.getTouchDistance(evt.touches)
      const distanceDelta = currentDistance - this.lastTouchDistance
      const zoomDelta = distanceDelta > 0 ? 0.1 : -0.1
      
      // Zoom delta calculation
      
      this.zoomBy(1 + zoomDelta)
      this.lastTouchDistance = currentDistance
      
      // Handle two-finger pan
      const currentCenter = {
        x: (evt.touches[0].clientX + evt.touches[1].clientX) / 2,
        y: (evt.touches[0].clientY + evt.touches[1].clientY) / 2
      }
      
      const previousCenter = {
        x: (this.touchStartPoints[0].x + this.touchStartPoints[1].x) / 2,
        y: (this.touchStartPoints[0].y + this.touchStartPoints[1].y) / 2
      }
      
      const panDelta = {
        x: currentCenter.x - previousCenter.x,
        y: currentCenter.y - previousCenter.y
      }
      
      this.panBy(panDelta)
    }
  }

  private handleTouchEnd(): void {
    this.isPanningActive = false
    this.touchStartPoints = []
    this.lastTouchDistance = 0
  }

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  private handleResize(): void {
    const rect = this.container.getBoundingClientRect()
    this.canvas.setDimensions({
      width: rect.width,
      height: rect.height
    })
    this.canvas.renderAll()
  }

  // Pan methods
  panTo(position: Position): void {
    const previousPosition = { x: this.camera.x, y: this.camera.y }
    
    // Apply boundaries if set
    if (this.panBoundaries) {
      position.x = Math.max(this.panBoundaries.minX, Math.min(this.panBoundaries.maxX, position.x))
      position.y = Math.max(this.panBoundaries.minY, Math.min(this.panBoundaries.maxY, position.y))
    }
    
    this.camera.x = position.x
    this.camera.y = position.y
    
    this.canvas.absolutePan({ x: -position.x, y: -position.y })
    this.throttledRender()
    
    // Emit pan event
    const delta = {
      x: position.x - previousPosition.x,
      y: position.y - previousPosition.y
    }
    
    this.emit('pan', { position, delta })
    this.emit('stateChange', { type: 'camera', camera: this.camera })
  }

  panBy(delta: Position): void {
    const previousPosition = { x: this.camera.x, y: this.camera.y }
    const newPosition = {
      x: this.camera.x + delta.x,
      y: this.camera.y + delta.y
    }
    
    // Apply boundaries if set
    if (this.panBoundaries) {
      newPosition.x = Math.max(this.panBoundaries.minX, Math.min(this.panBoundaries.maxX, newPosition.x))
      newPosition.y = Math.max(this.panBoundaries.minY, Math.min(this.panBoundaries.maxY, newPosition.y))
    }
    
    this.camera.x = newPosition.x
    this.camera.y = newPosition.y
    
    // Update the fabric.js canvas pan
    this.canvas.relativePan?.(delta)
    this.throttledRender()
    
    // Emit pan event
    const actualDelta = {
      x: newPosition.x - previousPosition.x,
      y: newPosition.y - previousPosition.y
    }
    
    this.emit('pan', { position: newPosition, delta: actualDelta })
    this.emit('stateChange', { type: 'camera', camera: this.camera })
  }

  async animatePanTo(position: Position, duration: number = 300): Promise<void> {
    return new Promise((resolve) => {
      const startPos = { x: this.camera.x, y: this.camera.y }
      const deltaPos = {
        x: position.x - startPos.x,
        y: position.y - startPos.y
      }
      
      const startTime = performance.now()
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function (ease-out)
        const easedProgress = 1 - Math.pow(1 - progress, 3)
        
        const currentPos = {
          x: startPos.x + deltaPos.x * easedProgress,
          y: startPos.y + deltaPos.y * easedProgress
        }
        
        this.panTo(currentPos)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }
      
      requestAnimationFrame(animate)
    })
  }

  // Zoom methods
  zoomTo(zoom: number): void {
    const previousZoom = this.camera.zoom
    const clampedZoom = Math.max(this.zoomLimits.min, Math.min(this.zoomLimits.max, zoom))
    
    this.camera.zoom = clampedZoom
    this.canvas.setZoom(clampedZoom)
    this.throttledRender()
    
    // Emit zoom event
    this.emit('zoom', {
      zoom: clampedZoom,
      previousZoom,
      center: this.getCanvasCenter()
    })
    this.emit('stateChange', { type: 'camera', camera: this.camera })
  }

  zoomBy(factor: number): void {
    this.zoomTo(this.camera.zoom * factor)
  }

  zoomToPoint(point: Position, zoom: number): void {
    const clampedZoom = Math.max(this.zoomLimits.min, Math.min(this.zoomLimits.max, zoom))
    
    // Calculate zoom center offset
    const center = this.getCanvasCenter()
    const offsetX = (point.x - center.x) * (clampedZoom - this.camera.zoom)
    const offsetY = (point.y - center.y) * (clampedZoom - this.camera.zoom)
    
    this.camera.zoom = clampedZoom
    this.canvas.setZoom(clampedZoom)
    
    // Adjust pan to maintain zoom center
    this.panBy({ x: -offsetX / clampedZoom, y: -offsetY / clampedZoom })
  }

  async animateZoomTo(zoom: number, duration: number = 250): Promise<void> {
    return new Promise((resolve) => {
      const startZoom = this.camera.zoom
      const deltaZoom = zoom - startZoom
      const startTime = performance.now()
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function (ease-out)
        const easedProgress = 1 - Math.pow(1 - progress, 3)
        const currentZoom = startZoom + deltaZoom * easedProgress
        
        this.zoomTo(currentZoom)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }
      
      requestAnimationFrame(animate)
    })
  }

  fitToElements(elements: CanvasElement[]): void {
    if (elements.length === 0) return
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    
    elements.forEach(element => {
      minX = Math.min(minX, element.position.x)
      minY = Math.min(minY, element.position.y)
      maxX = Math.max(maxX, element.position.x + element.size.width)
      maxY = Math.max(maxY, element.position.y + element.size.height)
    })
    
    const bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    const canvasSize = this.getCanvasSize()
    
    const padding = 50
    const zoomX = (canvasSize.width - padding * 2) / bounds.width
    const zoomY = (canvasSize.height - padding * 2) / bounds.height
    const zoom = Math.min(zoomX, zoomY, this.zoomLimits.max)
    
    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2
    
    this.zoomTo(zoom)
    this.panTo({ x: centerX - canvasSize.width / 2 / zoom, y: centerY - canvasSize.height / 2 / zoom })
  }

  // Coordinate transformations
  screenToCanvas(screenPoint: Position): Position {
    return {
      x: (screenPoint.x / this.camera.zoom) - this.camera.x,
      y: (screenPoint.y / this.camera.zoom) - this.camera.y
    }
  }

  canvasToScreen(canvasPoint: Position): Position {
    return {
      x: (canvasPoint.x + this.camera.x) * this.camera.zoom,
      y: (canvasPoint.y + this.camera.y) * this.camera.zoom
    }
  }

  getVisibleBounds(): Bounds {
    const canvasSize = this.getCanvasSize()
    const halfWidth = canvasSize.width / 2 / this.camera.zoom
    const halfHeight = canvasSize.height / 2 / this.camera.zoom
    
    return {
      x: this.camera.x - halfWidth,
      y: this.camera.y - halfHeight,
      width: canvasSize.width / this.camera.zoom,
      height: canvasSize.height / this.camera.zoom
    }
  }

  // Getters
  getCanvas(): fabric.Canvas {
    return this.canvas
  }

  getCamera(): Camera {
    return { ...this.camera }
  }

  getCanvasSize(): Size {
    return {
      width: this.canvas.getWidth(),
      height: this.canvas.getHeight()
    }
  }

  getCanvasCenter(): Position {
    const size = this.getCanvasSize()
    return { x: size.width / 2, y: size.height / 2 }
  }

  getElements(): CanvasElement[] {
    return [...this.elements]
  }

  getSelectedElementIds(): string[] {
    return [...this.selectedElementIds]
  }

  isPanning(): boolean {
    return this.isPanningActive
  }

  isVirtualizationEnabled(): boolean {
    return this.virtualizationEnabled
  }

  getFrameRate(): number {
    return this.currentFrameRate
  }

  // Setters
  setPanBoundaries(boundaries: PanBoundaries | null): void {
    this.panBoundaries = boundaries
  }

  setZoomLimits(min: number, max: number): void {
    this.zoomLimits = { min, max }
  }

  setSpaceKeyPressed(pressed: boolean): void {
    this.isSpacePressed = pressed
  }

  enableVirtualization(enabled: boolean): void {
    this.virtualizationEnabled = enabled
  }

  // Performance optimization
  cullElements(elements: CanvasElement[]): CanvasElement[] {
    if (!this.virtualizationEnabled) {
      return elements
    }
    
    const visibleBounds = this.getVisibleBounds()
    const buffer = 100 // Buffer around visible area
    
    return elements.filter(element => {
      return !(
        element.position.x + element.size.width < visibleBounds.x - buffer ||
        element.position.x > visibleBounds.x + visibleBounds.width + buffer ||
        element.position.y + element.size.height < visibleBounds.y - buffer ||
        element.position.y > visibleBounds.y + visibleBounds.height + buffer
      )
    })
  }

  private throttledRender(): void {
    if (this.renderThrottleId) {
      return
    }
    
    this.renderThrottleId = requestAnimationFrame(() => {
      this.canvas.renderAll()
      this.renderThrottleId = null
    })
  }

  render(): void {
    this.canvas.renderAll()
  }

  // State management
  saveCameraState(): CameraState {
    return {
      x: this.camera.x,
      y: this.camera.y,
      zoom: this.camera.zoom
    }
  }

  restoreCameraState(state: CameraState): void {
    this.panTo({ x: state.x, y: state.y })
    this.zoomTo(state.zoom)
  }

  resetCamera(): void {
    this.panTo({ x: 0, y: 0 })
    this.zoomTo(1)
  }

  // Performance monitoring
  private startFrameRateMonitoring(): void {
    const updateFrameRate = () => {
      const currentTime = performance.now()
      
      if (this.lastFrameTime > 0) {
        const deltaTime = currentTime - this.lastFrameTime
        this.currentFrameRate = 1000 / deltaTime
        this.frameCount++
      }
      
      this.lastFrameTime = currentTime
      requestAnimationFrame(updateFrameRate)
    }
    
    requestAnimationFrame(updateFrameRate)
  }

  // Event system
  on<K extends keyof CanvasEngineEvents>(event: K, listener: (data: CanvasEngineEvents[K]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)
  }

  off<K extends keyof CanvasEngineEvents>(event: K, listener: (data: CanvasEngineEvents[K]) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  emit<K extends keyof CanvasEngineEvents>(event: K, data: CanvasEngineEvents[K]): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => listener(data))
    }
  }

  // Cleanup
  dispose(): void {
    // Remove event listeners
    this.canvas.off('mouse:wheel')
    this.canvas.off('mouse:down')
    this.canvas.off('mouse:move')
    this.canvas.off('mouse:up')
    
    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
    document.removeEventListener('keyup', this.handleKeyUp.bind(this))
    
    // Clear all event listeners
    this.eventListeners.clear()
    
    // Cancel any pending renders
    if (this.renderThrottleId) {
      cancelAnimationFrame(this.renderThrottleId)
    }
    
    // Dispose fabric canvas
    this.canvas.dispose()
  }
}