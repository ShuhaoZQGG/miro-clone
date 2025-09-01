import { ImageElement } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export class ImageUploadHandler {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private readonly ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']

  validateFile(file: File): void {
    if (!this.ACCEPTED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload an image file.')
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit.')
    }
  }

  async processImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string)
        } else {
          reject(new Error('Failed to read file'))
        }
      }
      
      reader.onerror = (error) => {
        reject(error)
      }
      
      reader.readAsDataURL(file)
    })
  }

  async getImageDimensions(src: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image()
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        })
      }
      
      img.onerror = () => {
        // Default dimensions if loading fails
        resolve({ width: 300, height: 200 })
      }
      
      img.src = src
    })
  }

  async handleImageUpload(
    file: File,
    onImageAdd: (element: Partial<ImageElement>) => void,
    position?: { x: number; y: number }
  ): Promise<void> {
    try {
      this.validateFile(file)
      const dataUrl = await this.processImage(file)
      const dimensions = await this.getImageDimensions(dataUrl)
      
      const imageElement: Partial<ImageElement> = {
        id: uuidv4(),
        type: 'image',
        src: dataUrl,
        x: position?.x || 100,
        y: position?.y || 100,
        width: Math.min(dimensions.width, 600), // Max width 600px
        height: Math.min(dimensions.height, 400), // Max height 400px
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        name: file.name,
      }
      
      onImageAdd(imageElement)
    } catch (error) {
      console.error('Image upload failed:', error)
      throw error
    }
  }

  async handleDrop(
    event: DragEvent,
    onImageAdd: (element: Partial<ImageElement>) => void
  ): Promise<void> {
    event.preventDefault()
    
    const files = Array.from(event.dataTransfer?.files || [])
    const imageFiles = files.filter(file => this.ACCEPTED_TYPES.includes(file.type))
    
    const position = {
      x: event.clientX,
      y: event.clientY,
    }
    
    for (const file of imageFiles) {
      try {
        await this.handleImageUpload(file, onImageAdd, position)
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
      }
    }
  }

  async handlePaste(
    event: ClipboardEvent,
    onImageAdd: (element: Partial<ImageElement>) => void
  ): Promise<void> {
    const items = Array.from(event.clipboardData?.items || [])
    
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        event.preventDefault()
        const file = item.getAsFile()
        
        if (file) {
          try {
            await this.handleImageUpload(file, onImageAdd)
          } catch (error) {
            console.error('Failed to paste image:', error)
          }
        }
      }
    }
  }

  createFileInput(
    onImageAdd: (element: Partial<ImageElement>) => void
  ): HTMLInputElement {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = this.ACCEPTED_TYPES.join(',')
    input.multiple = true
    
    input.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement
      const files = Array.from(target.files || [])
      
      for (const file of files) {
        try {
          await this.handleImageUpload(file, onImageAdd)
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
        }
      }
      
      // Reset input
      target.value = ''
    })
    
    return input
  }
}