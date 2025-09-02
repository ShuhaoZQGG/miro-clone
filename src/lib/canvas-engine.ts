import { fabric } from 'fabric'
import { Position, Size, Camera, CanvasElement, Bounds, ElementType, ShapeElement, LineElement } from '@/types'
import { WebGLRenderer } from './canvas-features/webgl-renderer'
import { ViewportCulling } from './canvas-features/viewport-culling'
import { CRDTManager } from './canvas-features/crdt-manager'

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

// Internal type that adds fabric object reference to CanvasElement
type InternalCanvasElement = CanvasElement & {
  fabricObject?: fabric.Object
}

export class CanvasEngine {
  private canvas: fabric.Canvas
  private container: HTMLElement
  private camera: Camera = { x: 0, y: 0, zoom: 1 }
  private elements: InternalCanvasElement[] = []
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
  
  // Performance optimization features
  private webglRenderer: WebGLRenderer | null = null
  private viewportCulling: ViewportCulling | null = null
  private crdtManager: CRDTManager | null = null
  private webglEnabled = false
  private cullingEnabled = true
  
  // Event system
  private eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map()
  
  // Touch/gesture handling
  private lastTouchDistance = 0
  private touchStartPoints: Position[] = []
  
  // Bound event handlers (for proper cleanup)
  private boundHandlers: {
    keyDown?: (e: KeyboardEvent) => void
    keyUp?: (e: KeyboardEvent) => void
    touchStart?: (e: TouchEvent) => void
    touchMove?: (e: TouchEvent) => void
    touchEnd?: (e: TouchEvent) => void
  } = {}
  
  // ResizeObserver instance for cleanup
  private resizeObserver: ResizeObserver | null = null
  private resizeDebounceTimer: number | null = null
  private renderRequestId: number | null = null

  constructor(container: HTMLElement, options?: {
    enableWebGL?: boolean
    enableCulling?: boolean
    enableCRDT?: boolean
    boardId?: string
    userId?: string
    websocketUrl?: string
  }) {
    this.container = container
    this.canvas = this.initializeCanvas()
    this.setupEventListeners()
    this.startFrameRateMonitoring()
    
    // Initialize performance features
    if (options?.enableWebGL && WebGLRenderer.isSupported()) {
      this.initializeWebGL()
    }
    
    if (options?.enableCulling !== false) {
      this.viewportCulling = new ViewportCulling({
        maxDepth: 6,
        maxElementsPerNode: 10,
        viewportPadding: 100,
        dynamicLOD: true
      })
      this.cullingEnabled = true
    }
    
    if (options?.enableCRDT && options.boardId && options.userId) {
      this.crdtManager = new CRDTManager(
        options.boardId,
        options.userId,
        options.websocketUrl
      )
      this.setupCRDTHandlers()
    }
  }

  private initializeCanvas(): fabric.Canvas {
    const rect = this.container.getBoundingClientRect()
    
    const canvas = new fabric.Canvas(null, {
      width: rect.width,
      height: rect.height,
      selection: true,
      preserveObjectStacking: true,
      imageSmoothingEnabled: true,
      enableRetinaScaling: true,
      renderOnAddRemove: false, // Improve performance by batching renders
      skipOffscreen: true, // Skip rendering objects outside viewport
      stateful: false, // Disable state tracking for better performance
    })
    
    // Append canvas to container
    const canvasEl = canvas.getElement()
    if (canvasEl) {
      // Ensure canvas fills container completely
      canvasEl.style.width = '100%'
      canvasEl.style.height = '100%'
      canvasEl.style.position = 'absolute'
      canvasEl.style.top = '0'
      canvasEl.style.left = '0'
      this.container.appendChild(canvasEl)
    }
    
    // Enable smooth rendering
    this.setupSmoothRendering(canvas)
    
    return canvas
  }

  private setupEventListeners(): void {
    // Mouse wheel zoom
    this.canvas.on('mouse:wheel', this.handleMouseWheel.bind(this))
    
    // Mouse/touch pan
    this.canvas.on('mouse:down', this.handleMouseDown.bind(this))
    this.canvas.on('mouse:move', this.handleMouseMove.bind(this))
    this.canvas.on('mouse:up', this.handleMouseUp.bind(this))
    
    // Keyboard events - store bound handlers for cleanup
    this.boundHandlers.keyDown = this.handleKeyDown.bind(this)
    this.boundHandlers.keyUp = this.handleKeyUp.bind(this)
    document.addEventListener('keydown', this.boundHandlers.keyDown)
    document.addEventListener('keyup', this.boundHandlers.keyUp)
    
    // Touch events - store bound handlers for cleanup
    const canvasEl = this.canvas.getElement()
    if (canvasEl) {
      this.boundHandlers.touchStart = this.handleTouchStart.bind(this)
      this.boundHandlers.touchMove = this.handleTouchMove.bind(this)
      this.boundHandlers.touchEnd = this.handleTouchEnd.bind(this)
      canvasEl.addEventListener('touchstart', this.boundHandlers.touchStart, { passive: false })
      canvasEl.addEventListener('touchmove', this.boundHandlers.touchMove, { passive: false })
      canvasEl.addEventListener('touchend', this.boundHandlers.touchEnd, { passive: false })
    }
    
    // Resize observer
    this.resizeObserver = new ResizeObserver(this.handleResize.bind(this))
    this.resizeObserver.observe(this.container)
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

  public handleResize(): void {
    // Debounce resize to improve performance
    if (this.resizeDebounceTimer) {
      clearTimeout(this.resizeDebounceTimer)
    }
    
    this.resizeDebounceTimer = setTimeout(() => {
      const rect = this.container.getBoundingClientRect()
      this.canvas.setDimensions({
        width: rect.width,
        height: rect.height
      })
      this.canvas.renderAll()
    }, 100) as any
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
    // Return elements without the internal fabricObject property
    return this.elements.map(({ fabricObject, ...element }) => element as CanvasElement)
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

  setRenderThrottleEnabled(enabled: boolean): void {
    // Control whether rendering is throttled or immediate
    if (!enabled) {
      // Clear any pending throttled renders
      if (this.renderThrottleId) {
        this.renderThrottleId = null
      }
    }
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

  private setupSmoothRendering(canvas: fabric.Canvas): void {
    // Configure canvas for optimal rendering performance
    if (canvas) {
      // Enable GPU acceleration hints
      const canvasEl = canvas.getElement()
      if (canvasEl) {
        canvasEl.style.willChange = 'transform'
        canvasEl.style.transform = 'translateZ(0)'
      }

      // Setup RAF-based render loop
      this.startRenderLoop()
    }
  }

  private startRenderLoop(): void {
    const render = () => {
      // Only render if needed
      if (this.renderThrottleId) {
        this.canvas.renderAll()
        this.renderThrottleId = null
      }
      this.renderRequestId = requestAnimationFrame(render)
    }
    
    // Start the render loop
    this.renderRequestId = requestAnimationFrame(render)
  }

  private scheduleRender(): void {
    // Mark that a render is needed
    if (!this.renderThrottleId) {
      this.renderThrottleId = 1 // Use non-null value to indicate render is scheduled
    }
  }

  private throttledRender(): void {
    this.scheduleRender()
    // Immediately render for synchronous behavior in tests
    if (this.renderThrottleId) {
      this.performRender()
      this.renderThrottleId = null
    }
  }

  render(): void {
    this.performRender()
  }

  /**
   * Perform optimized rendering
   */
  private performRender(): void {
    // Apply viewport culling if enabled
    let elementsToRender = this.elements
    
    if (this.cullingEnabled && this.viewportCulling) {
      const viewport = this.getVisibleBounds()
      
      // Rebuild spatial index if needed
      if (this.viewportCulling.hasViewportChanged(viewport)) {
        this.viewportCulling.buildIndex(this.elements)
      }
      
      // Query visible elements
      elementsToRender = this.viewportCulling.queryViewport(viewport, this.camera.zoom)
      
      // Hide non-visible fabric objects
      for (const element of this.elements) {
        if (element.fabricObject) {
          element.fabricObject.visible = elementsToRender.includes(element)
        }
      }
    }
    
    // Use WebGL renderer if enabled and beneficial
    if (this.webglEnabled && this.webglRenderer) {
      this.webglRenderer.render(elementsToRender)
    }
    
    // Always render with fabric for now (WebGL is supplementary)
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

  /**
   * Initialize WebGL renderer
   */
  private initializeWebGL(): void {
    this.webglRenderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    
    if (this.webglRenderer.initialize(this.canvas)) {
      this.webglEnabled = true
      console.log('WebGL renderer initialized successfully')
    } else {
      this.webglRenderer = null
      this.webglEnabled = false
      console.warn('WebGL initialization failed, falling back to Canvas 2D')
    }
  }

  /**
   * Setup CRDT event handlers
   */
  private setupCRDTHandlers(): void {
    if (!this.crdtManager) return
    
    // Handle remote element changes
    this.crdtManager.on('elements-changed', (changes: any[]) => {
      for (const change of changes) {
        switch (change.type) {
          case 'add':
            this.addElementFromCRDT(change.element)
            break
          case 'update':
            this.updateElementFromCRDT(change.elementId, change.element)
            break
          case 'delete':
            this.removeElementFromCRDT(change.elementId)
            break
        }
      }
    })
    
    // Handle awareness changes (cursors, selections)
    this.crdtManager.on('awareness-changed', (states: any[]) => {
      this.emit('awareness-changed', states)
    })
    
    // Handle sync status
    this.crdtManager.on('synced', (data: any) => {
      this.emit('synced', data)
    })
  }

  /**
   * Add element from CRDT update
   */
  private addElementFromCRDT(element: CanvasElement): void {
    // Check if element already exists
    if (this.elements.find(e => e.id === element.id)) {
      return
    }
    
    // Create fabric object
    const fabricObject = this.createFabricObject(element)
    if (fabricObject) {
      this.canvas.add(fabricObject)
      this.elements.push({ ...element, fabricObject })
      this.scheduleRender()
    }
  }

  /**
   * Update element from CRDT update
   */
  private updateElementFromCRDT(elementId: string, updates: Partial<CanvasElement>): void {
    const element = this.elements.find(e => e.id === elementId)
    if (!element) return
    
    // Update element properties
    Object.assign(element, updates)
    
    // Update fabric object
    if (element.fabricObject) {
      if (updates.position) {
        element.fabricObject.set({
          left: updates.position.x,
          top: updates.position.y
        })
      }
      if (updates.size) {
        element.fabricObject.set({
          width: updates.size.width,
          height: updates.size.height
        })
      }
      element.fabricObject.setCoords()
      this.scheduleRender()
    }
  }

  /**
   * Remove element from CRDT update
   */
  private removeElementFromCRDT(elementId: string): void {
    const index = this.elements.findIndex(e => e.id === elementId)
    if (index === -1) return
    
    const element = this.elements[index]
    if (element.fabricObject) {
      this.canvas.remove(element.fabricObject)
    }
    
    this.elements.splice(index, 1)
    this.scheduleRender()
  }

  /**
   * Create fabric object from element
   */
  private createFabricObject(element: CanvasElement): fabric.Object | null {
    switch (element.type) {
      case 'rectangle':
        return new fabric.Rect({
          left: element.position.x,
          top: element.position.y,
          width: element.size.width,
          height: element.size.height,
          fill: (element as any).style?.fill || '#ffffff',
          stroke: (element as any).style?.stroke || '#000000',
          strokeWidth: (element as any).style?.strokeWidth || 1
        })
      case 'circle':
        return new fabric.Circle({
          left: element.position.x,
          top: element.position.y,
          radius: Math.min(element.size.width, element.size.height) / 2,
          fill: (element as any).style?.fill || '#ffffff',
          stroke: (element as any).style?.stroke || '#000000',
          strokeWidth: (element as any).style?.strokeWidth || 1
        })
      default:
        return null
    }
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

  // Smooth Interaction Methods
  private dragState: {
    elementId: string | null
    startPosition: Position | null
    lastPosition: Position | null
    velocity: Position
  } = {
    elementId: null,
    startPosition: null,
    lastPosition: null,
    velocity: { x: 0, y: 0 }
  }

  private resizeState: {
    elementId: string | null
    handle: string | null
    originalSize: Size | null
    aspectRatioLocked: boolean
  } = {
    elementId: null,
    handle: null,
    originalSize: null,
    aspectRatioLocked: false
  }

  private creationState: {
    type: string | null
    preview: any | null
    startPosition: Position | null
  } = {
    type: null,
    preview: null,
    startPosition: null
  }

  private animationState: {
    activeAnimations: Map<string, number>
  } = {
    activeAnimations: new Map()
  }

  private performanceStats = {
    frameCount: 0,
    frameTimeSum: 0,
    minFPS: 60,
    maxFPS: 60,
    lastUpdateTime: 0
  }

  private renderQuality: 'high' | 'reduced' = 'high'

  getCurrentFPS(): number {
    return this.currentFrameRate
  }

  startAnimation(): void {
    this.startRenderLoop()
  }

  createElement(type: string, options: any): InternalCanvasElement {
    let fabricObject: fabric.Object | null = null
    
    switch (type) {
      case 'rectangle':
        fabricObject = new fabric.Rect({
          left: options.x || 0,
          top: options.y || 0,
          width: options.width || 100,
          height: options.height || 100,
          fill: options.fill || '#000000',
          stroke: options.stroke || '#000000',
          strokeWidth: options.strokeWidth || 1
        })
        break
      case 'circle':
        fabricObject = new fabric.Circle({
          left: options.x || 0,
          top: options.y || 0,
          radius: options.radius || 50,
          fill: options.fill || '#000000',
          stroke: options.stroke || '#000000',
          strokeWidth: options.strokeWidth || 1
        })
        break
      case 'line':
        fabricObject = new fabric.Line(
          [options.x1 || 0, options.y1 || 0, options.x2 || 100, options.y2 || 100],
          {
            stroke: options.stroke || '#000000',
            strokeWidth: options.strokeWidth || 1
          }
        )
        break
    }
    
    if (fabricObject) {
      this.canvas.add(fabricObject)
      this.scheduleRender()
      
      const now = new Date().toISOString()
      const baseElement = {
        id: `element-${Date.now()}-${Math.random()}`,
        boardId: 'default-board',
        position: { x: options.x || 0, y: options.y || 0 },
        size: { width: options.width || 100, height: options.height || 100 },
        rotation: 0,
        layerIndex: this.elements.length,
        createdBy: 'user',
        createdAt: now,
        updatedAt: now,
        isLocked: false,
        isVisible: true
      }
      
      let element: InternalCanvasElement
      
      switch (type) {
        case 'rectangle':
        case 'circle':
        case 'ellipse':
          element = {
            ...baseElement,
            type: type as 'rectangle' | 'circle' | 'ellipse',
            style: {
              fill: options.fill || '#ffffff',
              stroke: options.stroke || '#000000',
              strokeWidth: options.strokeWidth || 1,
              opacity: options.opacity || 1
            },
            fabricObject
          } as InternalCanvasElement
          break
          
        case 'line':
          element = {
            ...baseElement,
            type: 'line',
            startPoint: { x: options.x1 || 0, y: options.y1 || 0 },
            endPoint: { x: options.x2 || 100, y: options.y2 || 100 },
            style: {
              stroke: options.stroke || '#000000',
              strokeWidth: options.strokeWidth || 1,
              strokeDasharray: options.strokeDasharray
            },
            fabricObject
          } as InternalCanvasElement
          break
          
        default:
          // Fallback for other types
          element = {
            ...baseElement,
            type: type as ElementType,
            style: {
              stroke: options.stroke || '#000000',
              strokeWidth: options.strokeWidth || 1
            },
            fabricObject
          } as any
      }
      
      this.elements.push(element)
      return element
    }
    
    throw new Error(`Unknown element type: ${type}`)
  }

  startDrag(elementId: string, position: Position): void {
    this.dragState = {
      elementId,
      startPosition: { ...position },
      lastPosition: { ...position },
      velocity: { x: 0, y: 0 }
    }
  }

  updateDrag(position: Position): void {
    if (!this.dragState.elementId || !this.dragState.lastPosition) return
    
    const delta = {
      x: position.x - this.dragState.lastPosition.x,
      y: position.y - this.dragState.lastPosition.y
    }
    
    // Update velocity for momentum
    this.dragState.velocity = {
      x: delta.x * 0.8 + this.dragState.velocity.x * 0.2,
      y: delta.y * 0.8 + this.dragState.velocity.y * 0.2
    }
    
    this.dragState.lastPosition = { ...position }
    
    // Throttle updates for performance
    this.scheduleRender()
  }

  endDrag(): void {
    // Apply momentum if velocity is significant
    if (this.dragState.velocity.x !== 0 || this.dragState.velocity.y !== 0) {
      this.applyDragMomentum()
    }
    
    this.dragState = {
      elementId: null,
      startPosition: null,
      lastPosition: null,
      velocity: { x: 0, y: 0 }
    }
  }

  private applyDragMomentum(): void {
    const deceleration = 0.95
    const minVelocity = 0.5
    
    const animate = () => {
      if (!this.dragState.elementId) return
      
      // Apply velocity
      this.dragState.velocity.x *= deceleration
      this.dragState.velocity.y *= deceleration
      
      // Stop if velocity is too small
      if (Math.abs(this.dragState.velocity.x) < minVelocity && 
          Math.abs(this.dragState.velocity.y) < minVelocity) {
        this.dragState.velocity = { x: 0, y: 0 }
        return
      }
      
      // Update position
      const element = this.elements.find(e => e.id === this.dragState.elementId)
      if (element) {
        element.position.x += this.dragState.velocity.x
        element.position.y += this.dragState.velocity.y
        this.scheduleRender()
      }
      
      requestAnimationFrame(animate)
    }
    
    requestAnimationFrame(animate)
  }

  updateElementPosition(elementId: string, position: Position): void {
    const element = this.elements.find(e => e.id === elementId)
    if (element) {
      element.position = { ...position }
      if (element.fabricObject) {
        element.fabricObject.set({ left: position.x, top: position.y })
        element.fabricObject.setCoords()
      }
      this.scheduleRender()
    }
  }

  getElementPosition(elementId: string): Position {
    const element = this.elements.find(e => e.id === elementId)
    return element ? { ...element.position } : { x: 0, y: 0 }
  }

  startResize(elementId: string, handle: string): void {
    const element = this.elements.find(e => e.id === elementId)
    if (element) {
      this.resizeState = {
        elementId,
        handle,
        originalSize: { ...element.size },
        aspectRatioLocked: false
      }
    }
  }

  updateResize(size: Size): void {
    if (!this.resizeState.elementId) return
    
    const element = this.elements.find(e => e.id === this.resizeState.elementId)
    if (element) {
      if (this.resizeState.aspectRatioLocked && this.resizeState.originalSize) {
        const aspectRatio = this.resizeState.originalSize.width / this.resizeState.originalSize.height
        if (this.resizeState.handle?.includes('right')) {
          size.height = size.width / aspectRatio
        } else {
          size.width = size.height * aspectRatio
        }
      }
      
      element.size = { ...size }
      if (element.fabricObject) {
        element.fabricObject.set({ width: size.width, height: size.height })
        element.fabricObject.setCoords()
      }
      this.scheduleRender()
    }
  }

  getElementSize(elementId: string): Size {
    const element = this.elements.find(e => e.id === elementId)
    return element ? { ...element.size } : { width: 0, height: 0 }
  }

  setAspectRatioLocked(elementId: string, locked: boolean): void {
    if (this.resizeState.elementId === elementId) {
      this.resizeState.aspectRatioLocked = locked
    }
  }

  animateResize(elementId: string, options: {
    width: number
    height: number
    duration: number
    easing?: string
  }): void {
    const element = this.elements.find(e => e.id === elementId)
    if (!element) return
    
    const startSize = { ...element.size }
    const deltaSize = {
      width: options.width - startSize.width,
      height: options.height - startSize.height
    }
    const startTime = performance.now()
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / options.duration, 1)
      
      // Apply easing
      let easedProgress = progress
      if (options.easing === 'ease-out') {
        easedProgress = 1 - Math.pow(1 - progress, 3)
      }
      
      const currentSize = {
        width: startSize.width + deltaSize.width * easedProgress,
        height: startSize.height + deltaSize.height * easedProgress
      }
      
      element.size = currentSize
      if (element.fabricObject) {
        element.fabricObject.set({ width: currentSize.width, height: currentSize.height })
        element.fabricObject.setCoords()
      }
      this.scheduleRender()
      
      if (progress < 1) {
        this.animationState.activeAnimations.set(elementId, requestAnimationFrame(animate))
      } else {
        this.animationState.activeAnimations.delete(elementId)
      }
    }
    
    // Cancel any existing animation for this element
    const existingAnimation = this.animationState.activeAnimations.get(elementId)
    if (existingAnimation) {
      cancelAnimationFrame(existingAnimation)
    }
    
    this.animationState.activeAnimations.set(elementId, requestAnimationFrame(animate))
  }

  getElementScale(elementId: string): number {
    const element = this.elements.find(e => e.id === elementId)
    if (element && element.fabricObject) {
      return element.fabricObject.scaleX || 1
    }
    return 1
  }

  createElementAnimated(type: string, position: Position, options: any): InternalCanvasElement {
    const element = this.createElement(type, { ...options, x: position.x, y: position.y })
    
    // Start with scale 0
    if (element.fabricObject) {
      element.fabricObject.set({ scaleX: 0, scaleY: 0 })
    }
    
    // Animate to scale 1
    const duration = options.animationDuration || 300
    const startTime = performance.now()
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Bounce easing
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      
      if (element.fabricObject) {
        element.fabricObject.set({ scaleX: easedProgress, scaleY: easedProgress })
        element.fabricObject.setCoords()
      }
      this.scheduleRender()
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
    return element
  }

  startElementCreation(type: string): void {
    this.creationState.type = type
    this.creationState.preview = null
    this.creationState.startPosition = null
  }

  updateCreationPreview(position: Position): void {
    if (!this.creationState.type) return
    
    if (!this.creationState.preview) {
      // Create ghost preview
      const options = {
        x: position.x,
        y: position.y,
        fill: 'rgba(0, 0, 0, 0.2)',
        stroke: 'rgba(0, 0, 0, 0.5)',
        strokeWidth: 2
      }
      
      switch (this.creationState.type) {
        case 'rectangle':
          this.creationState.preview = new fabric.Rect({
            left: position.x,
            top: position.y,
            width: 0,
            height: 0,
            ...options
          })
          break
        case 'circle':
          this.creationState.preview = new fabric.Circle({
            left: position.x,
            top: position.y,
            radius: 0,
            ...options
          })
          break
      }
      
      if (this.creationState.preview) {
        this.canvas.add(this.creationState.preview)
      }
    } else {
      // Update preview position
      this.creationState.preview.set({ left: position.x, top: position.y })
      this.creationState.preview.setCoords()
    }
    
    this.scheduleRender()
  }

  getCreationPreview(): any {
    if (!this.creationState.preview) return null
    
    return {
      position: {
        x: this.creationState.preview.left || 0,
        y: this.creationState.preview.top || 0
      },
      opacity: this.creationState.preview.opacity || 0.5,
      width: this.creationState.preview.width || 0,
      height: this.creationState.preview.height || 0
    }
  }

  finishElementCreation(): CanvasElement | null {
    if (!this.creationState.preview) return null
    
    // Remove preview
    this.canvas.remove(this.creationState.preview)
    
    // Create actual element
    const element = this.createElement(this.creationState.type!, {
      x: this.creationState.preview.left,
      y: this.creationState.preview.top,
      width: this.creationState.preview.width || 100,
      height: this.creationState.preview.height || 100
    })
    
    // Reset state
    this.creationState = {
      type: null,
      preview: null,
      startPosition: null
    }
    
    return element
  }

  startDragCreation(type: string, startPosition: Position): void {
    this.creationState = {
      type,
      preview: null,
      startPosition: { ...startPosition }
    }
  }

  updateDragCreation(position: Position): void {
    if (!this.creationState.type || !this.creationState.startPosition) return
    
    const width = Math.abs(position.x - this.creationState.startPosition.x)
    const height = Math.abs(position.y - this.creationState.startPosition.y)
    const left = Math.min(position.x, this.creationState.startPosition.x)
    const top = Math.min(position.y, this.creationState.startPosition.y)
    
    if (!this.creationState.preview) {
      // Create preview
      const options = {
        left,
        top,
        width,
        height,
        fill: 'rgba(0, 0, 0, 0.2)',
        stroke: 'rgba(0, 0, 0, 0.5)',
        strokeWidth: 2
      }
      
      switch (this.creationState.type) {
        case 'rectangle':
          this.creationState.preview = new fabric.Rect(options)
          break
        case 'circle':
          const radius = Math.min(width, height) / 2
          this.creationState.preview = new fabric.Circle({
            ...options,
            radius
          })
          break
      }
      
      if (this.creationState.preview) {
        this.canvas.add(this.creationState.preview)
      }
    } else {
      // Update preview
      this.creationState.preview.set({ left, top, width, height })
      if (this.creationState.type === 'circle') {
        const radius = Math.min(width, height) / 2
        this.creationState.preview.set({ radius })
      }
      this.creationState.preview.setCoords()
    }
    
    this.scheduleRender()
  }

  finishDragCreation(): CanvasElement | null {
    return this.finishElementCreation()
  }

  startPan(_position: Position): void {
    this.isPanningActive = true
  }

  updatePan(_position: Position): void {
    // Pan logic already implemented in handleMouseMove
  }

  startPinchZoom(touches: Position[]): void {
    if (touches.length === 2) {
      const dx = touches[1].x - touches[0].x
      const dy = touches[1].y - touches[0].y
      this.lastTouchDistance = Math.sqrt(dx * dx + dy * dy)
      this.touchStartPoints = [...touches]
    }
  }

  updatePinchZoom(touches: Position[]): void {
    if (touches.length === 2 && this.lastTouchDistance > 0) {
      const dx = touches[1].x - touches[0].x
      const dy = touches[1].y - touches[0].y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      const scale = distance / this.lastTouchDistance
      const centerX = (touches[0].x + touches[1].x) / 2
      const centerY = (touches[0].y + touches[1].y) / 2
      
      this.zoomToPoint({ x: centerX, y: centerY }, this.camera.zoom * scale)
      
      this.lastTouchDistance = distance
    }
  }

  updateFrameStats(): void {
    const now = performance.now()
    if (this.performanceStats.lastUpdateTime > 0) {
      const frameTime = now - this.performanceStats.lastUpdateTime
      const fps = 1000 / frameTime
      
      this.performanceStats.frameCount++
      this.performanceStats.frameTimeSum += frameTime
      this.performanceStats.minFPS = Math.min(this.performanceStats.minFPS, fps)
      this.performanceStats.maxFPS = Math.max(this.performanceStats.maxFPS, fps)
      
      // Auto-adjust quality if FPS drops
      if (fps < 30 && this.renderQuality === 'high') {
        this.renderQuality = 'reduced'
        this.canvas.renderOnAddRemove = false
        this.canvas.skipOffscreen = true
      } else if (fps > 50 && this.renderQuality === 'reduced') {
        this.renderQuality = 'high'
        this.canvas.renderOnAddRemove = true
        this.canvas.skipOffscreen = false
      }
    }
    this.performanceStats.lastUpdateTime = now
  }

  getPerformanceStats(): {
    averageFPS: number
    minFPS: number
    maxFPS: number
  } {
    const averageFPS = this.performanceStats.frameCount > 0
      ? 1000 / (this.performanceStats.frameTimeSum / this.performanceStats.frameCount)
      : 60
    
    return {
      averageFPS,
      minFPS: this.performanceStats.minFPS,
      maxFPS: this.performanceStats.maxFPS
    }
  }

  getRenderQuality(): 'high' | 'reduced' {
    return this.renderQuality
  }

  /**
   * Enable or disable WebGL rendering
   */
  setWebGLEnabled(enabled: boolean): void {
    if (enabled && !this.webglRenderer) {
      this.initializeWebGL()
    } else if (!enabled && this.webglRenderer) {
      this.webglRenderer.dispose()
      this.webglRenderer = null
      this.webglEnabled = false
    }
  }

  /**
   * Set WebGL performance mode
   */
  setWebGLPerformanceMode(mode: 'auto' | 'performance' | 'quality'): void {
    if (this.webglRenderer) {
      this.webglRenderer.setPerformanceMode(mode)
    }
  }

  /**
   * Enable or disable viewport culling
   */
  setCullingEnabled(enabled: boolean): void {
    this.cullingEnabled = enabled
    if (enabled && !this.viewportCulling) {
      this.viewportCulling = new ViewportCulling()
    } else if (!enabled && this.viewportCulling) {
      this.viewportCulling.clear()
    }
  }

  /**
   * Get detailed performance statistics
   */
  getDetailedPerformanceStats(): {
    fps: number
    webgl: any
    culling: any
    crdt: any
  } {
    return {
      fps: this.currentFrameRate,
      webgl: this.webglRenderer?.getStats() || null,
      culling: this.viewportCulling?.getStats() || null,
      crdt: this.crdtManager?.getStats() || null
    }
  }

  /**
   * Check if WebGL is supported
   */
  static isWebGLSupported(): boolean {
    return WebGLRenderer.isSupported()
  }

  // Cleanup
  private isDisposed = false
  
  dispose(): void {
    // Prevent multiple disposal attempts
    if (this.isDisposed) {
      return
    }
    
    try {
      // Mark as disposed early to prevent race conditions
      this.isDisposed = true
      
      // Cancel any pending render requests
      if (this.renderThrottleId) {
        cancelAnimationFrame(this.renderThrottleId)
        this.renderThrottleId = null
      }
      
      if (this.renderRequestId) {
        cancelAnimationFrame(this.renderRequestId)
        this.renderRequestId = null
      }
      
      if (this.resizeDebounceTimer) {
        clearTimeout(this.resizeDebounceTimer)
        this.resizeDebounceTimer = null
      }
      
      // Remove canvas event listeners
      if (this.canvas) {
        this.canvas.off('mouse:wheel')
        this.canvas.off('mouse:down')
        this.canvas.off('mouse:move')
        this.canvas.off('mouse:up')
        this.canvas.off('selection:created')
        this.canvas.off('selection:updated')
        this.canvas.off('selection:cleared')
        this.canvas.off('object:added')
        this.canvas.off('object:removed')
        this.canvas.off('object:modified')
        this.canvas.off('object:moving')
        this.canvas.off('object:scaling')
        this.canvas.off('object:rotating')
      }
      
      // Remove document event listeners using stored bound handlers
      if (this.boundHandlers.keyDown) {
        document.removeEventListener('keydown', this.boundHandlers.keyDown)
      }
      if (this.boundHandlers.keyUp) {
        document.removeEventListener('keyup', this.boundHandlers.keyUp)
      }
      
      // Remove touch event listeners if canvas element exists
      const canvasEl = this.canvas?.getElement()
      if (canvasEl) {
        if (this.boundHandlers.touchStart) {
          canvasEl.removeEventListener('touchstart', this.boundHandlers.touchStart, { passive: false } as any)
        }
        if (this.boundHandlers.touchMove) {
          canvasEl.removeEventListener('touchmove', this.boundHandlers.touchMove, { passive: false } as any)
        }
        if (this.boundHandlers.touchEnd) {
          canvasEl.removeEventListener('touchend', this.boundHandlers.touchEnd, { passive: false } as any)
        }
      }
      
      // Clear all event listeners
      this.eventListeners.clear()
      
      // Cancel any pending renders
      if (this.renderThrottleId) {
        cancelAnimationFrame(this.renderThrottleId)
        this.renderThrottleId = null
      }
      
      // Disconnect resize observer
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
        this.resizeObserver = null
      }
      
      // Safely dispose fabric canvas
      if (this.canvas) {
        try {
          // Clear all objects first
          this.canvas.clear()
          
          // Get canvas elements before disposal for cleanup check
          const upperCanvasEl = (this.canvas as any).upperCanvasEl
          const lowerCanvasEl = (this.canvas as any).lowerCanvasEl
          const wrapperEl = (this.canvas as any).wrapperEl
          
          // Store parent references before disposal
          const upperParent = upperCanvasEl?.parentNode
          const lowerParent = lowerCanvasEl?.parentNode
          const wrapperParent = wrapperEl?.parentNode
          
          // Dispose the fabric canvas
          this.canvas.dispose()
          
          // Only attempt to remove elements if they still exist in DOM
          // The disposal may have already removed them
          if (upperCanvasEl && upperParent && upperCanvasEl.parentNode === upperParent) {
            try {
              upperParent.removeChild(upperCanvasEl)
            } catch {
              // Element already removed, ignore
            }
          }
          if (lowerCanvasEl && lowerParent && lowerCanvasEl.parentNode === lowerParent) {
            try {
              lowerParent.removeChild(lowerCanvasEl)
            } catch {
              // Element already removed, ignore
            }
          }
          if (wrapperEl && wrapperParent && wrapperEl.parentNode === wrapperParent) {
            try {
              wrapperParent.removeChild(wrapperEl)
            } catch {
              // Element already removed, ignore
            }
          }
        } catch (canvasError) {
          // Log but continue with cleanup
          console.warn('Error disposing fabric canvas:', canvasError)
        }
        
        // Nullify the canvas reference
        this.canvas = null as any
      }
      
      // Clear bound handlers
      this.boundHandlers = {}
      
      // Dispose performance features
      if (this.webglRenderer) {
        this.webglRenderer.dispose()
        this.webglRenderer = null
      }
      
      if (this.viewportCulling) {
        this.viewportCulling.clear()
        this.viewportCulling = null
      }
      
      if (this.crdtManager) {
        this.crdtManager.dispose()
        this.crdtManager = null
      }
      
      // Clear container reference
      this.container = null as any
    } catch (error) {
      console.error('Error during canvas disposal:', error)
      // Continue cleanup even if there's an error
    }
  }
}