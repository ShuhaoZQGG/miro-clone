import { fabric } from 'fabric'
import { 
  CanvasElement, 
  StickyNoteElement, 
  ShapeElement, 
  LineElement,
  TextElement,
  ConnectorElement,
  FreehandElement,
  ImageElement,
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

interface LineStyle {
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string
}

interface TextContent {
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
}

interface ConnectorOptions {
  style?: 'straight' | 'curved' | 'stepped'
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string
  arrowStart?: boolean
  arrowEnd?: boolean
  startElementId?: string
  endElementId?: string
}

interface FreehandOptions {
  brushSize?: number
  color?: string
  opacity?: number
}

interface ImageOptions {
  size?: Size
  alt?: string
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
   * Creates an ellipse element
   */
  createEllipse(
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
    const finalSize = size ? this.sanitizeSize(size, { width: 20, height: 20 }) : defaultSize

    const ellipse: ShapeElement = {
      id: this.generateId(),
      type: 'ellipse',
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
    this.createEllipseFabricObject(ellipse)
    
    this.elements.push(ellipse)
    return ellipse
  }

  /**
   * Creates a line element
   */
  createLine(
    startPoint: Position,
    endPoint: Position,
    style?: LineStyle
  ): LineElement {
    const defaultStyle = {
      stroke: '#000000',
      strokeWidth: 2,
      strokeDasharray: undefined
    }
    
    const finalStyle = { ...defaultStyle, ...style }
    
    // Calculate position and size from start and end points
    const position = {
      x: Math.min(startPoint.x, endPoint.x),
      y: Math.min(startPoint.y, endPoint.y)
    }
    
    const size = {
      width: Math.abs(endPoint.x - startPoint.x),
      height: Math.abs(endPoint.y - startPoint.y)
    }

    const line: LineElement = {
      id: this.generateId(),
      type: 'line',
      boardId: this.boardId,
      position,
      size,
      rotation: 0,
      layerIndex: this.nextLayerIndex++,
      createdBy: this.currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLocked: false,
      isVisible: true,
      startPoint,
      endPoint,
      style: finalStyle
    }

    // Create Fabric.js object
    this.createLineFabricObject(line)
    
    this.elements.push(line)
    return line
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

  private createEllipseFabricObject(element: ShapeElement): void {
    try {
      const ellipse = new fabric.Ellipse({
        left: element.position.x,
        top: element.position.y,
        rx: element.size.width / 2,
        ry: element.size.height / 2,
        fill: element.style.fill,
        stroke: element.style.stroke,
        strokeWidth: element.style.strokeWidth,
        opacity: element.style.opacity
      })

      ;(ellipse as any).elementId = element.id
      ;(ellipse as any).elementType = element.type

      ellipse.setCoords()
      ellipse.on('modified', () => this.handleFabricObjectModified(element.id))

      this.canvas.add(ellipse)
      this.canvas.renderAll()

    } catch (error) {
      console.warn('Failed to create ellipse Fabric object:', error)
    }
  }

  private createLineFabricObject(element: LineElement): void {
    try {
      const line = new fabric.Line([
        element.startPoint.x,
        element.startPoint.y,
        element.endPoint.x,
        element.endPoint.y
      ], {
        stroke: element.style.stroke,
        strokeWidth: element.style.strokeWidth,
        strokeDashArray: element.style.strokeDasharray ? element.style.strokeDasharray.split(',').map(Number) : undefined,
        selectable: true,
        hasControls: true,
        hasBorders: true
      })

      ;(line as any).elementId = element.id
      ;(line as any).elementType = element.type

      line.setCoords()
      line.on('modified', () => this.handleFabricObjectModified(element.id))

      this.canvas.add(line)
      this.canvas.renderAll()

    } catch (error) {
      console.warn('Failed to create line Fabric object:', error)
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
      if (element.type === 'rectangle' || element.type === 'circle' || element.type === 'ellipse') {
        const shapeElement = element as ShapeElement
        fabricObject.set({
          fill: shapeElement.style.fill,
          stroke: shapeElement.style.stroke,
          strokeWidth: shapeElement.style.strokeWidth,
          opacity: shapeElement.style.opacity
        })
      } else if (element.type === 'line') {
        const lineElement = element as LineElement
        fabricObject.set({
          stroke: lineElement.style.stroke,
          strokeWidth: lineElement.style.strokeWidth
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

  /**
   * Creates a connector element
   */
  createConnector(
    startPoint: Position,
    endPoint: Position,
    options: ConnectorOptions = {}
  ): ConnectorElement {
    const id = `connector-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const connector: ConnectorElement = {
      id,
      type: 'connector',
      boardId: this.boardId,
      position: {
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y)
      },
      size: {
        width: Math.abs(endPoint.x - startPoint.x),
        height: Math.abs(endPoint.y - startPoint.y)
      },
      rotation: 0,
      layerIndex: this.nextLayerIndex++,
      createdBy: this.currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLocked: false,
      isVisible: true,
      connection: {
        startElementId: options.startElementId,
        endElementId: options.endElementId,
        startPoint,
        endPoint,
        style: options.style || 'straight'
      },
      style: {
        stroke: options.stroke || '#000000',
        strokeWidth: options.strokeWidth || 2,
        strokeDasharray: options.strokeDasharray,
        arrowStart: options.arrowStart || false,
        arrowEnd: options.arrowEnd !== undefined ? options.arrowEnd : true
      }
    }

    this.elements.push(connector)
    this.createConnectorFabricObject(connector)
    
    return connector
  }

  /**
   * Creates a freehand drawing element
   */
  createFreehand(
    points: Position[],
    options: FreehandOptions = {}
  ): FreehandElement {
    const id = `freehand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Calculate bounds
    const minX = Math.min(...points.map(p => p.x))
    const minY = Math.min(...points.map(p => p.y))
    const maxX = Math.max(...points.map(p => p.x))
    const maxY = Math.max(...points.map(p => p.y))
    
    const freehand: FreehandElement = {
      id,
      type: 'freehand',
      boardId: this.boardId,
      position: { x: minX, y: minY },
      size: {
        width: maxX - minX,
        height: maxY - minY
      },
      rotation: 0,
      layerIndex: this.nextLayerIndex++,
      createdBy: this.currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLocked: false,
      isVisible: true,
      path: {
        points,
        brushSize: options.brushSize || 2,
        color: options.color || '#000000',
        opacity: options.opacity || 1
      }
    }

    this.elements.push(freehand)
    this.createFreehandFabricObject(freehand)
    
    return freehand
  }

  /**
   * Creates an image element
   */
  createImage(
    position: Position,
    url: string,
    originalSize: Size,
    options: ImageOptions = {}
  ): ImageElement {
    const id = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Calculate size maintaining aspect ratio if needed
    let size = options.size || originalSize
    if (options.size && options.size.height === 0) {
      const ratio = originalSize.height / originalSize.width
      size = {
        width: options.size.width,
        height: options.size.width * ratio
      }
    }
    
    const image: ImageElement = {
      id,
      type: 'image',
      boardId: this.boardId,
      position,
      size,
      rotation: 0,
      layerIndex: this.nextLayerIndex++,
      createdBy: this.currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLocked: false,
      isVisible: true,
      content: {
        url,
        alt: options.alt,
        originalSize
      }
    }

    this.elements.push(image)
    this.createImageFabricObject(image)
    
    return image
  }

  /**
   * Creates Fabric object for connector
   */
  private createConnectorFabricObject(connector: ConnectorElement): void {
    try {
      const { startPoint, endPoint, style } = connector.connection
      
      // Create path string based on connector style
      let pathString = ''
      if (style === 'curved') {
        const cp1x = startPoint.x + (endPoint.x - startPoint.x) / 3
        const cp1y = startPoint.y
        const cp2x = startPoint.x + (endPoint.x - startPoint.x) * 2 / 3
        const cp2y = endPoint.y
        pathString = `M ${startPoint.x} ${startPoint.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endPoint.x} ${endPoint.y}`
      } else if (style === 'stepped') {
        const midX = (startPoint.x + endPoint.x) / 2
        pathString = `M ${startPoint.x} ${startPoint.y} L ${midX} ${startPoint.y} L ${midX} ${endPoint.y} L ${endPoint.x} ${endPoint.y}`
      } else {
        pathString = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`
      }
      
      const path = new fabric.Path(pathString, {
        stroke: connector.style.stroke,
        strokeWidth: connector.style.strokeWidth,
        strokeDashArray: connector.style.strokeDasharray ? connector.style.strokeDasharray.split(',').map(Number) : undefined,
        fill: '',
        selectable: true,
        hasControls: true,
        hasBorders: true,
        lockRotation: true
      })
      
      // Add arrow heads if needed
      if (connector.style.arrowEnd || connector.style.arrowStart) {
        // This would need a more complex implementation with arrow heads
        // For now, we'll just use the path
      }
      
      ;(path as any).elementId = connector.id
      this.canvas.add(path)
    } catch (error) {
      console.warn('Failed to create connector Fabric object:', error)
    }
  }

  /**
   * Creates Fabric object for freehand drawing
   */
  private createFreehandFabricObject(freehand: FreehandElement): void {
    try {
      const { points, brushSize, color, opacity } = freehand.path
      
      // Create path string from points
      let pathString = ''
      points.forEach((point, index) => {
        if (index === 0) {
          pathString += `M ${point.x} ${point.y}`
        } else {
          pathString += ` L ${point.x} ${point.y}`
        }
      })
      
      const path = new fabric.Path(pathString, {
        stroke: color,
        strokeWidth: brushSize,
        fill: '',
        opacity,
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        selectable: true,
        hasControls: true,
        hasBorders: true
      })
      
      ;(path as any).elementId = freehand.id
      this.canvas.add(path)
    } catch (error) {
      console.warn('Failed to create freehand Fabric object:', error)
    }
  }

  /**
   * Creates Fabric object for image
   */
  private createImageFabricObject(image: ImageElement): void {
    try {
      fabric.Image.fromURL(image.content.url, (fabricImage) => {
        fabricImage.set({
          left: image.position.x,
          top: image.position.y,
          width: image.size.width,
          height: image.size.height,
          selectable: true,
          hasControls: true,
          hasBorders: true
        })
        
        ;(fabricImage as any).elementId = image.id
        this.canvas.add(fabricImage)
      })
    } catch (error) {
      console.warn('Failed to create image Fabric object:', error)
    }
  }
}