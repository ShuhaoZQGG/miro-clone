import { create } from 'zustand'

interface FPSData {
  current: number
  average: number
  min: number
  max: number
}

interface MemoryData {
  used: number
  limit: number
}

interface RenderTimeData {
  average: number
  max: number
}

interface PerformanceState {
  fps: FPSData | null
  memory: MemoryData | null
  renderTime: RenderTimeData | null
  objectCount: number
  eventCount: number
  updateFPS: (data: FPSData) => void
  updateMemory: (data: MemoryData) => void
  updateRenderTime: (data: RenderTimeData) => void
  updateObjectCount: (count: number) => void
  updateEventCount: (count: number) => void
  reset: () => void
}

export const usePerformanceStore = create<PerformanceState>((set) => ({
  fps: null,
  memory: null,
  renderTime: null,
  objectCount: 0,
  eventCount: 0,
  
  updateFPS: (data) => set({ fps: data }),
  
  updateMemory: (data) => set({ memory: data }),
  
  updateRenderTime: (data) => set({ renderTime: data }),
  
  updateObjectCount: (count) => set({ objectCount: count }),
  
  updateEventCount: (count) => set({ eventCount: count }),
  
  reset: () => set({
    fps: null,
    memory: null,
    renderTime: null,
    objectCount: 0,
    eventCount: 0
  })
}))