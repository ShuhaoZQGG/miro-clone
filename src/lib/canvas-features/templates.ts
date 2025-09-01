import { fabric } from 'fabric'

export interface Template {
  id: string
  name: string
  description: string
  category: TemplateCategory
  preview?: string
  elements: TemplateElement[]
}

export interface TemplateElement {
  type: 'rect' | 'circle' | 'text' | 'line' | 'arrow' | 'image' | 'group'
  properties: any
  position: { x: number; y: number }
  size?: { width: number; height: number }
}

export enum TemplateCategory {
  FLOWCHART = 'flowchart',
  WIREFRAME = 'wireframe',
  DIAGRAM = 'diagram',
  MINDMAP = 'mindmap',
  KANBAN = 'kanban',
  PRESENTATION = 'presentation',
  CUSTOM = 'custom'
}

export class TemplateManager {
  private templates: Map<string, Template> = new Map()
  private canvas?: fabric.Canvas
  private customTemplates: Template[] = []

  constructor(canvas?: fabric.Canvas) {
    this.canvas = canvas
    this.initializeBuiltInTemplates()
  }

  private initializeBuiltInTemplates() {
    // Flowchart Template
    this.addTemplate({
      id: 'flowchart-basic',
      name: 'Basic Flowchart',
      description: 'A simple flowchart template with decision nodes',
      category: TemplateCategory.FLOWCHART,
      elements: [
        {
          type: 'rect',
          properties: {
            fill: '#4F46E5',
            stroke: '#312E81',
            strokeWidth: 2,
            rx: 8,
            ry: 8
          },
          position: { x: 200, y: 100 },
          size: { width: 120, height: 60 }
        },
        {
          type: 'text',
          properties: {
            text: 'Start',
            fontSize: 16,
            fill: 'white',
            fontFamily: 'Arial'
          },
          position: { x: 260, y: 130 }
        },
        {
          type: 'rect',
          properties: {
            fill: '#10B981',
            stroke: '#047857',
            strokeWidth: 2,
            angle: 45
          },
          position: { x: 200, y: 220 },
          size: { width: 100, height: 100 }
        },
        {
          type: 'text',
          properties: {
            text: 'Decision',
            fontSize: 14,
            fill: 'white',
            fontFamily: 'Arial'
          },
          position: { x: 250, y: 270 }
        },
        {
          type: 'rect',
          properties: {
            fill: '#EF4444',
            stroke: '#991B1B',
            strokeWidth: 2,
            rx: 8,
            ry: 8
          },
          position: { x: 200, y: 400 },
          size: { width: 120, height: 60 }
        },
        {
          type: 'text',
          properties: {
            text: 'End',
            fontSize: 16,
            fill: 'white',
            fontFamily: 'Arial'
          },
          position: { x: 260, y: 430 }
        }
      ]
    })

    // Wireframe Template
    this.addTemplate({
      id: 'wireframe-mobile',
      name: 'Mobile App Wireframe',
      description: 'Basic mobile app screen layout',
      category: TemplateCategory.WIREFRAME,
      elements: [
        // Phone frame
        {
          type: 'rect',
          properties: {
            fill: 'transparent',
            stroke: '#374151',
            strokeWidth: 3,
            rx: 20,
            ry: 20
          },
          position: { x: 150, y: 50 },
          size: { width: 300, height: 600 }
        },
        // Status bar
        {
          type: 'rect',
          properties: {
            fill: '#F3F4F6',
            stroke: '#E5E7EB',
            strokeWidth: 1
          },
          position: { x: 150, y: 50 },
          size: { width: 300, height: 30 }
        },
        // Navigation bar
        {
          type: 'rect',
          properties: {
            fill: '#4F46E5',
            stroke: '#312E81',
            strokeWidth: 1
          },
          position: { x: 150, y: 80 },
          size: { width: 300, height: 60 }
        },
        // Content area
        {
          type: 'rect',
          properties: {
            fill: '#FFFFFF',
            stroke: '#E5E7EB',
            strokeWidth: 1
          },
          position: { x: 150, y: 140 },
          size: { width: 300, height: 430 }
        },
        // Bottom navigation
        {
          type: 'rect',
          properties: {
            fill: '#F9FAFB',
            stroke: '#E5E7EB',
            strokeWidth: 1
          },
          position: { x: 150, y: 570 },
          size: { width: 300, height: 80 }
        }
      ]
    })

    // Kanban Board Template
    this.addTemplate({
      id: 'kanban-board',
      name: 'Kanban Board',
      description: 'Project management kanban board',
      category: TemplateCategory.KANBAN,
      elements: [
        // To Do Column
        {
          type: 'rect',
          properties: {
            fill: '#FEF3C7',
            stroke: '#F59E0B',
            strokeWidth: 2
          },
          position: { x: 50, y: 50 },
          size: { width: 250, height: 500 }
        },
        {
          type: 'text',
          properties: {
            text: 'TO DO',
            fontSize: 18,
            fill: '#92400E',
            fontWeight: 'bold',
            fontFamily: 'Arial'
          },
          position: { x: 130, y: 70 }
        },
        // In Progress Column
        {
          type: 'rect',
          properties: {
            fill: '#DBEAFE',
            stroke: '#3B82F6',
            strokeWidth: 2
          },
          position: { x: 320, y: 50 },
          size: { width: 250, height: 500 }
        },
        {
          type: 'text',
          properties: {
            text: 'IN PROGRESS',
            fontSize: 18,
            fill: '#1E3A8A',
            fontWeight: 'bold',
            fontFamily: 'Arial'
          },
          position: { x: 380, y: 70 }
        },
        // Done Column
        {
          type: 'rect',
          properties: {
            fill: '#D1FAE5',
            stroke: '#10B981',
            strokeWidth: 2
          },
          position: { x: 590, y: 50 },
          size: { width: 250, height: 500 }
        },
        {
          type: 'text',
          properties: {
            text: 'DONE',
            fontSize: 18,
            fill: '#064E3B',
            fontWeight: 'bold',
            fontFamily: 'Arial'
          },
          position: { x: 680, y: 70 }
        }
      ]
    })

    // Mind Map Template
    this.addTemplate({
      id: 'mindmap-basic',
      name: 'Mind Map',
      description: 'Central idea with branches',
      category: TemplateCategory.MINDMAP,
      elements: [
        // Central node
        {
          type: 'circle',
          properties: {
            fill: '#8B5CF6',
            stroke: '#5B21B6',
            strokeWidth: 3,
            radius: 60
          },
          position: { x: 400, y: 300 },
          size: { width: 120, height: 120 }
        },
        {
          type: 'text',
          properties: {
            text: 'Main Idea',
            fontSize: 18,
            fill: 'white',
            fontWeight: 'bold',
            fontFamily: 'Arial'
          },
          position: { x: 400, y: 300 }
        },
        // Branch nodes
        {
          type: 'circle',
          properties: {
            fill: '#EC4899',
            stroke: '#9F1239',
            strokeWidth: 2,
            radius: 40
          },
          position: { x: 250, y: 200 },
          size: { width: 80, height: 80 }
        },
        {
          type: 'circle',
          properties: {
            fill: '#F59E0B',
            stroke: '#92400E',
            strokeWidth: 2,
            radius: 40
          },
          position: { x: 550, y: 200 },
          size: { width: 80, height: 80 }
        },
        {
          type: 'circle',
          properties: {
            fill: '#10B981',
            stroke: '#064E3B',
            strokeWidth: 2,
            radius: 40
          },
          position: { x: 250, y: 400 },
          size: { width: 80, height: 80 }
        },
        {
          type: 'circle',
          properties: {
            fill: '#3B82F6',
            stroke: '#1E3A8A',
            strokeWidth: 2,
            radius: 40
          },
          position: { x: 550, y: 400 },
          size: { width: 80, height: 80 }
        }
      ]
    })
  }

  addTemplate(template: Template): void {
    this.templates.set(template.id, template)
  }

  getTemplate(id: string): Template | undefined {
    return this.templates.get(id)
  }

  getTemplatesByCategory(category: TemplateCategory): Template[] {
    return Array.from(this.templates.values()).filter(t => t.category === category)
  }

  getAllTemplates(): Template[] {
    return Array.from(this.templates.values())
  }

  getBuiltInTemplates(): Template[] {
    return Array.from(this.templates.values()).filter(t => t.category !== TemplateCategory.CUSTOM)
  }

  applyTemplate(templateId: string, offset?: { x: number; y: number }): fabric.Object[] {
    if (!this.canvas) {
      throw new Error('Canvas is required to apply templates')
    }
    
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    const objects: fabric.Object[] = []
    const offsetX = offset?.x || 0
    const offsetY = offset?.y || 0

    template.elements.forEach(element => {
      let fabricObject: fabric.Object | null = null

      switch (element.type) {
        case 'rect':
          fabricObject = new fabric.Rect({
            left: element.position.x + offsetX,
            top: element.position.y + offsetY,
            width: element.size?.width || 100,
            height: element.size?.height || 100,
            ...element.properties
          })
          break

        case 'circle':
          fabricObject = new fabric.Circle({
            left: element.position.x + offsetX,
            top: element.position.y + offsetY,
            radius: element.properties.radius || 50,
            ...element.properties
          })
          break

        case 'text':
          fabricObject = new fabric.Text(element.properties.text || 'Text', {
            left: element.position.x + offsetX,
            top: element.position.y + offsetY,
            ...element.properties
          })
          break

        case 'line':
          const points = element.properties.points || [0, 0, 100, 100]
          fabricObject = new fabric.Line(points, {
            left: element.position.x + offsetX,
            top: element.position.y + offsetY,
            ...element.properties
          })
          break

        case 'arrow':
          // Create arrow as a group of line and triangle
          const arrowLine = new fabric.Line([0, 0, 100, 0], {
            stroke: element.properties.stroke || '#000',
            strokeWidth: element.properties.strokeWidth || 2
          })
          
          const arrowHead = new fabric.Triangle({
            width: 10,
            height: 15,
            fill: element.properties.stroke || '#000',
            left: 100,
            top: -7.5,
            angle: 90
          })
          
          fabricObject = new fabric.Group([arrowLine, arrowHead], {
            left: element.position.x + offsetX,
            top: element.position.y + offsetY
          })
          break
      }

      if (fabricObject && this.canvas) {
        this.canvas.add(fabricObject)
        objects.push(fabricObject)
      }
    })

    if (this.canvas) {
      this.canvas.renderAll()
    }
    return objects
  }

  createCustomTemplate(objects: any[], name: string, description?: string, category?: TemplateCategory): Template {
    const elements: TemplateElement[] = objects.map(obj => {
      let type: TemplateElement['type'] = 'rect'
      if (obj.type === 'circle') type = 'circle'
      else if (obj.type === 'text' || obj.type === 'i-text') type = 'text'
      else if (obj.type === 'line') type = 'line'
      else if (obj.type === 'group') type = 'group'
      
      const element: TemplateElement = {
        type,
        properties: obj,
        position: { x: obj.left || 0, y: obj.top || 0 }
      }

      if (obj.width && obj.height) {
        element.size = { width: obj.width, height: obj.height }
      }

      return element
    })

    const template: Template = {
      id: `custom-${Date.now()}`,
      name,
      description: description || '',
      category: category || TemplateCategory.CUSTOM,
      elements
    }

    this.customTemplates.push(template)
    this.addTemplate(template)
    
    return template
  }

  saveCustomTemplate(template: Template): void {
    // Save to localStorage
    const existingTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]')
    existingTemplates.push(template)
    localStorage.setItem('customTemplates', JSON.stringify(existingTemplates))
  }

  saveAsCustomTemplate(name: string, description: string, objects: fabric.Object[]): Template {
    const elements: TemplateElement[] = objects.map(obj => {
      const element: TemplateElement = {
        type: this.getFabricObjectType(obj),
        properties: obj.toObject(),
        position: { x: obj.left || 0, y: obj.top || 0 }
      }

      if (obj.width && obj.height) {
        element.size = { width: obj.width, height: obj.height }
      }

      return element
    })

    const template: Template = {
      id: `custom-${Date.now()}`,
      name,
      description,
      category: TemplateCategory.CUSTOM,
      elements
    }

    this.customTemplates.push(template)
    this.addTemplate(template)
    
    return template
  }

  private getFabricObjectType(obj: fabric.Object): TemplateElement['type'] {
    if (obj instanceof fabric.Rect) return 'rect'
    if (obj instanceof fabric.Circle) return 'circle'
    if (obj instanceof fabric.Text || obj instanceof fabric.IText) return 'text'
    if (obj instanceof fabric.Line) return 'line'
    if (obj instanceof fabric.Group) return 'group'
    return 'rect' // default
  }

  getCustomTemplates(): Template[] {
    return this.customTemplates
  }

  deleteCustomTemplate(id: string): boolean {
    const index = this.customTemplates.findIndex(t => t.id === id)
    if (index !== -1) {
      this.customTemplates.splice(index, 1)
      this.templates.delete(id)
      return true
    }
    return false
  }

  exportTemplate(templateId: string): string {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }
    return JSON.stringify(template, null, 2)
  }

  importTemplate(jsonString: string): Template {
    const template = JSON.parse(jsonString) as Template
    this.addTemplate(template)
    if (template.category === TemplateCategory.CUSTOM) {
      this.customTemplates.push(template)
    }
    return template
  }
}