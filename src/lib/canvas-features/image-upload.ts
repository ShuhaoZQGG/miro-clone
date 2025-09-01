import { ImageElement, Position, Size } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export class ImageUploadManager {
  private canvas: HTMLElement
  private onImageAdd: (element: ImageElement) => void
  private dragoverHandler: (e: DragEvent) => void
  private dropHandler: (e: DragEvent) => void
  private pasteHandler: (e: ClipboardEvent) => void
  
  constructor(canvas: HTMLElement, onImageAdd: (element: ImageElement) => void) {
    this.canvas = canvas
    this.onImageAdd = onImageAdd
    
    // Create bound handlers for cleanup
    this.dragoverHandler = this.handleDragOver.bind(this)
    this.dropHandler = this.handleDrop.bind(this)
    this.pasteHandler = this.handlePaste.bind(this)
    
    this.setupEventListeners()
  }
  
  private setupEventListeners() {
    this.canvas.addEventListener('dragover', this.dragoverHandler as EventListener)
    this.canvas.addEventListener('drop', this.dropHandler as EventListener)
    this.canvas.addEventListener('paste', this.pasteHandler as EventListener)
  }
  
  private handleDragOver(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }
  
  private async handleDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    
    if (!e.dataTransfer?.files) return
    
    const position = this.getDropPosition(e)
    
    for (const file of Array.from(e.dataTransfer.files)) {
      if (file.type.startsWith('image/')) {
        try {
          const element = await this.processFile(file, position)
          this.onImageAdd(element)
          // Offset position for multiple files
          position.x += 20
          position.y += 20
        } catch (error) {
          console.error('Failed to process image:', error)
        }
      }
    }
  }
  
  private async handlePaste(e: ClipboardEvent) {
    if (!e.clipboardData?.files) return
    
    const position = { x: 100, y: 100 } // Default position for pasted images
    
    for (const file of Array.from(e.clipboardData.files)) {
      if (file.type.startsWith('image/')) {
        try {
          const element = await this.processFile(file, position)
          this.onImageAdd(element)
          position.x += 20
          position.y += 20
        } catch (error) {
          console.error('Failed to process pasted image:', error)
        }
      }
    }
  }
  
  private getDropPosition(e: DragEvent): Position {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }
  
  async processFile(file: File, position?: Position): Promise<ImageElement> {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Please upload an image file.')
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit')
    }
    
    // Read file as data URL
    const dataUrl = await this.readFileAsDataURL(file)
    
    // Get image dimensions
    const dimensions = await this.getImageDimensions(dataUrl)
    
    // Resize if too large
    const size = this.calculateDisplaySize(dimensions)
    
    // Create ImageElement
    const element: ImageElement = {
      id: uuidv4(),
      type: 'image',
      boardId: 'demo-board', // This should come from context in real app
      position: position || { x: 100, y: 100 },
      size,
      rotation: 0,
      layerIndex: 0,
      createdBy: 'current-user', // This should come from auth context
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: {
        url: dataUrl,
        alt: file.name,
        originalSize: dimensions
      }
    }
    
    return element
  }
  
  private readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string)
        } else {
          reject(new Error('Failed to read file'))
        }
      }
      
      reader.onerror = (e) => {
        reject(e.target?.error || new Error('File read error'))
      }
      
      reader.readAsDataURL(file)
    })
  }
  
  private getImageDimensions(dataUrl: string): Promise<Size> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        })
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      img.src = dataUrl
    })
  }
  
  private calculateDisplaySize(originalSize: Size): Size {
    const maxDimension = 2048
    
    if (originalSize.width <= maxDimension && originalSize.height <= maxDimension) {
      return { ...originalSize }
    }
    
    const aspectRatio = originalSize.width / originalSize.height
    
    if (originalSize.width > originalSize.height) {
      return {
        width: maxDimension,
        height: Math.round(maxDimension / aspectRatio)
      }
    } else {
      return {
        width: Math.round(maxDimension * aspectRatio),
        height: maxDimension
      }
    }
  }
  
  async handleFileInput(files: FileList) {
    const position = { x: 100, y: 100 }
    
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        try {
          const element = await this.processFile(file, position)
          this.onImageAdd(element)
          position.x += 20
          position.y += 20
        } catch (error) {
          console.error('Failed to process image:', error)
        }
      }
    }
  }
  
  cleanup() {
    this.canvas.removeEventListener('dragover', this.dragoverHandler as EventListener)
    this.canvas.removeEventListener('drop', this.dropHandler as EventListener)
    this.canvas.removeEventListener('paste', this.pasteHandler as EventListener)
  }
}