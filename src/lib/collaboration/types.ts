export interface SelectionBox {
  x: number
  y: number
  width: number
  height: number
}

export interface UserSelection {
  userId: string
  box: SelectionBox
  color: string
  timestamp: number
}

export interface SelectionOverlap {
  users: string[]
  area: SelectionBox
}

export interface RenderedSelectionBox {
  type: 'selection-box'
  bounds: SelectionBox
  color: string
  userName: string
  strokeWidth: number
  strokeDashArray: number[]
}

export interface CursorPosition {
  x: number
  y: number
  timestamp: number
}

export interface UserCursor {
  userId: string
  position: CursorPosition
  color: string
  name: string
}

export interface RenderedCursor {
  type: 'cursor'
  position: CursorPosition
  color: string
  label: string
  trail?: CursorPosition[]
}

export interface CursorMessage {
  type: 'cursor-move'
  userId: string
  position: CursorPosition
}