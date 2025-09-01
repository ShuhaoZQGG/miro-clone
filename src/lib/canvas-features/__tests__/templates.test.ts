import { fabric } from 'fabric'
import { TemplateManager, TemplateCategory } from '../templates'

// Mock fabric.js
jest.mock('fabric', () => ({
  fabric: {
    Canvas: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      renderAll: jest.fn(),
      getObjects: jest.fn(() => []),
      remove: jest.fn(),
    })),
    Rect: jest.fn().mockImplementation((options) => ({
      ...options,
      type: 'rect',
      toObject: jest.fn(() => options),
      width: options.width,
      height: options.height,
      left: options.left,
      top: options.top,
    })),
    Circle: jest.fn().mockImplementation((options) => ({
      ...options,
      type: 'circle',
      toObject: jest.fn(() => options),
      radius: options.radius,
      left: options.left,
      top: options.top,
    })),
    Text: jest.fn().mockImplementation((text, options) => ({
      ...options,
      type: 'text',
      text,
      toObject: jest.fn(() => ({ ...options, text })),
      left: options?.left,
      top: options?.top,
    })),
    IText: jest.fn().mockImplementation((text, options) => ({
      ...options,
      type: 'i-text',
      text,
      toObject: jest.fn(() => ({ ...options, text })),
      left: options?.left,
      top: options?.top,
    })),
    Line: jest.fn().mockImplementation((points, options) => ({
      ...options,
      type: 'line',
      points,
      toObject: jest.fn(() => ({ ...options, points })),
      left: options?.left,
      top: options?.top,
    })),
    Triangle: jest.fn().mockImplementation((options) => ({
      ...options,
      type: 'triangle',
      toObject: jest.fn(() => options),
    })),
    Group: jest.fn().mockImplementation((objects, options) => ({
      ...options,
      type: 'group',
      _objects: objects,
      toObject: jest.fn(() => ({ ...options, objects })),
      left: options?.left,
      top: options?.top,
    })),
  },
}))

describe('TemplateManager', () => {
  let manager: TemplateManager
  let mockCanvas: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockCanvas = new fabric.Canvas(null)
    manager = new TemplateManager(mockCanvas)
  })

  describe('Built-in Templates', () => {
    it('should initialize with built-in templates', () => {
      const templates = manager.getAllTemplates()
      expect(templates.length).toBeGreaterThan(0)
      
      // Check for specific built-in templates
      const flowchartTemplate = manager.getTemplate('flowchart-basic')
      expect(flowchartTemplate).toBeDefined()
      expect(flowchartTemplate?.name).toBe('Basic Flowchart')
      expect(flowchartTemplate?.category).toBe(TemplateCategory.FLOWCHART)
      
      const wireframeTemplate = manager.getTemplate('wireframe-mobile')
      expect(wireframeTemplate).toBeDefined()
      expect(wireframeTemplate?.name).toBe('Mobile App Wireframe')
      
      const kanbanTemplate = manager.getTemplate('kanban-board')
      expect(kanbanTemplate).toBeDefined()
      expect(kanbanTemplate?.name).toBe('Kanban Board')
      
      const mindmapTemplate = manager.getTemplate('mindmap-basic')
      expect(mindmapTemplate).toBeDefined()
      expect(mindmapTemplate?.name).toBe('Mind Map')
    })

    it('should get templates by category', () => {
      const flowchartTemplates = manager.getTemplatesByCategory(TemplateCategory.FLOWCHART)
      expect(flowchartTemplates.length).toBeGreaterThan(0)
      expect(flowchartTemplates.every(t => t.category === TemplateCategory.FLOWCHART)).toBe(true)
      
      const wireframeTemplates = manager.getTemplatesByCategory(TemplateCategory.WIREFRAME)
      expect(wireframeTemplates.length).toBeGreaterThan(0)
      expect(wireframeTemplates.every(t => t.category === TemplateCategory.WIREFRAME)).toBe(true)
    })
  })

  describe('Template Application', () => {
    it('should apply a template to the canvas', () => {
      const objects = manager.applyTemplate('flowchart-basic')
      
      expect(objects.length).toBeGreaterThan(0)
      expect(mockCanvas.add).toHaveBeenCalled()
      expect(mockCanvas.renderAll).toHaveBeenCalled()
    })

    it('should apply template with offset', () => {
      const offset = { x: 100, y: 200 }
      const objects = manager.applyTemplate('flowchart-basic', offset)
      
      expect(objects.length).toBeGreaterThan(0)
      // Check that objects have offset applied
      objects.forEach(obj => {
        if (obj.left !== undefined && obj.top !== undefined) {
          expect(obj.left).toBeGreaterThanOrEqual(offset.x)
          expect(obj.top).toBeGreaterThanOrEqual(offset.y)
        }
      })
    })

    it('should throw error for non-existent template', () => {
      expect(() => {
        manager.applyTemplate('non-existent-template')
      }).toThrow('Template non-existent-template not found')
    })
  })

  describe('Custom Templates', () => {
    it('should save custom template from canvas objects', () => {
      const mockObjects = [
        new fabric.Rect({ left: 10, top: 20, width: 100, height: 50, fill: 'red' }),
        new fabric.Text('Test', { left: 30, top: 40, fontSize: 16 }),
      ]
      
      const template = manager.saveAsCustomTemplate(
        'My Custom Template',
        'A test custom template',
        mockObjects as any
      )
      
      expect(template.id).toContain('custom-')
      expect(template.name).toBe('My Custom Template')
      expect(template.description).toBe('A test custom template')
      expect(template.category).toBe(TemplateCategory.CUSTOM)
      expect(template.elements).toHaveLength(2)
      
      // Verify template was added
      const retrieved = manager.getTemplate(template.id)
      expect(retrieved).toBeDefined()
      expect(retrieved?.name).toBe('My Custom Template')
    })

    it('should get all custom templates', () => {
      const mockObjects = [
        new fabric.Rect({ left: 0, top: 0, width: 100, height: 100 }),
      ]
      
      manager.saveAsCustomTemplate('Template 1', 'Description 1', mockObjects as any)
      manager.saveAsCustomTemplate('Template 2', 'Description 2', mockObjects as any)
      
      const customTemplates = manager.getCustomTemplates()
      expect(customTemplates).toHaveLength(2)
      expect(customTemplates[0].name).toBe('Template 1')
      expect(customTemplates[1].name).toBe('Template 2')
    })

    it('should delete custom template', () => {
      const mockObjects = [
        new fabric.Rect({ left: 0, top: 0, width: 100, height: 100 }),
      ]
      
      const template = manager.saveAsCustomTemplate('To Delete', 'Will be deleted', mockObjects as any)
      const templateId = template.id
      
      // Verify it exists
      expect(manager.getTemplate(templateId)).toBeDefined()
      expect(manager.getCustomTemplates()).toHaveLength(1)
      
      // Delete it
      const deleted = manager.deleteCustomTemplate(templateId)
      expect(deleted).toBe(true)
      
      // Verify it's gone
      expect(manager.getTemplate(templateId)).toBeUndefined()
      expect(manager.getCustomTemplates()).toHaveLength(0)
    })

    it('should return false when deleting non-existent template', () => {
      const deleted = manager.deleteCustomTemplate('non-existent-id')
      expect(deleted).toBe(false)
    })
  })

  describe('Template Import/Export', () => {
    it('should export template as JSON', () => {
      const jsonString = manager.exportTemplate('flowchart-basic')
      const parsed = JSON.parse(jsonString)
      
      expect(parsed.id).toBe('flowchart-basic')
      expect(parsed.name).toBe('Basic Flowchart')
      expect(parsed.elements).toBeDefined()
      expect(Array.isArray(parsed.elements)).toBe(true)
    })

    it('should import template from JSON', () => {
      const templateData = {
        id: 'imported-template',
        name: 'Imported Template',
        description: 'A template imported from JSON',
        category: TemplateCategory.CUSTOM,
        elements: [
          {
            type: 'rect' as const,
            properties: { fill: 'blue' },
            position: { x: 0, y: 0 },
            size: { width: 100, height: 100 }
          }
        ]
      }
      
      const jsonString = JSON.stringify(templateData)
      const imported = manager.importTemplate(jsonString)
      
      expect(imported.id).toBe('imported-template')
      expect(imported.name).toBe('Imported Template')
      
      // Verify it was added
      const retrieved = manager.getTemplate('imported-template')
      expect(retrieved).toBeDefined()
      expect(retrieved?.name).toBe('Imported Template')
      
      // Verify it's in custom templates if category is CUSTOM
      const customTemplates = manager.getCustomTemplates()
      expect(customTemplates.some(t => t.id === 'imported-template')).toBe(true)
    })

    it('should throw error when exporting non-existent template', () => {
      expect(() => {
        manager.exportTemplate('non-existent')
      }).toThrow('Template non-existent not found')
    })

    it('should throw error for invalid JSON when importing', () => {
      expect(() => {
        manager.importTemplate('invalid json')
      }).toThrow()
    })
  })

  describe('Template Categories', () => {
    it('should have all expected categories', () => {
      const allTemplates = manager.getAllTemplates()
      
      const categories = new Set(allTemplates.map(t => t.category))
      
      expect(categories.has(TemplateCategory.FLOWCHART)).toBe(true)
      expect(categories.has(TemplateCategory.WIREFRAME)).toBe(true)
      expect(categories.has(TemplateCategory.KANBAN)).toBe(true)
      expect(categories.has(TemplateCategory.MINDMAP)).toBe(true)
    })
  })
})