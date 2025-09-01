import { TextEditor } from '../text-editor'
import { TextElement } from '@/types'

describe('TextEditor', () => {
  let editor: TextEditor
  let mockCanvas: HTMLCanvasElement
  let mockOnUpdate: jest.Mock
  let mockOnComplete: jest.Mock

  beforeEach(() => {
    mockCanvas = document.createElement('canvas')
    document.body.appendChild(mockCanvas)
    
    editor = new TextEditor(mockCanvas)
    mockOnUpdate = jest.fn()
    mockOnComplete = jest.fn()
  })

  afterEach(() => {
    document.body.removeChild(mockCanvas)
    editor.destroy()
    jest.clearAllMocks()
  })

  describe('startEditing', () => {
    it('should create editor overlay at correct position', () => {
      const element: Partial<TextElement> = {
        id: 'text-1',
        type: 'text',
        text: 'Hello World',
        x: 100,
        y: 200,
        width: 150,
        height: 50,
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#000000',
      }

      editor.startEditing(element as TextElement, mockOnUpdate, mockOnComplete)
      
      const editorElement = document.querySelector('.text-editor-overlay') as HTMLElement
      expect(editorElement).toBeTruthy()
      expect(editorElement.style.left).toBe('100px')
      expect(editorElement.style.top).toBe('200px')
      expect(editorElement.textContent).toBe('Hello World')
    })

    it('should apply text styles correctly', () => {
      const element: Partial<TextElement> = {
        id: 'text-1',
        type: 'text',
        text: 'Styled Text',
        x: 0,
        y: 0,
        fontSize: 24,
        fontFamily: 'Helvetica',
        fontWeight: 'bold',
        fontStyle: 'italic',
        color: '#FF0000',
        textAlign: 'center',
      }

      editor.startEditing(element as TextElement, mockOnUpdate, mockOnComplete)
      
      const editorElement = document.querySelector('.text-editor-overlay') as HTMLElement
      expect(editorElement.style.fontSize).toBe('24px')
      expect(editorElement.style.fontFamily).toBe('Helvetica')
      expect(editorElement.style.fontWeight).toBe('bold')
      expect(editorElement.style.fontStyle).toBe('italic')
      expect(editorElement.style.color).toBe('rgb(255, 0, 0)')
      expect(editorElement.style.textAlign).toBe('center')
    })

    it('should focus the editor immediately', () => {
      const element: Partial<TextElement> = {
        id: 'text-1',
        type: 'text',
        text: 'Test',
        x: 0,
        y: 0,
      }

      editor.startEditing(element as TextElement, mockOnUpdate, mockOnComplete)
      
      const editorElement = document.querySelector('.text-editor-overlay') as HTMLElement
      expect(document.activeElement).toBe(editorElement)
    })
  })

  describe('text input handling', () => {
    it('should call onUpdate when text changes', () => {
      const element: Partial<TextElement> = {
        id: 'text-1',
        type: 'text',
        text: 'Initial',
        x: 0,
        y: 0,
      }

      editor.startEditing(element as TextElement, mockOnUpdate, mockOnComplete)
      
      const editorElement = document.querySelector('.text-editor-overlay') as HTMLElement
      editorElement.textContent = 'Updated Text'
      editorElement.dispatchEvent(new Event('input'))
      
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Updated Text',
        })
      )
    })

    it('should handle multi-line text', () => {
      const element: Partial<TextElement> = {
        id: 'text-1',
        type: 'text',
        text: 'Line 1',
        x: 0,
        y: 0,
      }

      editor.startEditing(element as TextElement, mockOnUpdate, mockOnComplete)
      
      const editorElement = document.querySelector('.text-editor-overlay') as HTMLElement
      editorElement.innerHTML = 'Line 1<br>Line 2<br>Line 3'
      editorElement.dispatchEvent(new Event('input'))
      
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Line 1\nLine 2\nLine 3',
        })
      )
    })
  })

  describe('keyboard shortcuts', () => {
    it('should complete editing on Enter key', () => {
      const element: Partial<TextElement> = {
        id: 'text-1',
        type: 'text',
        text: 'Test',
        x: 0,
        y: 0,
      }

      editor.startEditing(element as TextElement, mockOnUpdate, mockOnComplete)
      
      const editorElement = document.querySelector('.text-editor-overlay') as HTMLElement
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true })
      editorElement.dispatchEvent(enterEvent)
      
      expect(mockOnComplete).toHaveBeenCalled()
      expect(document.querySelector('.text-editor-overlay')).toBeNull()
    })

    it('should cancel editing on Escape key', () => {
      const element: Partial<TextElement> = {
        id: 'text-1',
        type: 'text',
        text: 'Original',
        x: 0,
        y: 0,
      }

      editor.startEditing(element as TextElement, mockOnUpdate, mockOnComplete)
      
      const editorElement = document.querySelector('.text-editor-overlay') as HTMLElement
      editorElement.textContent = 'Modified'
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      editorElement.dispatchEvent(escapeEvent)
      
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Original', // Should revert to original
        })
      )
      expect(document.querySelector('.text-editor-overlay')).toBeNull()
    })

    it('should handle text formatting shortcuts', () => {
      const element: Partial<TextElement> = {
        id: 'text-1',
        type: 'text',
        text: 'Test',
        x: 0,
        y: 0,
        fontWeight: 'normal',
        fontStyle: 'normal',
      }

      editor.startEditing(element as TextElement, mockOnUpdate, mockOnComplete)
      
      const editorElement = document.querySelector('.text-editor-overlay') as HTMLElement
      
      // Bold shortcut (Ctrl+B)
      const boldEvent = new KeyboardEvent('keydown', { key: 'b', ctrlKey: true })
      editorElement.dispatchEvent(boldEvent)
      
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          fontWeight: 'bold',
        })
      )
      
      // Italic shortcut (Ctrl+I)
      const italicEvent = new KeyboardEvent('keydown', { key: 'i', ctrlKey: true })
      editorElement.dispatchEvent(italicEvent)
      
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          fontStyle: 'italic',
        })
      )
    })
  })

  describe('click outside handling', () => {
    it('should complete editing when clicking outside', () => {
      const element: Partial<TextElement> = {
        id: 'text-1',
        type: 'text',
        text: 'Test',
        x: 0,
        y: 0,
      }

      editor.startEditing(element as TextElement, mockOnUpdate, mockOnComplete)
      
      // Click outside the editor
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      
      expect(mockOnComplete).toHaveBeenCalled()
      expect(document.querySelector('.text-editor-overlay')).toBeNull()
    })

    it('should not complete when clicking inside editor', () => {
      const element: Partial<TextElement> = {
        id: 'text-1',
        type: 'text',
        text: 'Test',
        x: 0,
        y: 0,
      }

      editor.startEditing(element as TextElement, mockOnUpdate, mockOnComplete)
      
      const editorElement = document.querySelector('.text-editor-overlay') as HTMLElement
      editorElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      
      expect(mockOnComplete).not.toHaveBeenCalled()
      expect(document.querySelector('.text-editor-overlay')).toBeTruthy()
    })
  })

  describe('stopEditing', () => {
    it('should remove editor and clean up', () => {
      const element: Partial<TextElement> = {
        id: 'text-1',
        type: 'text',
        text: 'Test',
        x: 0,
        y: 0,
      }

      editor.startEditing(element as TextElement, mockOnUpdate, mockOnComplete)
      expect(document.querySelector('.text-editor-overlay')).toBeTruthy()
      
      editor.stopEditing()
      
      expect(document.querySelector('.text-editor-overlay')).toBeNull()
      expect(mockOnComplete).toHaveBeenCalled()
    })

    it('should handle multiple stop calls gracefully', () => {
      const element: Partial<TextElement> = {
        id: 'text-1',
        type: 'text',
        text: 'Test',
        x: 0,
        y: 0,
      }

      editor.startEditing(element as TextElement, mockOnUpdate, mockOnComplete)
      
      editor.stopEditing()
      editor.stopEditing() // Second call should not error
      
      expect(mockOnComplete).toHaveBeenCalledTimes(1)
    })
  })

  describe('createTextElement', () => {
    it('should create new text element with defaults', () => {
      const position = { x: 100, y: 200 }
      const element = editor.createTextElement(position)
      
      expect(element).toMatchObject({
        type: 'text',
        text: 'Text',
        x: 100,
        y: 200,
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#000000',
        textAlign: 'left',
      })
      expect(element.id).toBeTruthy()
    })

    it('should create text element with custom properties', () => {
      const position = { x: 50, y: 100 }
      const customProps = {
        text: 'Custom Text',
        fontSize: 24,
        color: '#FF0000',
        fontWeight: 'bold' as const,
      }
      
      const element = editor.createTextElement(position, customProps)
      
      expect(element).toMatchObject({
        ...customProps,
        x: 50,
        y: 100,
      })
    })
  })
})