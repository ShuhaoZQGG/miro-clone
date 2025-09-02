import { CanvasElement, Bounds, Position, Size } from '@/types'

interface QuadTreeNode {
  bounds: Bounds
  elements: CanvasElement[]
  children: QuadTreeNode[] | null
  depth: number
}

interface CullingStats {
  totalElements: number
  visibleElements: number
  culledElements: number
  quadTreeDepth: number
  nodesVisited: number
}

export class ViewportCulling {
  private quadTree: QuadTreeNode | null = null
  private maxDepth = 6
  private maxElementsPerNode = 10
  private cullingStats: CullingStats = {
    totalElements: 0,
    visibleElements: 0,
    culledElements: 0,
    quadTreeDepth: 0,
    nodesVisited: 0
  }
  private viewportPadding = 100 // Padding around viewport for smoother scrolling
  private lastViewport: Bounds | null = null
  private dynamicLOD = true // Enable level-of-detail based on zoom
  
  constructor(config?: {
    maxDepth?: number
    maxElementsPerNode?: number
    viewportPadding?: number
    dynamicLOD?: boolean
  }) {
    if (config) {
      this.maxDepth = config.maxDepth ?? this.maxDepth
      this.maxElementsPerNode = config.maxElementsPerNode ?? this.maxElementsPerNode
      this.viewportPadding = config.viewportPadding ?? this.viewportPadding
      this.dynamicLOD = config.dynamicLOD ?? this.dynamicLOD
    }
  }

  /**
   * Build spatial index from elements
   */
  buildIndex(elements: CanvasElement[]): void {
    if (elements.length === 0) {
      this.quadTree = null
      return
    }
    
    // Calculate overall bounds
    const bounds = this.calculateBounds(elements)
    
    // Create root node
    this.quadTree = this.createNode(bounds, 0)
    
    // Insert all elements
    for (const element of elements) {
      this.insertElement(this.quadTree, element)
    }
    
    // Update stats
    this.cullingStats.totalElements = elements.length
    this.cullingStats.quadTreeDepth = this.calculateTreeDepth(this.quadTree)
  }

  /**
   * Calculate bounding box for elements
   */
  private calculateBounds(elements: CanvasElement[]): Bounds {
    if (elements.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }
    
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    
    for (const element of elements) {
      minX = Math.min(minX, element.position.x)
      minY = Math.min(minY, element.position.y)
      maxX = Math.max(maxX, element.position.x + element.size.width)
      maxY = Math.max(maxY, element.position.y + element.size.height)
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  /**
   * Create a new quad tree node
   */
  private createNode(bounds: Bounds, depth: number): QuadTreeNode {
    return {
      bounds,
      elements: [],
      children: null,
      depth
    }
  }

  /**
   * Insert element into quad tree
   */
  private insertElement(node: QuadTreeNode, element: CanvasElement): void {
    // Check if element intersects with node bounds
    if (!this.intersects(node.bounds, this.getElementBounds(element))) {
      return
    }
    
    // If node has children, insert into children
    if (node.children) {
      for (const child of node.children) {
        this.insertElement(child, element)
      }
      return
    }
    
    // Add element to this node
    node.elements.push(element)
    
    // Split node if necessary
    if (node.elements.length > this.maxElementsPerNode && node.depth < this.maxDepth) {
      this.splitNode(node)
    }
  }

  /**
   * Split node into four quadrants
   */
  private splitNode(node: QuadTreeNode): void {
    const { x, y, width, height } = node.bounds
    const halfWidth = width / 2
    const halfHeight = height / 2
    
    // Create four children
    node.children = [
      // Top-left
      this.createNode({
        x, y,
        width: halfWidth,
        height: halfHeight
      }, node.depth + 1),
      
      // Top-right
      this.createNode({
        x: x + halfWidth, y,
        width: halfWidth,
        height: halfHeight
      }, node.depth + 1),
      
      // Bottom-left
      this.createNode({
        x, y: y + halfHeight,
        width: halfWidth,
        height: halfHeight
      }, node.depth + 1),
      
      // Bottom-right
      this.createNode({
        x: x + halfWidth, y: y + halfHeight,
        width: halfWidth,
        height: halfHeight
      }, node.depth + 1)
    ]
    
    // Move elements to children
    const elements = node.elements
    node.elements = []
    
    for (const element of elements) {
      // Insert element into the appropriate child based on its position
      const elementBounds = this.getElementBounds(element)
      const center = {
        x: elementBounds.x + elementBounds.width / 2,
        y: elementBounds.y + elementBounds.height / 2
      }
      
      // Determine which quadrant the element belongs to
      let childIndex = 0
      if (center.x > x + halfWidth) childIndex += 1
      if (center.y > y + halfHeight) childIndex += 2
      
      this.insertElement(node.children[childIndex], element)
    }
  }

  /**
   * Get element bounds
   */
  private getElementBounds(element: CanvasElement): Bounds {
    return {
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height
    }
  }

  /**
   * Check if two bounds intersect
   */
  private intersects(a: Bounds, b: Bounds): boolean {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    )
  }

  /**
   * Query visible elements within viewport
   */
  queryViewport(viewport: Bounds, zoom: number = 1): CanvasElement[] {
    // Store last viewport for incremental updates (without padding for comparison)
    this.lastViewport = viewport
    
    if (!this.quadTree) {
      return []
    }
    
    // Add padding to viewport
    const paddedViewport: Bounds = {
      x: viewport.x - this.viewportPadding,
      y: viewport.y - this.viewportPadding,
      width: viewport.width + this.viewportPadding * 2,
      height: viewport.height + this.viewportPadding * 2
    }
    
    // Reset stats
    this.cullingStats.nodesVisited = 0
    this.cullingStats.visibleElements = 0
    this.cullingStats.culledElements = 0
    
    // Query quad tree
    const visibleElements = this.queryNode(this.quadTree, paddedViewport, zoom)
    
    // Update stats
    this.cullingStats.visibleElements = visibleElements.length
    this.cullingStats.culledElements = this.cullingStats.totalElements - visibleElements.length
    
    return visibleElements
  }

  /**
   * Recursively query quad tree node
   */
  private queryNode(node: QuadTreeNode, viewport: Bounds, zoom: number): CanvasElement[] {
    this.cullingStats.nodesVisited++
    
    // Check if node intersects with viewport
    if (!this.intersects(node.bounds, viewport)) {
      return []
    }
    
    const results: CanvasElement[] = []
    
    // If node has children, query children
    if (node.children) {
      for (const child of node.children) {
        results.push(...this.queryNode(child, viewport, zoom))
      }
    } else {
      // Check each element in this node
      for (const element of node.elements) {
        if (this.isElementVisible(element, viewport, zoom)) {
          results.push(element)
        }
      }
    }
    
    return results
  }

  /**
   * Check if element is visible in viewport
   */
  private isElementVisible(element: CanvasElement, viewport: Bounds, zoom: number): boolean {
    // Basic visibility check
    if (!element.isVisible) {
      return false
    }
    
    // Check bounds intersection
    const elementBounds = this.getElementBounds(element)
    if (!this.intersects(elementBounds, viewport)) {
      return false
    }
    
    // Apply level-of-detail culling if enabled
    if (this.dynamicLOD) {
      const lod = this.calculateLOD(element, zoom)
      if (lod < 0) {
        return false
      }
    }
    
    return true
  }

  /**
   * Calculate level-of-detail for element
   * Returns -1 if element should be culled, 0-3 for detail levels
   */
  private calculateLOD(element: CanvasElement, zoom: number): number {
    const minSize = 5 // Minimum pixel size to render
    const scaledWidth = element.size.width * zoom
    const scaledHeight = element.size.height * zoom
    
    // Cull very small elements
    if (scaledWidth < minSize && scaledHeight < minSize) {
      return -1
    }
    
    // Determine detail level based on size
    const maxDimension = Math.max(scaledWidth, scaledHeight)
    
    if (maxDimension > 200) {
      return 3 // Full detail
    } else if (maxDimension > 100) {
      return 2 // High detail
    } else if (maxDimension > 50) {
      return 1 // Medium detail
    } else {
      return 0 // Low detail
    }
  }

  /**
   * Get elements with level-of-detail information
   */
  queryViewportWithLOD(viewport: Bounds, zoom: number = 1): Array<{
    element: CanvasElement
    lod: number
  }> {
    if (!this.quadTree) {
      return []
    }
    
    const paddedViewport: Bounds = {
      x: viewport.x - this.viewportPadding,
      y: viewport.y - this.viewportPadding,
      width: viewport.width + this.viewportPadding * 2,
      height: viewport.height + this.viewportPadding * 2
    }
    
    const results: Array<{ element: CanvasElement; lod: number }> = []
    const elements = this.queryNode(this.quadTree, paddedViewport, zoom)
    
    for (const element of elements) {
      const lod = this.calculateLOD(element, zoom)
      if (lod >= 0) {
        results.push({ element, lod })
      }
    }
    
    return results
  }

  /**
   * Update element position in spatial index
   */
  updateElement(element: CanvasElement, oldPosition: Position): void {
    if (!this.quadTree) return
    
    // Remove from old position
    const removed = this.removeElement(this.quadTree, element, oldPosition)
    
    // Check if element is outside current bounds
    const elementBounds = this.getElementBounds(element)
    if (!this.intersects(this.quadTree.bounds, elementBounds)) {
      // Element moved outside bounds - rebuild the tree with expanded bounds
      const elements: CanvasElement[] = []
      this.collectElements(this.quadTree, elements)
      elements.push(element) // Add the updated element
      this.buildIndex(elements)
    } else {
      // Insert at new position
      this.insertElement(this.quadTree, element)
    }
  }

  /**
   * Remove element from quad tree
   */
  private removeElement(node: QuadTreeNode, element: CanvasElement, position: Position): boolean {
    const elementBounds: Bounds = {
      x: position.x,
      y: position.y,
      width: element.size.width,
      height: element.size.height
    }
    
    if (!this.intersects(node.bounds, elementBounds)) {
      return false
    }
    
    if (node.children) {
      for (const child of node.children) {
        if (this.removeElement(child, element, position)) {
          return true
        }
      }
    } else {
      const index = node.elements.findIndex(e => e.id === element.id)
      if (index !== -1) {
        node.elements.splice(index, 1)
        return true
      }
    }
    
    return false
  }

  /**
   * Calculate tree depth
   */
  private calculateTreeDepth(node: QuadTreeNode | null): number {
    if (!node) return 0
    
    if (!node.children) {
      return 1
    }
    
    let maxChildDepth = 0
    for (const child of node.children) {
      maxChildDepth = Math.max(maxChildDepth, this.calculateTreeDepth(child))
    }
    
    return maxChildDepth + 1
  }

  /**
   * Get culling statistics
   */
  getStats(): CullingStats {
    return { ...this.cullingStats }
  }

  /**
   * Set viewport padding
   */
  setViewportPadding(padding: number): void {
    this.viewportPadding = Math.max(0, padding)
  }

  /**
   * Enable or disable dynamic LOD
   */
  setDynamicLOD(enabled: boolean): void {
    this.dynamicLOD = enabled
  }

  /**
   * Clear spatial index
   */
  clear(): void {
    this.quadTree = null
    this.cullingStats = {
      totalElements: 0,
      visibleElements: 0,
      culledElements: 0,
      quadTreeDepth: 0,
      nodesVisited: 0
    }
    this.lastViewport = null
  }

  /**
   * Check if viewport has changed significantly
   */
  hasViewportChanged(viewport: Bounds, threshold: number = 50): boolean {
    if (!this.lastViewport) {
      return true
    }
    
    const dx = Math.abs(viewport.x - this.lastViewport.x)
    const dy = Math.abs(viewport.y - this.lastViewport.y)
    const dw = Math.abs(viewport.width - this.lastViewport.width)
    const dh = Math.abs(viewport.height - this.lastViewport.height)
    
    // console.log('hasViewportChanged:', { viewport, lastViewport: this.lastViewport, dx, dy, dw, dh, threshold })
    
    return dx > threshold || dy > threshold || dw > threshold || dh > threshold
  }

  /**
   * Optimize spatial index by rebuilding if fragmented
   */
  optimize(): void {
    if (!this.quadTree) return
    
    // Collect all elements
    const elements: CanvasElement[] = []
    this.collectElements(this.quadTree, elements)
    
    // Rebuild index
    this.buildIndex(elements)
  }

  /**
   * Collect all elements from tree
   */
  private collectElements(node: QuadTreeNode, elements: CanvasElement[]): void {
    if (node.children) {
      for (const child of node.children) {
        this.collectElements(child, elements)
      }
    } else {
      elements.push(...node.elements)
    }
  }
}