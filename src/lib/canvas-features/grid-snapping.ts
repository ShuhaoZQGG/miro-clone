import { Position } from '@/types'

interface Size {
  width: number
  height: number
}

interface Element {
  position: Position
  size: Size
}

interface SnapResult {
  snapped: boolean
  snapPoints: Position
  distance: Position
}

interface AlignmentGuides {
  horizontal: number[]
  vertical: number[]
}

interface GridLines {
  horizontal: number[]
  vertical: number[]
}

export class GridSnappingManager {
  private gridSize: number = 20
  private enabled: boolean = false
  private snapThreshold: number = 5
  private showGuides: boolean = true

  constructor(gridSize?: number) {
    if (gridSize) {
      this.gridSize = gridSize
    }
  }

  // Configuration methods
  enable(): void {
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
  }

  toggle(): void {
    this.enabled = !this.enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setGridSize(size: number): void {
    this.gridSize = Math.max(1, size)
  }

  getGridSize(): number {
    return this.gridSize
  }

  setSnapThreshold(threshold: number): void {
    this.snapThreshold = Math.max(0, threshold)
  }

  getSnapThreshold(): number {
    return this.snapThreshold
  }

  setShowGuides(show: boolean): void {
    this.showGuides = show
  }

  // Basic snapping methods
  snapPosition(position: Position): Position {
    if (!this.enabled) {
      return position
    }

    return {
      x: Math.round(position.x / this.gridSize) * this.gridSize,
      y: Math.round(position.y / this.gridSize) * this.gridSize,
    }
  }

  snapSize(size: Size): Size {
    if (!this.enabled) {
      return size
    }

    return {
      width: Math.max(this.gridSize, Math.round(size.width / this.gridSize) * this.gridSize),
      height: Math.max(this.gridSize, Math.round(size.height / this.gridSize) * this.gridSize),
    }
  }

  // Smart snapping with threshold
  smartSnap(position: Position): Position {
    if (!this.enabled) {
      return position
    }

    const snappedPos = this.snapPosition(position)
    const distanceX = Math.abs(position.x - snappedPos.x)
    const distanceY = Math.abs(position.y - snappedPos.y)

    return {
      x: distanceX <= this.snapThreshold ? snappedPos.x : position.x,
      y: distanceY <= this.snapThreshold ? snappedPos.y : position.y,
    }
  }

  getSnapIndicators(position: Position): SnapResult {
    const snappedPos = this.snapPosition(position)
    const distanceX = Math.abs(position.x - snappedPos.x)
    const distanceY = Math.abs(position.y - snappedPos.y)

    return {
      snapped: distanceX <= this.snapThreshold || distanceY <= this.snapThreshold,
      snapPoints: snappedPos,
      distance: { x: distanceX, y: distanceY },
    }
  }

  // Alignment guides for element-to-element snapping
  getAlignmentGuides(currentElement: Element, otherElements: Element[]): AlignmentGuides {
    const guides: AlignmentGuides = {
      horizontal: [],
      vertical: [],
    }

    if (!this.enabled || !this.showGuides) {
      return guides
    }

    const current = {
      left: currentElement.position.x,
      right: currentElement.position.x + currentElement.size.width,
      top: currentElement.position.y,
      bottom: currentElement.position.y + currentElement.size.height,
      centerX: currentElement.position.x + currentElement.size.width / 2,
      centerY: currentElement.position.y + currentElement.size.height / 2,
    }

    otherElements.forEach((element) => {
      const other = {
        left: element.position.x,
        right: element.position.x + element.size.width,
        top: element.position.y,
        bottom: element.position.y + element.size.height,
        centerX: element.position.x + element.size.width / 2,
        centerY: element.position.y + element.size.height / 2,
      }

      // Horizontal alignment guides
      if (Math.abs(current.top - other.top) < this.snapThreshold) {
        guides.horizontal.push(other.top)
      }
      if (Math.abs(current.bottom - other.bottom) < this.snapThreshold) {
        guides.horizontal.push(other.bottom)
      }
      if (Math.abs(current.centerY - other.centerY) < this.snapThreshold) {
        guides.horizontal.push(other.centerY)
      }
      if (Math.abs(current.top - other.bottom) < this.snapThreshold) {
        guides.horizontal.push(other.bottom)
      }
      if (Math.abs(current.bottom - other.top) < this.snapThreshold) {
        guides.horizontal.push(other.top)
      }

      // Vertical alignment guides
      if (Math.abs(current.left - other.left) < this.snapThreshold) {
        guides.vertical.push(other.left)
      }
      if (Math.abs(current.right - other.right) < this.snapThreshold) {
        guides.vertical.push(other.right)
      }
      if (Math.abs(current.centerX - other.centerX) < this.snapThreshold) {
        guides.vertical.push(other.centerX)
      }
      if (Math.abs(current.left - other.right) < this.snapThreshold) {
        guides.vertical.push(other.right)
      }
      if (Math.abs(current.right - other.left) < this.snapThreshold) {
        guides.vertical.push(other.left)
      }
    })

    // Remove duplicates
    guides.horizontal = [...new Set(guides.horizontal)]
    guides.vertical = [...new Set(guides.vertical)]

    return guides
  }

  snapToGuides(position: Position, guides: AlignmentGuides, threshold?: number): Position {
    if (!this.enabled) {
      return position
    }

    const snapThreshold = threshold || this.snapThreshold
    let snappedX = position.x
    let snappedY = position.y

    // Snap to vertical guides
    for (const guide of guides.vertical) {
      if (Math.abs(position.x - guide) <= snapThreshold) {
        snappedX = guide
        break
      }
    }

    // Snap to horizontal guides
    for (const guide of guides.horizontal) {
      if (Math.abs(position.y - guide) <= snapThreshold) {
        snappedY = guide
        break
      }
    }

    return { x: snappedX, y: snappedY }
  }

  // Grid visualization
  getGridLines(canvasSize: Size, offset?: Position): GridLines {
    const lines: GridLines = {
      horizontal: [],
      vertical: [],
    }

    const offsetX = offset?.x || 0
    const offsetY = offset?.y || 0

    // Calculate starting points considering offset
    const startX = Math.floor(-offsetX / this.gridSize) * this.gridSize + offsetX
    const startY = Math.floor(-offsetY / this.gridSize) * this.gridSize + offsetY

    // Generate vertical lines
    for (let x = startX; x <= canvasSize.width; x += this.gridSize) {
      lines.vertical.push(x)
    }

    // Generate horizontal lines
    for (let y = startY; y <= canvasSize.height; y += this.gridSize) {
      lines.horizontal.push(y)
    }

    return lines
  }

  // Helper method to get snapped bounds
  snapBounds(bounds: { position: Position; size: Size }): { position: Position; size: Size } {
    if (!this.enabled) {
      return bounds
    }

    return {
      position: this.snapPosition(bounds.position),
      size: this.snapSize(bounds.size),
    }
  }

  // Get snap points for resize handles
  getResizeSnapPoints(element: Element, handle: string): Position[] {
    const points: Position[] = []

    if (!this.enabled) {
      return points
    }

    const { position, size } = element

    switch (handle) {
      case 'nw':
        points.push(this.snapPosition(position))
        break
      case 'ne':
        points.push(this.snapPosition({ x: position.x + size.width, y: position.y }))
        break
      case 'sw':
        points.push(this.snapPosition({ x: position.x, y: position.y + size.height }))
        break
      case 'se':
        points.push(this.snapPosition({ x: position.x + size.width, y: position.y + size.height }))
        break
      case 'n':
        points.push(this.snapPosition({ x: position.x + size.width / 2, y: position.y }))
        break
      case 's':
        points.push(this.snapPosition({ x: position.x + size.width / 2, y: position.y + size.height }))
        break
      case 'e':
        points.push(this.snapPosition({ x: position.x + size.width, y: position.y + size.height / 2 }))
        break
      case 'w':
        points.push(this.snapPosition({ x: position.x, y: position.y + size.height / 2 }))
        break
    }

    return points
  }

  // Calculate grid cell for a position
  getGridCell(position: Position): { col: number; row: number } {
    return {
      col: Math.floor(position.x / this.gridSize),
      row: Math.floor(position.y / this.gridSize),
    }
  }

  // Get position from grid cell
  getCellPosition(col: number, row: number): Position {
    return {
      x: col * this.gridSize,
      y: row * this.gridSize,
    }
  }
}

// Preset grid sizes
export const GRID_SIZES = {
  TINY: 5,
  SMALL: 10,
  MEDIUM: 20,
  LARGE: 50,
  HUGE: 100,
}

// Default export for convenience
export default GridSnappingManager