export interface GridOptions {
  color?: string
  lineWidth?: number
  opacity?: number
}

export interface Point {
  x: number
  y: number
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

export class GridSnapping {
  private gridSize: number = 10
  private enabled: boolean = true
  private readonly MIN_GRID_SIZE = 1
  private readonly MIN_DIMENSION = 10

  constructor(gridSize: number = 10, enabled: boolean = true) {
    this.setGridSize(gridSize)
    this.enabled = enabled
  }

  setGridSize(size: number): void {
    this.gridSize = Math.max(this.MIN_GRID_SIZE, size)
  }

  getGridSize(): number {
    return this.gridSize
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  snapToGrid(x: number, y: number): Point {
    if (!this.enabled) {
      return { x, y }
    }

    return {
      x: this.snapValue(x),
      y: this.snapValue(y),
    }
  }

  private snapValue(value: number): number {
    return Math.round(value / this.gridSize) * this.gridSize
  }

  snapRectangle(rect: Rectangle): Rectangle {
    if (!this.enabled) {
      return rect
    }

    const snappedX = this.snapValue(rect.x)
    const snappedY = this.snapValue(rect.y)
    const snappedRight = this.snapValue(rect.x + rect.width)
    const snappedBottom = this.snapValue(rect.y + rect.height)

    let width = snappedRight - snappedX
    let height = snappedBottom - snappedY

    // Ensure minimum dimensions
    if (width < this.MIN_DIMENSION) {
      width = Math.max(this.MIN_DIMENSION, this.gridSize)
    }
    if (height < this.MIN_DIMENSION) {
      height = Math.max(this.MIN_DIMENSION, this.gridSize)
    }

    return {
      x: snappedX,
      y: snappedY,
      width,
      height,
    }
  }

  snapDistance(distance: number): number {
    if (!this.enabled) {
      return distance
    }

    return this.snapValue(distance)
  }

  getSnapOffset(x: number, y: number): { dx: number; dy: number } {
    if (!this.enabled) {
      return { dx: 0, dy: 0 }
    }

    const snapped = this.snapToGrid(x, y)
    return {
      dx: snapped.x - x,
      dy: snapped.y - y,
    }
  }

  snapDelta(from: Point, to: Point): { dx: number; dy: number } {
    if (!this.enabled) {
      return {
        dx: to.x - from.x,
        dy: to.y - from.y,
      }
    }

    const deltaX = to.x - from.x
    const deltaY = to.y - from.y

    const snappedDeltaX = this.snapValue(deltaX)
    const snappedDeltaY = this.snapValue(deltaY)

    return {
      dx: snappedDeltaX,
      dy: snappedDeltaY,
    }
  }

  drawGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options: GridOptions = {}
  ): void {
    if (!this.enabled) {
      return
    }

    const {
      color = '#e5e7eb',
      lineWidth = 0.5,
      opacity = 1,
    } = options

    ctx.save()
    
    ctx.globalAlpha = opacity
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    
    ctx.beginPath()

    // Draw vertical lines
    for (let x = 0; x <= width; x += this.gridSize) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y += this.gridSize) {
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
    }

    ctx.stroke()
    ctx.restore()
  }

  getNearestGridPoint(x: number, y: number): Point {
    return this.snapToGrid(x, y)
  }

  isOnGrid(x: number, y: number): boolean {
    if (!this.enabled) {
      return true
    }

    return x % this.gridSize === 0 && y % this.gridSize === 0
  }

  getGridLines(
    bounds: Rectangle
  ): { vertical: number[]; horizontal: number[] } {
    const vertical: number[] = []
    const horizontal: number[] = []

    if (!this.enabled) {
      return { vertical, horizontal }
    }

    // Calculate grid lines within bounds
    const startX = Math.floor(bounds.x / this.gridSize) * this.gridSize
    const startY = Math.floor(bounds.y / this.gridSize) * this.gridSize
    const endX = bounds.x + bounds.width
    const endY = bounds.y + bounds.height

    for (let x = startX; x <= endX; x += this.gridSize) {
      if (x >= bounds.x) {
        vertical.push(x)
      }
    }

    for (let y = startY; y <= endY; y += this.gridSize) {
      if (y >= bounds.y) {
        horizontal.push(y)
      }
    }

    return { vertical, horizontal }
  }
}