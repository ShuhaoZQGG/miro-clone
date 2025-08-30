import { fabric } from 'fabric'

export interface TouchPoint {
  x: number
  y: number
  id: number
}

export class TouchGestureHandler {
  private canvas: fabric.Canvas
  private touchPoints = new Map<number, TouchPoint>()
  private lastTouchDistance = 0
  private lastTouchAngle = 0
  private lastTouchCenter: { x: number; y: number } | null = null
  private isPanning = false
  private isZooming = false
  private isRotating = false
  private longPressTimer: NodeJS.Timeout | null = null
  private tapCount = 0
  private lastTapTime = 0

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    const canvasElement = this.canvas.getElement()
    
    canvasElement.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    canvasElement.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    canvasElement.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })
    canvasElement.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false })
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault()
    
    Array.from(event.touches).forEach(touch => {
      this.touchPoints.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
        id: touch.identifier
      })
    })

    const touchCount = this.touchPoints.size

    if (touchCount === 1) {
      this.handleSingleTouchStart(event.touches[0])
    } else if (touchCount === 2) {
      this.handleMultiTouchStart()
    }
  }

  private handleSingleTouchStart(touch: Touch): void {
    const now = Date.now()
    const timeSinceLastTap = now - this.lastTapTime
    
    if (timeSinceLastTap < 300) {
      this.tapCount++
      if (this.tapCount === 2) {
        this.handleDoubleTap(touch)
        this.tapCount = 0
      }
    } else {
      this.tapCount = 1
    }
    
    this.lastTapTime = now

    this.longPressTimer = setTimeout(() => {
      this.handleLongPress(touch)
    }, 500)
  }

  private handleMultiTouchStart(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }

    const points = Array.from(this.touchPoints.values())
    if (points.length === 2) {
      this.lastTouchDistance = this.calculateDistance(points[0], points[1])
      this.lastTouchAngle = this.calculateAngle(points[0], points[1])
      this.lastTouchCenter = this.calculateCenter(points[0], points[1])
      
      this.isPanning = true
      this.isZooming = true
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault()

    Array.from(event.touches).forEach(touch => {
      this.touchPoints.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
        id: touch.identifier
      })
    })

    const touchCount = this.touchPoints.size

    if (touchCount === 1) {
      this.handleSingleTouchMove(event.touches[0])
    } else if (touchCount === 2) {
      this.handleMultiTouchMove()
    }
  }

  private handleSingleTouchMove(touch: Touch): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }

    const pointer = this.canvas.getPointer(touch as any)
    const activeObject = this.canvas.getActiveObject()
    
    if (activeObject) {
      const deltaX = pointer.x - activeObject.left!
      const deltaY = pointer.y - activeObject.top!
      
      activeObject.set({
        left: pointer.x - deltaX,
        top: pointer.y - deltaY
      })
      
      this.canvas.renderAll()
    }
  }

  private handleMultiTouchMove(): void {
    const points = Array.from(this.touchPoints.values())
    if (points.length !== 2) return

    const currentDistance = this.calculateDistance(points[0], points[1])
    const currentAngle = this.calculateAngle(points[0], points[1])
    const currentCenter = this.calculateCenter(points[0], points[1])

    if (this.isZooming && this.lastTouchDistance > 0) {
      this.handlePinchZoom(currentDistance)
    }

    if (this.isRotating && Math.abs(currentAngle - this.lastTouchAngle) > 0.1) {
      this.handleRotation(currentAngle)
    }

    if (this.isPanning && this.lastTouchCenter) {
      this.handlePan(currentCenter)
    }

    this.lastTouchDistance = currentDistance
    this.lastTouchAngle = currentAngle
    this.lastTouchCenter = currentCenter
  }

  private handlePinchZoom(currentDistance: number): void {
    if (this.lastTouchDistance === 0) return

    const scale = currentDistance / this.lastTouchDistance
    const zoom = this.canvas.getZoom() * scale
    const clampedZoom = Math.max(0.1, Math.min(5, zoom))
    
    const center = this.lastTouchCenter!
    this.canvas.zoomToPoint(new fabric.Point(center.x, center.y), clampedZoom)
    this.canvas.renderAll()
  }

  private handleRotation(currentAngle: number): void {
    const deltaAngle = currentAngle - this.lastTouchAngle
    const activeObject = this.canvas.getActiveObject()
    
    if (activeObject) {
      const currentRotation = activeObject.angle || 0
      activeObject.rotate((currentRotation + deltaAngle) % 360)
      this.canvas.renderAll()
    }
  }

  private handlePan(currentCenter: { x: number; y: number }): void {
    if (!this.lastTouchCenter) return

    const deltaX = currentCenter.x - this.lastTouchCenter.x
    const deltaY = currentCenter.y - this.lastTouchCenter.y
    
    const vpt = this.canvas.viewportTransform!
    vpt[4] += deltaX
    vpt[5] += deltaY
    
    this.canvas.setViewportTransform(vpt)
    this.canvas.renderAll()
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault()

    Array.from(event.changedTouches).forEach(touch => {
      this.touchPoints.delete(touch.identifier)
    })

    if (this.touchPoints.size === 0) {
      this.resetGestureState()
    } else if (this.touchPoints.size === 1) {
      this.isPanning = false
      this.isZooming = false
      this.isRotating = false
    }
  }

  private handleTouchCancel(event: TouchEvent): void {
    this.handleTouchEnd(event)
  }

  private handleDoubleTap(touch: Touch): void {
    const pointer = this.canvas.getPointer(touch as any)
    const zoom = this.canvas.getZoom()
    const newZoom = zoom === 1 ? 2 : 1
    
    this.canvas.zoomToPoint(new fabric.Point(pointer.x, pointer.y), newZoom)
    this.canvas.renderAll()
  }

  private handleLongPress(touch: Touch): void {
    const pointer = this.canvas.getPointer(touch as any)
    const target = this.canvas.findTarget(touch as any, false)
    
    if (target) {
      const event = new CustomEvent('contextmenu', {
        detail: {
          target,
          pointer,
          touch: true
        }
      })
      
      this.canvas.fire('touch:longpress', event)
    }
  }

  private calculateDistance(p1: TouchPoint, p2: TouchPoint): number {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  private calculateAngle(p1: TouchPoint, p2: TouchPoint): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI)
  }

  private calculateCenter(p1: TouchPoint, p2: TouchPoint): { x: number; y: number } {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    }
  }

  private resetGestureState(): void {
    this.isPanning = false
    this.isZooming = false
    this.isRotating = false
    this.lastTouchDistance = 0
    this.lastTouchAngle = 0
    this.lastTouchCenter = null
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
  }

  destroy(): void {
    const canvasElement = this.canvas.getElement()
    
    canvasElement.removeEventListener('touchstart', this.handleTouchStart.bind(this))
    canvasElement.removeEventListener('touchmove', this.handleTouchMove.bind(this))
    canvasElement.removeEventListener('touchend', this.handleTouchEnd.bind(this))
    canvasElement.removeEventListener('touchcancel', this.handleTouchCancel.bind(this))
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
    }
  }
}