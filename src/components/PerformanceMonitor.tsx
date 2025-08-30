import React, { useEffect, useState, useRef } from 'react'
import { CanvasEngine } from '@/lib/canvas-engine'

interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  renderTime: number
  elementCount: number
  cpuUsage: number
}

interface PerformanceMonitorProps {
  engine: CanvasEngine | null
  isVisible: boolean
  onClose: () => void
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  engine, 
  isVisible, 
  onClose 
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    elementCount: 0,
    cpuUsage: 0
  })
  const animationFrameRef = useRef<number>()
  const lastTimeRef = useRef<number>(performance.now())
  const frameCountRef = useRef<number>(0)
  const fpsUpdateIntervalRef = useRef<number>(0)

  useEffect(() => {
    if (!isVisible || !engine) return

    const updateMetrics = () => {
      const currentTime = performance.now()
      frameCountRef.current++
      
      // Update FPS every 500ms
      if (currentTime - fpsUpdateIntervalRef.current > 500) {
        const deltaTime = currentTime - lastTimeRef.current
        const fps = Math.round((frameCountRef.current * 1000) / deltaTime)
        
        // Get memory usage if available
        let memoryUsage = 0
        if ('memory' in performance) {
          const memory = (performance as any).memory
          memoryUsage = Math.round(memory.usedJSHeapSize / 1048576) // Convert to MB
        }
        
        // Get element count
        const elementCount = engine.getElements().length
        
        // Simulate render time (in real implementation, this would come from the engine)
        const renderTime = Math.random() * 2 + 0.5 // 0.5-2.5ms
        
        // Simulate CPU usage (in real implementation, this would be calculated from actual metrics)
        const cpuUsage = Math.min(100, Math.round(fps < 30 ? 80 : fps < 50 ? 40 : 15))
        
        setMetrics({
          fps,
          memoryUsage,
          renderTime,
          elementCount,
          cpuUsage
        })
        
        frameCountRef.current = 0
        lastTimeRef.current = currentTime
        fpsUpdateIntervalRef.current = currentTime
      }
      
      animationFrameRef.current = requestAnimationFrame(updateMetrics)
    }
    
    animationFrameRef.current = requestAnimationFrame(updateMetrics)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isVisible, engine])

  if (!isVisible) return null

  const getFPSColor = (fps: number) => {
    if (fps >= 50) return 'text-green-500'
    if (fps >= 30) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getCPUColor = (cpu: number) => {
    if (cpu <= 20) return 'text-green-500'
    if (cpu <= 50) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="fixed top-20 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-64 z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Performance Monitor
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close performance monitor"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">FPS</span>
          <span className={`text-sm font-mono ${getFPSColor(metrics.fps)}`}>
            {metrics.fps}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">CPU Usage</span>
          <span className={`text-sm font-mono ${getCPUColor(metrics.cpuUsage)}`}>
            {metrics.cpuUsage}%
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">Memory</span>
          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
            {metrics.memoryUsage} MB
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">Render Time</span>
          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
            {metrics.renderTime.toFixed(1)} ms
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">Elements</span>
          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
            {metrics.elementCount}
          </span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Target: 60 FPS / {'<'}1% CPU
        </div>
      </div>
    </div>
  )
}