import { CanvasElement } from '@/types'

const DB_NAME = 'miro-clone-db'
const DB_VERSION = 1
const BOARD_STORE = 'boards'
const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

export interface BoardData {
  id: string
  name: string
  elements: CanvasElement[]
  camera: { x: number; y: number; zoom: number }
  createdAt: string
  updatedAt: string
  thumbnail?: string
}

export class PersistenceManager {
  private db: IDBDatabase | null = null
  private autoSaveTimer: number | null = null
  private pendingSave: Promise<void> | null = null

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }
      
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(BOARD_STORE)) {
          const store = db.createObjectStore(BOARD_STORE, { keyPath: 'id' })
          store.createIndex('updatedAt', 'updatedAt', { unique: false })
          store.createIndex('name', 'name', { unique: false })
        }
      }
    })
  }

  async saveBoard(boardData: BoardData): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }
    
    // Avoid concurrent saves
    if (this.pendingSave) {
      await this.pendingSave
    }
    
    this.pendingSave = this._performSave(boardData)
    await this.pendingSave
    this.pendingSave = null
  }

  private async _performSave(boardData: BoardData): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }
      
      const transaction = this.db.transaction([BOARD_STORE], 'readwrite')
      const store = transaction.objectStore(BOARD_STORE)
      
      const updatedData = {
        ...boardData,
        updatedAt: new Date().toISOString()
      }
      
      const request = store.put(updatedData)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to save board'))
    })
  }

  async loadBoard(boardId: string): Promise<BoardData | null> {
    if (!this.db) {
      await this.initialize()
    }
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }
      
      const transaction = this.db.transaction([BOARD_STORE], 'readonly')
      const store = transaction.objectStore(BOARD_STORE)
      const request = store.get(boardId)
      
      request.onsuccess = () => {
        resolve(request.result || null)
      }
      
      request.onerror = () => {
        reject(new Error('Failed to load board'))
      }
    })
  }

  async getAllBoards(): Promise<BoardData[]> {
    if (!this.db) {
      await this.initialize()
    }
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }
      
      const transaction = this.db.transaction([BOARD_STORE], 'readonly')
      const store = transaction.objectStore(BOARD_STORE)
      const index = store.index('updatedAt')
      const request = index.openCursor(null, 'prev') // Sort by most recent
      
      const boards: BoardData[] = []
      
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          boards.push(cursor.value)
          cursor.continue()
        } else {
          resolve(boards)
        }
      }
      
      request.onerror = () => {
        reject(new Error('Failed to get boards'))
      }
    })
  }

  async deleteBoard(boardId: string): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }
      
      const transaction = this.db.transaction([BOARD_STORE], 'readwrite')
      const store = transaction.objectStore(BOARD_STORE)
      const request = store.delete(boardId)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to delete board'))
    })
  }

  startAutoSave(
    boardId: string,
    getDataCallback: () => Omit<BoardData, 'id'>
  ): void {
    this.stopAutoSave()
    
    this.autoSaveTimer = window.setInterval(async () => {
      try {
        const data = getDataCallback()
        await this.saveBoard({
          ...data,
          id: boardId
        })
        console.log('Auto-save completed')
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, AUTO_SAVE_INTERVAL)
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }

  async createThumbnail(canvas: HTMLCanvasElement): Promise<string> {
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const reader = new FileReader()
            reader.onloadend = () => {
              resolve(reader.result as string)
            }
            reader.readAsDataURL(blob)
          } else {
            resolve('')
          }
        },
        'image/jpeg',
        0.5 // 50% quality for smaller size
      )
    })
  }

  dispose(): void {
    this.stopAutoSave()
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// Singleton instance
export const persistenceManager = new PersistenceManager()