import { TextElement } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export class TextEditor {
  private canvas: HTMLCanvasElement
  private editorElement: HTMLDivElement | null = null
  private currentElement: TextElement | null = null
  private originalText: string = ''
  private onUpdate?: (element: Partial<TextElement>) => void
  private onComplete?: (element: TextElement) => void
  private clickOutsideHandler?: (e: MouseEvent) => void

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  startEditing(
    element: TextElement,
    onUpdate: (element: Partial<TextElement>) => void,
    onComplete: (element: TextElement) => void
  ): void {
    this.stopEditing() // Clean up any existing editor
    
    this.currentElement = { ...element }
    this.originalText = element.text || ''
    this.onUpdate = onUpdate
    this.onComplete = onComplete
    
    this.createEditor()
    this.positionEditor()
    this.applyStyles()
    this.attachEventListeners()
    this.focus()
  }

  private createEditor(): void {
    this.editorElement = document.createElement('div')
    this.editorElement.className = 'text-editor-overlay'
    this.editorElement.contentEditable = 'true'
    this.editorElement.textContent = this.currentElement?.text || ''
    
    // Base styles for positioning
    Object.assign(this.editorElement.style, {
      position: 'absolute',
      zIndex: '9999',
      outline: '2px solid #4F46E5',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '4px',
      minWidth: '50px',
      minHeight: '20px',
      borderRadius: '2px',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    })
    
    document.body.appendChild(this.editorElement)
  }

  private positionEditor(): void {
    if (!this.editorElement || !this.currentElement) return
    
    const rect = this.canvas.getBoundingClientRect()
    
    Object.assign(this.editorElement.style, {
      left: `${rect.left + this.currentElement.x}px`,
      top: `${rect.top + this.currentElement.y}px`,
      width: `${this.currentElement.width || 150}px`,
      height: `${this.currentElement.height || 'auto'}`,
    })
  }

  private applyStyles(): void {
    if (!this.editorElement || !this.currentElement) return
    
    Object.assign(this.editorElement.style, {
      fontSize: `${this.currentElement.fontSize || 16}px`,
      fontFamily: this.currentElement.fontFamily || 'Arial',
      fontWeight: this.currentElement.fontWeight || 'normal',
      fontStyle: this.currentElement.fontStyle || 'normal',
      color: this.currentElement.color || '#000000',
      textAlign: this.currentElement.textAlign || 'left',
      textDecoration: this.currentElement.textDecoration || 'none',
      lineHeight: this.currentElement.lineHeight || '1.5',
    })
  }

  private attachEventListeners(): void {
    if (!this.editorElement) return
    
    // Input handler
    this.editorElement.addEventListener('input', this.handleInput)
    
    // Keyboard shortcuts
    this.editorElement.addEventListener('keydown', this.handleKeyDown)
    
    // Click outside handler
    this.clickOutsideHandler = (e: MouseEvent) => {
      if (!this.editorElement?.contains(e.target as Node)) {
        this.stopEditing()
      }
    }
    
    // Delay to prevent immediate closure
    setTimeout(() => {
      document.addEventListener('mousedown', this.clickOutsideHandler!)
    }, 100)
  }

  private handleInput = (): void => {
    if (!this.editorElement || !this.currentElement) return
    
    // Convert HTML breaks to newlines
    const text = this.editorElement.innerHTML
      .replace(/<br>/gi, '\n')
      .replace(/<div>/gi, '\n')
      .replace(/<\/div>/gi, '')
      .replace(/<[^>]*>/g, '') // Remove any other HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    
    this.currentElement.text = text
    
    if (this.onUpdate) {
      this.onUpdate({ text })
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.currentElement) return
    
    // Ctrl/Cmd + Enter to complete
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      this.stopEditing()
      return
    }
    
    // Escape to cancel
    if (e.key === 'Escape') {
      e.preventDefault()
      this.currentElement.text = this.originalText
      if (this.onComplete) {
        this.onComplete(this.currentElement)
      }
      this.cleanup()
      return
    }
    
    // Text formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b': // Bold
          e.preventDefault()
          this.toggleFontWeight()
          break
        case 'i': // Italic
          e.preventDefault()
          this.toggleFontStyle()
          break
        case 'u': // Underline
          e.preventDefault()
          this.toggleTextDecoration()
          break
      }
    }
  }

  private toggleFontWeight(): void {
    if (!this.currentElement) return
    
    const newWeight = this.currentElement.fontWeight === 'bold' ? 'normal' : 'bold'
    this.currentElement.fontWeight = newWeight
    
    if (this.editorElement) {
      this.editorElement.style.fontWeight = newWeight
    }
    
    if (this.onUpdate) {
      this.onUpdate({ fontWeight: newWeight })
    }
  }

  private toggleFontStyle(): void {
    if (!this.currentElement) return
    
    const newStyle = this.currentElement.fontStyle === 'italic' ? 'normal' : 'italic'
    this.currentElement.fontStyle = newStyle
    
    if (this.editorElement) {
      this.editorElement.style.fontStyle = newStyle
    }
    
    if (this.onUpdate) {
      this.onUpdate({ fontStyle: newStyle })
    }
  }

  private toggleTextDecoration(): void {
    if (!this.currentElement) return
    
    const newDecoration = this.currentElement.textDecoration === 'underline' ? 'none' : 'underline'
    this.currentElement.textDecoration = newDecoration
    
    if (this.editorElement) {
      this.editorElement.style.textDecoration = newDecoration
    }
    
    if (this.onUpdate) {
      this.onUpdate({ textDecoration: newDecoration })
    }
  }

  private focus(): void {
    if (!this.editorElement) return
    
    this.editorElement.focus()
    
    // Select all text
    const range = document.createRange()
    range.selectNodeContents(this.editorElement)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }

  stopEditing(): void {
    if (this.currentElement && this.onComplete) {
      this.onComplete(this.currentElement)
    }
    this.cleanup()
  }

  private cleanup(): void {
    if (this.editorElement) {
      this.editorElement.removeEventListener('input', this.handleInput)
      this.editorElement.removeEventListener('keydown', this.handleKeyDown)
      this.editorElement.remove()
      this.editorElement = null
    }
    
    if (this.clickOutsideHandler) {
      document.removeEventListener('mousedown', this.clickOutsideHandler)
      this.clickOutsideHandler = undefined
    }
    
    this.currentElement = null
    this.onUpdate = undefined
    this.onComplete = undefined
  }

  createTextElement(
    position: { x: number; y: number },
    properties?: Partial<TextElement>
  ): TextElement {
    return {
      id: uuidv4(),
      type: 'text',
      text: 'Text',
      x: position.x,
      y: position.y,
      width: 100,
      height: 30,
      rotation: 0,
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#000000',
      textAlign: 'left',
      textDecoration: 'none',
      lineHeight: '1.5',
      opacity: 1,
      locked: false,
      visible: true,
      ...properties,
    }
  }

  destroy(): void {
    this.cleanup()
  }
}