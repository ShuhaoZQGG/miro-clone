// Create the mock implementation
const mockITextImpl = jest.fn().mockImplementation((text, options) => ({
  type: 'i-text',
  text,
  ...options,
  set: jest.fn(function(this: any, prop: string, value: any) {
    if (typeof prop === 'object') {
      Object.assign(this, prop)
    } else {
      this[prop] = value
    }
    return this
  }),
  get: jest.fn((prop) => options?.[prop]),
  enterEditing: jest.fn(),
  exitEditing: jest.fn(),
  selectAll: jest.fn(),
  getBoundingRect: jest.fn(() => ({ width: 200, height: 50 })),
}))

// Set up global fabric object
;(global as any).fabric = {
  IText: mockITextImpl,
}

// Mock fabric module
jest.mock('fabric', () => ({
  fabric: (global as any).fabric,
}))

import { TextEditingManager } from '../text-editing'

// Get reference to the mock for use in tests
const mockIText = mockITextImpl

describe('TextEditingManager', () => {
  let manager: TextEditingManager
  let mockCanvas: any
  let mockTextElement: any

  beforeEach(() => {
    // Mock canvas
    mockCanvas = {
      add: jest.fn(),
      remove: jest.fn(),
      renderAll: jest.fn(),
      getActiveObject: jest.fn(),
      setActiveObject: jest.fn(),
      discardActiveObject: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    }

    // Mock text element
    mockTextElement = {
      id: 'text-1',
      type: 'text',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 50 },
      content: {
        text: 'Sample text',
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        color: '#000000',
        backgroundColor: 'transparent',
      },
      set: jest.fn(),
      get: jest.fn((prop) => {
        const props: any = {
          text: 'Sample text',
          fontSize: 16,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'left',
          fill: '#000000',
          backgroundColor: 'transparent',
        }
        return props[prop]
      }),
      enterEditing: jest.fn(),
      exitEditing: jest.fn(),
      selectAll: jest.fn(),
      selectionStart: 0,
      selectionEnd: 0,
    }

    manager = new TextEditingManager(mockCanvas)
  })

  describe('Text Creation', () => {
    it('should create a new text element', () => {
      const position = { x: 100, y: 100 }
      const element = manager.createTextElement(position)

      expect(element.type).toBe('text')
      expect(element.position).toEqual(position)
      expect(element.content.text).toBe('Text')
      expect(mockCanvas.add).toHaveBeenCalled()
    })

    it('should create text with custom properties', () => {
      const position = { x: 100, y: 100 }
      const properties = {
        text: 'Custom text',
        fontSize: 24,
        fontFamily: 'Helvetica',
        color: '#FF0000',
      }

      const element = manager.createTextElement(position, properties)

      expect(element.content.text).toBe('Custom text')
      expect(element.content.fontSize).toBe(24)
      expect(element.content.fontFamily).toBe('Helvetica')
      expect(element.content.color).toBe('#FF0000')
    })
  })

  describe('Text Editing', () => {
    it('should start editing mode for text element', () => {
      // Mock fabric.IText constructor
      const mockIText = {
        type: 'i-text',
        text: 'Sample text',
        left: 100,
        top: 100,
        enterEditing: jest.fn(),
        exitEditing: jest.fn(),
        selectAll: jest.fn(),
        set: jest.fn(),
        get: jest.fn((prop) => {
          const props = {
            text: 'Sample text',
            fontSize: 16,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'left',
            fill: '#000000',
            backgroundColor: 'transparent',
          }
          return props[prop]
        }),
        getBoundingRect: jest.fn(() => ({ left: 100, top: 100, width: 200, height: 50 })),
      }
      
      // Reset the mock before using it
      mockIText.mockClear()
      
      manager.startEditing(mockTextElement)

      // Since mockTextElement is type 'text', it will be converted to IText
      expect(mockCanvas.remove).toHaveBeenCalledWith(mockTextElement)
      expect(mockCanvas.add).toHaveBeenCalledWith(mockIText)
      expect(mockCanvas.setActiveObject).toHaveBeenCalledWith(mockIText)
      expect(mockIText.enterEditing).toHaveBeenCalled()
      expect(mockIText.selectAll).toHaveBeenCalled()
    })

    it('should end editing mode', () => {
      // Create an IText element (not plain text) to avoid conversion
      const mockITextElement = {
        ...mockTextElement,
        type: 'i-text',
        exitEditing: jest.fn(),
      }
      
      manager.startEditing(mockITextElement)
      manager.endEditing()

      expect(mockITextElement.exitEditing).toHaveBeenCalled()
      expect(mockCanvas.discardActiveObject).toHaveBeenCalled()
    })

    it('should handle double-click to edit', () => {
      const listener = mockCanvas.on.mock.calls.find(
        (call: any) => call[0] === 'mouse:dblclick'
      )?.[1]

      expect(listener).toBeDefined()

      // Create an i-text element for testing double-click
      const mockITextElement = {
        ...mockTextElement,
        type: 'i-text',
        enterEditing: jest.fn(),
      }

      // Simulate double-click on text element
      mockCanvas.getActiveObject.mockReturnValue(mockITextElement)
      listener({ target: mockITextElement })

      expect(mockITextElement.enterEditing).toHaveBeenCalled()
    })
  })

  describe('Text Formatting', () => {
    it('should update font size', () => {
      manager.updateTextProperty(mockTextElement, 'fontSize', 24)

      expect(mockTextElement.set).toHaveBeenCalledWith('fontSize', 24)
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should update font family', () => {
      manager.updateTextProperty(mockTextElement, 'fontFamily', 'Georgia')

      expect(mockTextElement.set).toHaveBeenCalledWith('fontFamily', 'Georgia')
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should toggle bold', () => {
      manager.toggleBold(mockTextElement)

      expect(mockTextElement.set).toHaveBeenCalledWith('fontWeight', 'bold')
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should toggle italic', () => {
      manager.toggleItalic(mockTextElement)

      expect(mockTextElement.set).toHaveBeenCalledWith('fontStyle', 'italic')
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should update text color', () => {
      manager.updateTextProperty(mockTextElement, 'fill', '#0000FF')

      expect(mockTextElement.set).toHaveBeenCalledWith('fill', '#0000FF')
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should update text alignment', () => {
      manager.updateTextProperty(mockTextElement, 'textAlign', 'center')

      expect(mockTextElement.set).toHaveBeenCalledWith('textAlign', 'center')
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })
  })

  describe('Rich Text Features', () => {
    it('should support multiline text', () => {
      const position = { x: 100, y: 100 }
      const element = manager.createTextElement(position, {
        text: 'Line 1\nLine 2\nLine 3',
      })

      expect(element.content.text).toContain('\n')
    })

    it('should handle text wrapping', () => {
      const longText = 'This is a very long text that should wrap to multiple lines when the width is constrained'
      manager.updateTextProperty(mockTextElement, 'text', longText)
      manager.setTextWrapping(mockTextElement, 200)

      expect(mockTextElement.set).toHaveBeenCalledWith({
        width: 200,
        splitByGrapheme: true,
      })
    })

    it('should update line height', () => {
      manager.updateTextProperty(mockTextElement, 'lineHeight', 1.5)

      expect(mockTextElement.set).toHaveBeenCalledWith('lineHeight', 1.5)
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should handle Ctrl+B for bold', () => {
      // Create an i-text element for keyboard shortcuts
      const mockITextElement = {
        ...mockTextElement,
        type: 'i-text',
        get: jest.fn((prop) => {
          if (prop === 'fontWeight') return 'normal'
          return mockTextElement.content[prop]
        }),
      }
      
      // Simulate Ctrl+B
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
      })
      event.preventDefault = jest.fn()
      
      manager.handleKeyboardShortcut(event, mockITextElement)

      expect(mockITextElement.set).toHaveBeenCalledWith('fontWeight', 'bold')
    })

    it('should handle Ctrl+I for italic', () => {
      // Create an i-text element for keyboard shortcuts
      const mockITextElement = {
        ...mockTextElement,
        type: 'i-text',
        get: jest.fn((prop) => {
          if (prop === 'fontStyle') return 'normal'
          return mockTextElement.content[prop]
        }),
      }
      
      // Simulate Ctrl+I
      const event = new KeyboardEvent('keydown', {
        key: 'i',
        ctrlKey: true,
      })
      event.preventDefault = jest.fn()
      
      manager.handleKeyboardShortcut(event, mockITextElement)

      expect(mockITextElement.set).toHaveBeenCalledWith('fontStyle', 'italic')
    })
  })

  describe('Disposal', () => {
    it('should clean up event listeners on dispose', () => {
      manager.dispose()

      expect(mockCanvas.off).toHaveBeenCalledWith('mouse:dblclick')
      expect(mockCanvas.off).toHaveBeenCalledWith('text:changed')
    })
  })
})