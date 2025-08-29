import { fabric } from 'fabric'
import { 
  CanvasElement, 
  StickyNoteElement, 
  ShapeElement, 
  TextElement,
  Position, 
  Size 
} from '@/types'

interface StickyNoteContent {
  text?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  backgroundColor?: string
}

interface ShapeStyle {
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
}

interface TextContent {
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
}

export class ElementManager {
  private canvas: fabric.Canvas
  private boardId: string
  private elements: CanvasElement[] = []
  private nextLayerIndex = 0
  private currentUserId = 'user-123' // Will be replaced with actual auth

  constructor(canvas: fabric.Canvas, boardId: string) {
    this.canvas = canvas
    this.boardId = boardId
  }

  /**
   * Creates a sticky note element
   */
  createStickyNote(
    position: Position, 
    content?: StickyNoteContent, 
    size?: Size
  ): StickyNoteElement {
    // Sanitize position
    const safePosition = this.sanitizePosition(position)
    
    // Default values
    const defaultContent = {
      text: '',
      fontSize: 14,
      fontFamily: 'Inter, sans-serif',
      color: '#1F2937',
      backgroundColor: '#FEF08A'
    }

    const defaultSize = { width: 200, height: 150 }
    
    const finalContent = { ...defaultContent, ...content }
    const finalSize = size ? this.sanitizeSize(size) : defaultSize

    // Create the element data
    const stickyNote: StickyNoteElement = {
      id: this.generateId(),
      type: 'sticky_note',
      boardId: this.boardId,
      position: safePosition,
      size: finalSize,
      rotation: 0,
      layerIndex: this.nextLayerIndex++,
      createdBy: this.currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLocked: false,
      isVisible: true,
      content: finalContent
    }

    // Create Fabric.js objects
    this.createStickyNoteFabricObject(stickyNote)
    
    // Add to elements collection
    this.elements.push(stickyNote)
    
    return stickyNote
  }

  /**
   * Creates a rectangle element
   */
  createRectangle(
    position: Position, 
    style?: ShapeStyle, 
    size?: Size
  ): ShapeElement {
    const safePosition = this.sanitizePosition(position)
    
    const defaultStyle = {
      fill: '#E5E7EB',
      stroke: '#374151',
      strokeWidth: 2,
      opacity: 1
    }

    const defaultSize = { width: 200, height: 100 }
    
    const finalStyle = { ...defaultStyle, ...style }
    const finalSize = size ? this.sanitizeSize(size, { width: 10, height: 10 }) : defaultSize

    const rectangle: ShapeElement = {
      id: this.generateId(),
      type: 'rectangle',
      boardId: this.boardId,
      position: safePosition,
      size: finalSize,
      rotation: 0,
      layerIndex: this.nextLayerIndex++,
      createdBy: this.currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLocked: false,
      isVisible: true,
      style: finalStyle
    }

    // Create Fabric.js object
    this.createRectangleFabricObject(rectangle)
    
    this.elements.push(rectangle)
    return rectangle
  }

  /**
   * Creates a circle element
   */
  createCircle(
    position: Position, 
    style?: ShapeStyle, 
    size?: Size
  ): ShapeElement {
    const safePosition = this.sanitizePosition(position)
    
    const defaultStyle = {
      fill: '#E5E7EB',
      stroke: '#374151',
      strokeWidth: 2,
      opacity: 1
    }

    const defaultSize = { width: 100, height: 100 }
    
    const finalStyle = { ...defaultStyle, ...style }
    let finalSize = size ? this.sanitizeSize(size, { width: 20, height: 20 }) : defaultSize
    
    // Ensure circles are square (use smaller dimension)
    if (finalSize.width !== finalSize.height) {
      const diameter = Math.min(finalSize.width, finalSize.height)
      finalSize = { width: diameter, height: diameter }
    }

    const circle: ShapeElement = {
      id: this.generateId(),
      type: 'circle',
      boardId: this.boardId,
      position: safePosition,
      size: finalSize,
      rotation: 0,
      layerIndex: this.nextLayerIndex++,
      createdBy: this.currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLocked: false,
      isVisible: true,
      style: finalStyle
    }

    // Create Fabric.js object
    this.createCircleFabricObject(circle)
    
    this.elements.push(circle)
    return circle
  }

  /**
   * Creates a text element
   */
  createText(
    position: Position, 
    content?: TextContent
  ): TextElement {
    const safePosition = this.sanitizePosition(position)
    
    const defaultContent = {
      text: 'Text',
      fontSize: 18,
      fontFamily: 'Inter, sans-serif',
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'left' as const
    }
    
    const finalContent = { ...defaultContent, ...content }
    
    // Calculate text size based on content
    const textSize = this.calculateTextSize(finalContent)

    const textElement: TextElement = {
      id: this.generateId(),
      type: 'text',
      boardId: this.boardId,
      position: safePosition,
      size: textSize,
      rotation: 0,
      layerIndex: this.nextLayerIndex++,
      createdBy: this.currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLocked: false,
      isVisible: true,
      content: finalContent
    }

    // Create Fabric.js object
    this.createTextFabricObject(textElement)
    
    this.elements.push(textElement)
    return textElement
  }

  /**
   * Gets all elements
   */
  getElements(): CanvasElement[] {
    return [...this.elements]
  }

  /**
   * Gets element by ID
   */
  getElementById(id: string): CanvasElement | undefined {
    return this.elements.find(element => element.id === id)
  }

  /**
   * Removes element by ID
   */
  removeElement(id: string): boolean {
    const index = this.elements.findIndex(element => element.id === id)
    if (index === -1) return false

    // Remove from canvas
    const fabricObjects = this.canvas.getObjects()
    const fabricObject = fabricObjects.find(obj => (obj as any).elementId === id)
    if (fabricObject) {
      this.canvas.remove(fabricObject)
    }

    // Remove from elements collection
    this.elements.splice(index, 1)
    this.canvas.renderAll()
    
    return true
  }

  /**
   * Updates element
   */
  updateElement(id: string, updates: Partial<CanvasElement>): boolean {
    const element = this.getElementById(id)
    if (!element) return false

    // Update element data
    Object.assign(element, updates, {
      updatedAt: new Date().toISOString()
    })

    // Update Fabric object if needed
    this.updateFabricObject(element)
    
    return true
  }

  // Private helper methods

  private generateId(): string {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private sanitizePosition(position: Position): Position {
    return {
      x: isFinite(position.x) ? position.x : 0,
      y: isFinite(position.y) ? position.y : 0
    }
  }

  private sanitizeSize(size: Size, minSize = { width: 1, height: 1 }): Size {
    return {
      width: Math.max(minSize.width, Math.abs(size.width) || minSize.width),
      height: Math.max(minSize.height, Math.abs(size.height) || minSize.height)
    }
  }

  private calculateTextSize(content: TextContent): Size {
    // Basic text size calculation
    const text = content.text || 'Text'
    const fontSize = content.fontSize || 18
    
    // Rough estimation based on character count and font size
    const lines = text.split('\n')
    const maxLineLength = Math.max(...lines.map(line => line.length))
    
    const charWidth = fontSize * 0.6 // Approximate character width
    const lineHeight = fontSize * 1.2 // Line height with spacing
    
    return {
      width: Math.max(50, maxLineLength * charWidth),
      height: Math.max(fontSize, lines.length * lineHeight)
    }
  }

  private createStickyNoteFabricObject(element: StickyNoteElement): void {
    try {
      // Create background rectangle
      const background = new fabric.Rect({
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
        fill: element.content.backgroundColor,
        stroke: '#D1D5DB',
        strokeWidth: 1,
        rx: 8,
        ry: 8
      })

      // Create text
      const text = new fabric.Text(element.content.text, {
        left: element.position.x + 10,
        top: element.position.y + 10,
        width: element.size.width - 20,
        fontSize: element.content.fontSize,
        fontFamily: element.content.fontFamily,
        fill: element.content.color,
        textAlign: 'left'
      })

      // Group them together
      const group = new fabric.Group([background, text], {
        left: element.position.x,
        top: element.position.y,
        selectable: true
      })

      // Store element reference
      ;(group as any).elementId = element.id
      ;(group as any).elementType = element.type

      this.canvas.add(group)
      this.canvas.renderAll()

    } catch (error) {
      console.warn('Failed to create sticky note Fabric object:', error)
    }
  }

  private createRectangleFabricObject(element: ShapeElement): void {
    try {
      const rect = new fabric.Rect({
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
        fill: element.style.fill,
        stroke: element.style.stroke,
        strokeWidth: element.style.strokeWidth,
        opacity: element.style.opacity
      })

      ;(rect as any).elementId = element.id
      ;(rect as any).elementType = element.type

      rect.setCoords()
      rect.on('modified', () => this.handleFabricObjectModified(element.id))

      this.canvas.add(rect)
      this.canvas.renderAll()

    } catch (error) {
      console.warn('Failed to create rectangle Fabric object:', error)
    }
  }

  private createCircleFabricObject(element: ShapeElement): void {
    try {
      const radius = element.size.width / 2

      const circle = new fabric.Circle({
        left: element.position.x,
        top: element.position.y,
        radius: radius,
        fill: element.style.fill,
        stroke: element.style.stroke,
        strokeWidth: element.style.strokeWidth,
        opacity: element.style.opacity
      })

      ;(circle as any).elementId = element.id
      ;(circle as any).elementType = element.type

      circle.setCoords()
      circle.on('modified', () => this.handleFabricObjectModified(element.id))

      this.canvas.add(circle)
      this.canvas.renderAll()

    } catch (error) {
      console.warn('Failed to create circle Fabric object:', error)
    }
  }

  private createTextFabricObject(element: TextElement): void {
    try {
      const text = new fabric.Text(element.content.text, {
        left: element.position.x,
        top: element.position.y,
        fontSize: element.content.fontSize,
        fontFamily: element.content.fontFamily,
        fontWeight: element.content.fontWeight,
        fill: element.content.color,
        textAlign: element.content.textAlign
      })

      ;(text as any).elementId = element.id
      ;(text as any).elementType = element.type

      text.setCoords()
      text.on('modified', () => this.handleFabricObjectModified(element.id))

      this.canvas.add(text)
      this.canvas.renderAll()

    } catch (error) {
      console.warn('Failed to create text Fabric object:', error)
    }
  }

  private updateFabricObject(element: CanvasElement): void {
    const fabricObjects = this.canvas.getObjects()
    const fabricObject = fabricObjects.find(obj => (obj as any).elementId === element.id)
    
    if (fabricObject) {
      // Update common properties
      fabricObject.set({
        left: element.position.x,
        top: element.position.y,
        angle: element.rotation
      })

      // Update type-specific properties
      if (element.type === 'rectangle' || element.type === 'circle') {
        const shapeElement = element as ShapeElement
        fabricObject.set({
          fill: shapeElement.style.fill,
          stroke: shapeElement.style.stroke,
          strokeWidth: shapeElement.style.strokeWidth,
          opacity: shapeElement.style.opacity
        })
      }

      fabricObject.setCoords()
      this.canvas.renderAll()
    }
  }

  private handleFabricObjectModified(elementId: string): void {
    const element = this.getElementById(elementId)
    const fabricObjects = this.canvas.getObjects()
    const fabricObject = fabricObjects.find(obj => (obj as any).elementId === elementId)

    if (element && fabricObject) {
      // Update element position and rotation from Fabric object
      element.position.x = fabricObject.left || 0
      element.position.y = fabricObject.top || 0
      element.rotation = fabricObject.angle || 0
      element.updatedAt = new Date().toISOString()

      // Update size if the object supports scaling
      if (fabricObject.scaleX && fabricObject.scaleY) {
        element.size.width = (fabricObject.width || element.size.width) * fabricObject.scaleX
        element.size.height = (fabricObject.height || element.size.height) * fabricObject.scaleY
      }
    }
  }

  /**
   * Clear all elements
   */
  clear(): void {
    this.canvas.clear()
    this.elements = []
    this.nextLayerIndex = 0
  }

  /**
   * Get elements count
   */
  getElementsCount(): number {
    return this.elements.length
  }
}