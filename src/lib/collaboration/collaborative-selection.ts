import { SelectionBox, UserSelection, SelectionOverlap, RenderedSelectionBox } from './types'

interface ElementBounds {
  id: string
  position: { x: number; y: number }
  size: { width: number; height: number }
}

export class CollaborativeSelection {
  private userSelections: Map<string, UserSelection> = new Map()

  /**
   * Update or create user selection
   */
  updateUserSelection(userId: string, box: SelectionBox, color: string): void {
    this.userSelections.set(userId, {
      userId,
      box,
      color,
      timestamp: Date.now()
    })
  }

  /**
   * Clear user selection
   */
  clearUserSelection(userId: string): void {
    this.userSelections.delete(userId)
  }

  /**
   * Get specific user's selection
   */
  getUserSelection(userId: string): UserSelection | undefined {
    return this.userSelections.get(userId)
  }

  /**
   * Get all active selections
   */
  getAllSelections(): UserSelection[] {
    return Array.from(this.userSelections.values())
  }

  /**
   * Get elements selected by a user
   */
  getSelectedElements(userId: string, elements: ElementBounds[]): string[] {
    const selection = this.userSelections.get(userId)
    if (!selection) return []

    const selectedIds: string[] = []
    const { box } = selection

    for (const element of elements) {
      if (this.isElementInSelection(element, box)) {
        selectedIds.push(element.id)
      }
    }

    return selectedIds
  }

  /**
   * Check if element intersects with selection box
   */
  private isElementInSelection(element: ElementBounds, selection: SelectionBox): boolean {
    const elemLeft = element.position.x
    const elemRight = element.position.x + element.size.width
    const elemTop = element.position.y
    const elemBottom = element.position.y + element.size.height

    const selLeft = selection.x
    const selRight = selection.x + selection.width
    const selTop = selection.y
    const selBottom = selection.y + selection.height

    // Check for intersection
    return !(
      elemRight < selLeft ||
      elemLeft > selRight ||
      elemBottom < selTop ||
      elemTop > selBottom
    )
  }

  /**
   * Create visual representation of selection box
   */
  renderSelectionBox(userId: string, userName: string): RenderedSelectionBox | null {
    const selection = this.userSelections.get(userId)
    if (!selection) return null

    return {
      type: 'selection-box',
      bounds: selection.box,
      color: selection.color,
      userName,
      strokeWidth: 2,
      strokeDashArray: [5, 5]
    }
  }

  /**
   * Detect overlapping selections
   */
  detectOverlap(): SelectionOverlap[] {
    const overlaps: SelectionOverlap[] = []
    const selections = Array.from(this.userSelections.values())

    for (let i = 0; i < selections.length; i++) {
      for (let j = i + 1; j < selections.length; j++) {
        const overlap = this.getOverlapArea(selections[i].box, selections[j].box)
        if (overlap) {
          overlaps.push({
            users: [selections[i].userId, selections[j].userId],
            area: overlap
          })
        }
      }
    }

    return overlaps
  }

  /**
   * Calculate overlap area between two selection boxes
   */
  private getOverlapArea(box1: SelectionBox, box2: SelectionBox): SelectionBox | null {
    const left = Math.max(box1.x, box2.x)
    const right = Math.min(box1.x + box1.width, box2.x + box2.width)
    const top = Math.max(box1.y, box2.y)
    const bottom = Math.min(box1.y + box1.height, box2.y + box2.height)

    if (left < right && top < bottom) {
      return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top
      }
    }

    return null
  }

  /**
   * Clear all selections
   */
  clearAll(): void {
    this.userSelections.clear()
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.clearAll()
  }
}