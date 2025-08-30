'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

interface PerformanceMetrics {
  fps: number
  frameTime: number
  memory?: {
    used: number
    total: number
    percentage: number
  }
  elementCount: number
}

export function PerformanceOverlay() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    elementCount: 0
  })
  
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const fpsHistoryRef = useRef<number[]>([])
  const rafIdRef = useRef<number>()
  const overlayRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })

  // FPS calculation
  const updateFPS = useCallback(() => {
    const currentTime = performance.now()
    const deltaTime = currentTime - lastTimeRef.current
    
    frameCountRef.current++
    
    // Update every 250ms (4Hz)
    if (deltaTime >= 250) {
      const fps = Math.round((frameCountRef.current * 1000) / deltaTime)
      const frameTime = deltaTime / frameCountRef.current
      
      // Update FPS history for graph
      fpsHistoryRef.current.push(fps)
      if (fpsHistoryRef.current.length > 20) {
        fpsHistoryRef.current.shift()
      }
      
      // Update memory if available
      let memory
      if ('memory' in performance) {
        const perfMemory = (performance as any).memory
        memory = {
          used: perfMemory.usedJSHeapSize,
          total: perfMemory.jsHeapSizeLimit,
          percentage: (perfMemory.usedJSHeapSize / perfMemory.jsHeapSizeLimit) * 100
        }
      }
      
      // Get element count from canvas
      const canvasElements = document.querySelectorAll('.canvas-element').length
      
      setMetrics({
        fps,
        frameTime: Math.round(frameTime * 100) / 100,
        memory,
        elementCount: canvasElements
      })
      
      frameCountRef.current = 0
      lastTimeRef.current = currentTime
    }
    
    rafIdRef.current = requestAnimationFrame(updateFPS)
  }, [])

  // Start/stop monitoring
  useEffect(() => {
    if (isVisible) {
      rafIdRef.current = requestAnimationFrame(updateFPS)
    } else {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
    
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [isVisible, updateFPS])

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        setIsVisible(!isVisible)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible])

  // Drag handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
  }, [position])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    })
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  if (!isVisible) {
    return null
  }

  // Determine FPS color
  const getFPSColor = (fps: number) => {
    if (fps >= 55) return '#4CAF50' // Green
    if (fps >= 30) return '#FFC107' // Yellow
    return '#F44336' // Red
  }

  const fpsColor = getFPSColor(metrics.fps)

  // Generate FPS graph
  const maxFPS = Math.max(...fpsHistoryRef.current, 60)
  const graphBars = fpsHistoryRef.current.map(fps => {
    const height = (fps / maxFPS) * 20
    return height
  })

  return (
    <div
      ref={overlayRef}
      className="fixed z-50 select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#00ff00',
        padding: '8px 12px',
        borderRadius: '4px',
        fontFamily: 'Monaco, monospace',
        fontSize: '10px',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        minWidth: '150px'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* FPS Display */}
      <div style={{ marginBottom: '4px' }}>
        <span style={{ color: fpsColor, fontWeight: 'bold' }}>
          FPS: {metrics.fps}
        </span>
        <span style={{ marginLeft: '8px', fontSize: '9px', opacity: 0.8 }}>
          {graphBars.map((height, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                width: '2px',
                height: `${height}px`,
                backgroundColor: getFPSColor(fpsHistoryRef.current[i]),
                marginRight: '1px',
                verticalAlign: 'bottom'
              }}
            />
          ))}
        </span>
      </div>
      
      {/* Memory Display */}
      {metrics.memory && (
        <div style={{ marginBottom: '4px' }}>
          <span>MEM: {Math.round(metrics.memory.used / 1048576)}MB</span>
          <div
            style={{
              display: 'inline-block',
              marginLeft: '8px',
              width: '40px',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              position: 'relative',
              verticalAlign: 'middle'
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${metrics.memory.percentage}%`,
                backgroundColor: metrics.memory.percentage > 80 ? '#F44336' : '#4CAF50'
              }}
            />
          </div>
        </div>
      )}
      
      {/* Element Count */}
      <div style={{ marginBottom: '4px' }}>
        <span>OBJ: {metrics.elementCount} elements</span>
      </div>
      
      {/* Frame Time */}
      <div>
        <span>RAF: {metrics.frameTime}ms</span>
      </div>
      
      {/* Performance Warning */}
      {metrics.fps < 30 && (
        <div
          style={{
            marginTop: '4px',
            padding: '2px 4px',
            backgroundColor: 'rgba(244, 67, 54, 0.2)',
            borderLeft: '2px solid #F44336',
            color: '#F44336',
            fontSize: '9px'
          }}
        >
          Performance degraded!
        </div>
      )}
    </div>
  )
}