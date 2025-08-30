import { fabric } from 'fabric'
import { CanvasElement } from '@/types'

export class LayerManager {
  private canvas: fabric.Canvas
  private elements: CanvasElement[]

  constructor(canvas: fabric.Canvas, elements: CanvasElement[]) {
    this.canvas = canvas
    this.elements = elements
  }

  /**
   * Move element to the front (highest layer)
   */
  moveToFront(elementId: string): boolean {
    const element = this.findElement(elementId)
    if (!element) return false

    // Get the highest layer index
    const maxLayerIndex = Math.max(...this.elements.map(e => e.layerIndex))
    
    // Update layer indices
    this.elements.forEach(el => {
      if (el.layerIndex > element.layerIndex) {
        el.layerIndex--
      }
    })
    
    element.layerIndex = maxLayerIndex
    element.updatedAt = new Date().toISOString()

    // Update canvas if fabric object exists
    const fabricObject = this.getFabricObject(elementId)
    if (fabricObject) {
      this.canvas.bringToFront(fabricObject)
      this.canvas.renderAll()
    }

    return true
  }

  /**
   * Move element to the back (lowest layer)
   */
  moveToBack(elementId: string): boolean {
    const element = this.findElement(elementId)
    if (!element) return false

    // Update layer indices
    this.elements.forEach(el => {
      if (el.layerIndex < element.layerIndex) {
        el.layerIndex++
      }
    })
    
    element.layerIndex = 0
    element.updatedAt = new Date().toISOString()

    // Update canvas if fabric object exists
    const fabricObject = this.getFabricObject(elementId)
    if (fabricObject) {
      this.canvas.sendToBack(fabricObject)
      this.canvas.renderAll()
    }

    return true
  }

  /**
   * Move element up one layer
   */
  moveUp(elementId: string): boolean {
    const element = this.findElement(elementId)
    if (!element) return false

    // Check if already at top
    const maxLayerIndex = Math.max(...this.elements.map(e => e.layerIndex))
    if (element.layerIndex >= maxLayerIndex) return false

    // Find element above
    const elementAbove = this.elements.find(e => e.layerIndex === element.layerIndex + 1)
    if (elementAbove) {
      // Swap layer indices
      elementAbove.layerIndex = element.layerIndex
      elementAbove.updatedAt = new Date().toISOString()
    }
    
    element.layerIndex++
    element.updatedAt = new Date().toISOString()

    // Update canvas if fabric object exists
    const fabricObject = this.getFabricObject(elementId)
    if (fabricObject) {
      this.canvas.bringForward(fabricObject)
      this.canvas.renderAll()
    }

    return true
  }

  /**
   * Move element down one layer
   */
  moveDown(elementId: string): boolean {
    const element = this.findElement(elementId)
    if (!element) return false

    // Check if already at bottom
    if (element.layerIndex <= 0) return false

    // Find element below
    const elementBelow = this.elements.find(e => e.layerIndex === element.layerIndex - 1)
    if (elementBelow) {
      // Swap layer indices
      elementBelow.layerIndex = element.layerIndex
      elementBelow.updatedAt = new Date().toISOString()
    }
    
    element.layerIndex--
    element.updatedAt = new Date().toISOString()

    // Update canvas if fabric object exists
    const fabricObject = this.getFabricObject(elementId)
    if (fabricObject) {
      this.canvas.sendBackwards(fabricObject)
      this.canvas.renderAll()
    }

    return true
  }

  /**
   * Move element to specific layer
   */
  moveToLayer(elementId: string, targetLayer: number): boolean {
    const element = this.findElement(elementId)
    if (!element) return false

    // Clamp target layer to valid range
    const maxLayerIndex = this.elements.length - 1
    const clampedLayer = Math.max(0, Math.min(targetLayer, maxLayerIndex))

    // Reorganize layer indices
    const oldLayer = element.layerIndex
    element.layerIndex = clampedLayer
    element.updatedAt = new Date().toISOString()

    // Adjust other elements
    this.elements.forEach(el => {
      if (el.id !== elementId) {
        if (oldLayer < clampedLayer) {
          // Moving up
          if (el.layerIndex > oldLayer && el.layerIndex <= clampedLayer) {
            el.layerIndex--
            el.updatedAt = new Date().toISOString()
          }
        } else if (oldLayer > clampedLayer) {
          // Moving down
          if (el.layerIndex >= clampedLayer && el.layerIndex < oldLayer) {
            el.layerIndex++
            el.updatedAt = new Date().toISOString()
          }
        }
      }
    })

    // Update canvas if fabric object exists
    const fabricObject = this.getFabricObject(elementId)
    if (fabricObject) {
      this.canvas.moveTo(fabricObject, clampedLayer)
      this.canvas.renderAll()
    }

    return true
  }

  /**
   * Get elements sorted by layer order
   */
  getLayerOrder(): CanvasElement[] {
    return [...this.elements].sort((a, b) => a.layerIndex - b.layerIndex)
  }

  /**
   * Swap layers between two elements
   */
  swapLayers(elementId1: string, elementId2: string): boolean {
    const element1 = this.findElement(elementId1)
    const element2 = this.findElement(elementId2)
    
    if (!element1 || !element2) return false

    // Swap layer indices
    const tempLayer = element1.layerIndex
    element1.layerIndex = element2.layerIndex
    element2.layerIndex = tempLayer
    
    element1.updatedAt = new Date().toISOString()
    element2.updatedAt = new Date().toISOString()

    // Update canvas
    this.reorganizeCanvas()
    this.canvas.renderAll()

    return true
  }

  /**
   * Normalize layer indices to be sequential
   */
  normalizeLayerIndices(): void {
    // Sort elements by current layer index
    const sorted = [...this.elements].sort((a, b) => a.layerIndex - b.layerIndex)
    
    // Assign sequential indices
    sorted.forEach((element, index) => {
      element.layerIndex = index
      element.updatedAt = new Date().toISOString()
    })

    // Update canvas order
    this.reorganizeCanvas()
  }

  /**
   * Helper: Find element by ID
   */
  private findElement(elementId: string): CanvasElement | undefined {
    return this.elements.find(e => e.id === elementId)
  }

  /**
   * Helper: Get Fabric object for element
   */
  private getFabricObject(elementId: string): fabric.Object | undefined {
    const objects = this.canvas.getObjects()
    return objects?.find(obj => (obj as any).elementId === elementId)
  }

  /**
   * Helper: Reorganize canvas objects based on layer indices
   */
  private reorganizeCanvas(): void {
    const sorted = this.getLayerOrder()
    const fabricObjects = this.canvas.getObjects()
    
    if (!fabricObjects) return
    
    // Create a map of element ID to fabric object
    const fabricMap = new Map<string, fabric.Object>()
    fabricObjects.forEach(obj => {
      const elementId = (obj as any).elementId
      if (elementId) {
        fabricMap.set(elementId, obj)
      }
    })

    // Clear and re-add in correct order
    this.canvas.clear()
    sorted.forEach(element => {
      const fabricObject = fabricMap.get(element.id)
      if (fabricObject) {
        this.canvas.add(fabricObject)
      }
    })
  }

  /**
   * Set elements (for updating the elements array)
   */
  setElements(elements: CanvasElement[]): void {
    this.elements = elements
  }
}