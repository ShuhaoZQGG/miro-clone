'use client'

import React, { useEffect, useRef } from 'react'
import { useCanvasStore } from '@/store/useCanvasStore'
import { clsx } from 'clsx'

interface GridProps {
  className?: string
}

export const Grid: React.FC<GridProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { camera, isGridVisible } = useCanvasStore()
  
  const gridSize = 20 // Base grid size in pixels
  const minVisibleZoom = 0.5 // Minimum zoom level to show grid
  const maxVisibleZoom = 3.0 // Maximum zoom level to show grid

  useEffect(() => {
    if (!canvasRef.current || !isGridVisible) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Get canvas dimensions
    const rect = canvas.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    
    // Set canvas actual size
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    
    // Scale for high DPI displays
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Don't render grid if zoom is outside visible range
    if (camera.zoom < minVisibleZoom || camera.zoom > maxVisibleZoom) {
      return
    }
    
    // Calculate grid spacing based on zoom
    const effectiveGridSize = gridSize * camera.zoom
    
    // Calculate grid opacity based on zoom
    let opacity = 0.3
    if (camera.zoom < 0.8) {
      opacity = 0.1
    } else if (camera.zoom > 2.0) {
      opacity = 0.5
    }
    
    // Set grid style
    ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`
    ctx.lineWidth = 0.5
    
    // Calculate offset based on camera position
    const offsetX = (-camera.x * camera.zoom) % effectiveGridSize
    const offsetY = (-camera.y * camera.zoom) % effectiveGridSize
    
    // Draw vertical lines
    for (let x = offsetX; x < width; x += effectiveGridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    
    // Draw horizontal lines
    for (let y = offsetY; y < height; y += effectiveGridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
    
    // Draw center axes (origin indicators) if we're close to zoom level 1
    if (camera.zoom > 0.8 && camera.zoom < 1.5) {
      const centerX = -camera.x * camera.zoom + width / 2
      const centerY = -camera.y * camera.zoom + height / 2
      
      ctx.strokeStyle = `rgba(59, 130, 246, 0.4)` // Blue color
      ctx.lineWidth = 1
      
      // Draw center vertical line if it's visible
      if (centerX >= 0 && centerX <= width) {
        ctx.beginPath()
        ctx.moveTo(centerX, 0)
        ctx.lineTo(centerX, height)
        ctx.stroke()
      }
      
      // Draw center horizontal line if it's visible
      if (centerY >= 0 && centerY <= height) {
        ctx.beginPath()
        ctx.moveTo(0, centerY)
        ctx.lineTo(width, centerY)
        ctx.stroke()
      }
    }
    
  }, [camera, isGridVisible])

  if (!isGridVisible) return null

  return (
    <canvas
      ref={canvasRef}
      className={clsx(
        'absolute inset-0 pointer-events-none z-0',
        className
      )}
      style={{ 
        mixBlendMode: 'multiply'
      }}
    />
  )
}