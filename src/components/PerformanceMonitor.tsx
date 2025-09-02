'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Cpu, HardDrive, Wifi, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { cn } from '@/lib/utils'

interface PerformanceMetrics {
  fps: number
  memory: number
  objectCount: number
  renderTime: number
  networkLatency: number
  webglEnabled: boolean
  crdtOperations: number
}

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics
  className?: string
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  metrics,
  className,
  position = 'top-right'
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [fpsHistory, setFpsHistory] = useState<number[]>([])
  const [memoryHistory, setMemoryHistory] = useState<number[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Update history arrays
    setFpsHistory(prev => [...prev.slice(-29), metrics.fps])
    setMemoryHistory(prev => [...prev.slice(-29), metrics.memory])
  }, [metrics.fps, metrics.memory])

  useEffect(() => {
    // Draw FPS graph
    if (canvasRef.current && isExpanded) {
      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return

      const width = canvasRef.current.width
      const height = canvasRef.current.height

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Draw grid
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 0.5
      for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Draw FPS line
      if (fpsHistory.length > 1) {
        ctx.strokeStyle = getFpsColor(metrics.fps)
        ctx.lineWidth = 2
        ctx.beginPath()

        fpsHistory.forEach((fps, index) => {
          const x = (width / 29) * index
          const y = height - (fps / 60) * height
          if (index === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })
        ctx.stroke()
      }
    }
  }, [fpsHistory, isExpanded, metrics.fps])

  const getFpsColor = (fps: number): string => {
    if (fps >= 55) return '#10b981' // Green
    if (fps >= 30) return '#f59e0b' // Yellow
    return '#ef4444' // Red
  }

  const getMemoryColor = (memory: number): string => {
    if (memory < 200) return '#10b981' // Green
    if (memory < 400) return '#f59e0b' // Yellow
    return '#ef4444' // Red
  }

  const getLatencyColor = (latency: number): string => {
    if (latency < 50) return '#10b981' // Green
    if (latency < 150) return '#f59e0b' // Yellow
    return '#ef4444' // Red
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }

  return (
    <motion.div
      className={cn(
        'fixed z-40',
        positionClasses[position],
        className
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className={cn(
        'bg-white/95 backdrop-blur-sm shadow-lg transition-all duration-200',
        isExpanded ? 'w-80' : 'w-48'
      )}>
        {/* Compact View */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Performance</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-auto"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getFpsColor(metrics.fps) }}
              />
              <span className="text-gray-600">FPS:</span>
              <span className="font-mono font-medium">{metrics.fps}</span>
            </div>
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-gray-500" />
              <span className="text-gray-600">Obj:</span>
              <span className="font-mono font-medium">{metrics.objectCount}</span>
            </div>
          </div>
        </div>

        {/* Expanded View */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t"
            >
              <div className="p-3 space-y-3">
                {/* FPS Graph */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">FPS History</span>
                    <span className="text-xs font-mono" style={{ color: getFpsColor(metrics.fps) }}>
                      {metrics.fps}/60
                    </span>
                  </div>
                  <canvas
                    ref={canvasRef}
                    width={256}
                    height={40}
                    className="w-full h-10 border rounded bg-gray-50"
                  />
                </div>

                {/* Detailed Metrics */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600">Memory:</span>
                    </div>
                    <span 
                      className="text-xs font-mono font-medium"
                      style={{ color: getMemoryColor(metrics.memory) }}
                    >
                      {metrics.memory} MB
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600">Render:</span>
                    </div>
                    <span className="text-xs font-mono font-medium">
                      {metrics.renderTime.toFixed(2)} ms
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600">Latency:</span>
                    </div>
                    <span 
                      className="text-xs font-mono font-medium"
                      style={{ color: getLatencyColor(metrics.networkLatency) }}
                    >
                      {metrics.networkLatency} ms
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">CRDT Ops:</span>
                    <span className="text-xs font-mono font-medium">
                      {metrics.crdtOperations}/s
                    </span>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="flex gap-2 pt-2 border-t">
                  <div className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded text-xs',
                    metrics.webglEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  )}>
                    <div className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      metrics.webglEnabled ? 'bg-green-500' : 'bg-gray-400'
                    )} />
                    WebGL {metrics.webglEnabled ? 'ON' : 'OFF'}
                  </div>

                  {metrics.fps < 30 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                      <AlertCircle className="w-3 h-3" />
                      Low FPS
                    </div>
                  )}
                </div>

                {/* Performance Suggestions */}
                {(metrics.fps < 30 || metrics.memory > 400 || metrics.objectCount > 1000) && (
                  <div className="p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                    <p className="font-medium mb-1">Optimization Suggested:</p>
                    <ul className="space-y-0.5 text-xs">
                      {metrics.fps < 30 && <li>• Reduce visual effects</li>}
                      {metrics.memory > 400 && <li>• Clear unused elements</li>}
                      {metrics.objectCount > 1000 && <li>• Enable viewport culling</li>}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}