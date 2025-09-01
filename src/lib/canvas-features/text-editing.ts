import { fabric } from 'fabric'
import { CanvasElement, TextElement, Position } from '@/types'

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

interface TextProperties {
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  textAlign?: string
  color?: string
  backgroundColor?: string
  lineHeight?: number
  letterSpacing?: number
}

export class TextEditingManager {
  private canvas: fabric.Canvas
  private editingElement: fabric.IText | null = null
  private onTextChanged?: (element: TextElement) => void
  private eventHandlers: Map<string, any> = new Map()

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    // Double-click to edit text
    const dblClickHandler = (event: fabric.IEvent) => {
      const target = event.target
      if (target && target.type === 'i-text') {
        this.startEditing(target as fabric.IText)
      }
    }
    this.canvas.on('mouse:dblclick', dblClickHandler)
    this.eventHandlers.set('mouse:dblclick', dblClickHandler)

    // Text changed event
    const textChangedHandler = (event: fabric.IEvent) => {
      if (this.editingElement && this.onTextChanged) {
        const element = this.convertToTextElement(this.editingElement)
        this.onTextChanged(element)
      }
    }
    this.canvas.on('text:changed', textChangedHandler)
    this.eventHandlers.set('text:changed', textChangedHandler)

    // Selection cleared - end editing
    const selectionClearedHandler = () => {
      if (this.editingElement) {
        this.endEditing()
      }
    }
    this.canvas.on('selection:cleared', selectionClearedHandler)
    this.eventHandlers.set('selection:cleared', selectionClearedHandler)
  }

  createTextElement(position: Position, properties?: TextProperties): TextElement {
    const defaultProperties: TextProperties = {
      text: 'Text',
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      color: '#000000',
      backgroundColor: 'transparent',
      lineHeight: 1.16,
      letterSpacing: 0,
    }

    const mergedProperties = { ...defaultProperties, ...properties }

    // Create fabric IText object
    const fabricText = new fabric.IText(mergedProperties.text || 'Text', {
      left: position.x,
      top: position.y,
      fontSize: mergedProperties.fontSize,
      fontFamily: mergedProperties.fontFamily,
      fontWeight: mergedProperties.fontWeight as any,
      fontStyle: mergedProperties.fontStyle as any,
      textAlign: mergedProperties.textAlign,
      fill: mergedProperties.color,
      backgroundColor: mergedProperties.backgroundColor,
      lineHeight: mergedProperties.lineHeight,
      charSpacing: mergedProperties.letterSpacing ? mergedProperties.letterSpacing * 1000 : 0,
      editable: true,
      selectable: true,
    })

    // Add to canvas
    this.canvas.add(fabricText)
    this.canvas.renderAll()

    // Convert to TextElement
    return this.convertToTextElement(fabricText)
  }

  startEditing(element: fabric.IText | any): void {
    if (!element || (element.type !== 'i-text' && element.type !== 'text')) {
      return
    }

    // Convert to IText if it's a regular text object
    let iText: fabric.IText
    if (element.type === 'text' && !(element instanceof fabric.IText)) {
      // Replace with IText
      const text = element.get('text')
      iText = new fabric.IText(text, {
        left: element.left,
        top: element.top,
        fontSize: element.fontSize,
        fontFamily: element.fontFamily,
        fontWeight: element.fontWeight,
        fontStyle: element.fontStyle,
        textAlign: element.textAlign,
        fill: element.fill,
        backgroundColor: element.backgroundColor,
        lineHeight: element.lineHeight,
        editable: true,
        selectable: true,
      })
      
      this.canvas.remove(element)
      this.canvas.add(iText)
    } else {
      iText = element as fabric.IText
    }

    this.editingElement = iText
    this.canvas.setActiveObject(iText)
    iText.enterEditing()
    iText.selectAll()
    this.canvas.renderAll()
  }

  endEditing(): void {
    if (this.editingElement) {
      this.editingElement.exitEditing()
      this.editingElement = null
      this.canvas.discardActiveObject()
      this.canvas.renderAll()
    }
  }

  updateTextProperty(element: fabric.IText | any, property: string, value: any): void {
    if (!element) return

    element.set(property, value)
    this.canvas.renderAll()

    if (this.onTextChanged) {
      const textElement = this.convertToTextElement(element)
      this.onTextChanged(textElement)
    }
  }

  toggleBold(element: fabric.IText | any): void {
    if (!element) return

    const currentWeight = element.get('fontWeight')
    const newWeight = currentWeight === 'bold' ? 'normal' : 'bold'
    this.updateTextProperty(element, 'fontWeight', newWeight)
  }

  toggleItalic(element: fabric.IText | any): void {
    if (!element) return

    const currentStyle = element.get('fontStyle')
    const newStyle = currentStyle === 'italic' ? 'normal' : 'italic'
    this.updateTextProperty(element, 'fontStyle', newStyle)
  }

  toggleUnderline(element: fabric.IText | any): void {
    if (!element) return

    const currentUnderline = element.get('underline')
    this.updateTextProperty(element, 'underline', !currentUnderline)
  }

  toggleStrikethrough(element: fabric.IText | any): void {
    if (!element) return

    const currentLinethrough = element.get('linethrough')
    this.updateTextProperty(element, 'linethrough', !currentLinethrough)
  }

  setTextWrapping(element: fabric.IText | any, maxWidth: number): void {
    if (!element) return

    element.set({
      width: maxWidth,
      splitByGrapheme: true,
    })
    this.canvas.renderAll()
  }

  handleKeyboardShortcut(event: KeyboardEvent, element?: fabric.IText | any): void {
    const activeElement = element || this.canvas.getActiveObject()
    if (!activeElement || activeElement.type !== 'i-text') return

    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'b':
          event.preventDefault()
          this.toggleBold(activeElement)
          break
        case 'i':
          event.preventDefault()
          this.toggleItalic(activeElement)
          break
        case 'u':
          event.preventDefault()
          this.toggleUnderline(activeElement)
          break
      }
    }
  }

  private convertToTextElement(fabricText: fabric.IText | fabric.Text): TextElement {
    const bounds = fabricText.getBoundingRect()
    
    return {
      id: (fabricText as any).id || generateId(),
      type: 'text',
      position: { x: fabricText.left || 0, y: fabricText.top || 0 },
      size: { width: bounds.width, height: bounds.height },
      content: {
        text: fabricText.text || '',
        fontSize: fabricText.fontSize || 16,
        fontFamily: fabricText.fontFamily || 'Arial',
        fontWeight: String(fabricText.fontWeight || 'normal'),
        fontStyle: String(fabricText.fontStyle || 'normal'),
        textAlign: (fabricText.textAlign || 'left') as 'left' | 'center' | 'right',
        color: fabricText.fill as string || '#000000',
        backgroundColor: fabricText.backgroundColor || 'transparent',
        lineHeight: fabricText.lineHeight || 1.16,
        letterSpacing: fabricText.charSpacing ? fabricText.charSpacing / 1000 : 0,
        underline: (fabricText as any).underline || false,
        strikethrough: (fabricText as any).linethrough || false,
      },
      rotation: fabricText.angle || 0,
      opacity: fabricText.opacity || 1,
      locked: !fabricText.selectable,
      visible: fabricText.visible !== false,
    }
  }

  onTextChange(callback: (element: TextElement) => void): void {
    this.onTextChanged = callback
  }

  dispose(): void {
    // Remove event listeners
    this.eventHandlers.forEach((handler, event) => {
      this.canvas.off(event as any, handler)
    })
    this.eventHandlers.clear()

    if (this.editingElement) {
      this.endEditing()
    }
  }
}

// Font presets for quick selection
export const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Comic Sans MS',
  'Impact',
  'Trebuchet MS',
  'Palatino',
  'Garamond',
  'Bookman',
  'Tahoma',
  'Lucida Console',
]

export const FONT_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96, 144,
]

export const TEXT_ALIGNMENTS = ['left', 'center', 'right', 'justify'] as const

export const LINE_HEIGHTS = [0.8, 1.0, 1.16, 1.2, 1.5, 1.8, 2.0, 2.5, 3.0]