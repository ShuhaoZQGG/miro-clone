import React, { useEffect, useRef, useState, useCallback } from 'react'

interface FPSData {
  current: number
  average: number
  min: number
  max: number
}

interface FPSCounterProps {
  visible?: boolean
  onFPSUpdate?: (data: FPSData) => void
  updateInterval?: number
}

export const FPSCounter: React.FC<FPSCounterProps> = ({
  visible = true,
  onFPSUpdate,
  updateInterval = 1000
}) => {
  const [fps, setFps] = useState(0)
  const [performanceClass, setPerformanceClass] = useState('fps-good')
  
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  const fpsHistory = useRef<number[]>([])
  const animationId = useRef<number>()
  const updateTimer = useRef<NodeJS.Timeout>()

  const calculateFPS = useCallback(() => {
    const currentTime = performance.now()
    const deltaTime = currentTime - lastTime.current
    
    if (deltaTime >= updateInterval) {
      const currentFPS = Math.round((frameCount.current * 1000) / deltaTime)
      
      fpsHistory.current.push(currentFPS)
      if (fpsHistory.current.length > 10) {
        fpsHistory.current.shift()
      }
      
      const average = Math.round(
        fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length
      )
      
      const min = Math.min(...fpsHistory.current)
      const max = Math.max(...fpsHistory.current)
      
      setFps(currentFPS)
      
      // Set performance class
      if (currentFPS >= 50) {
        setPerformanceClass('fps-good')
      } else if (currentFPS >= 30) {
        setPerformanceClass('fps-medium')
      } else {
        setPerformanceClass('fps-poor')
      }
      
      if (onFPSUpdate) {
        onFPSUpdate({
          current: currentFPS,
          average,
          min,
          max
        })
      }
      
      frameCount.current = 0
      lastTime.current = currentTime
    }
    
    frameCount.current++
  }, [updateInterval, onFPSUpdate])

  const animate = useCallback(() => {
    calculateFPS()
    animationId.current = requestAnimationFrame(animate)
  }, [calculateFPS])

  useEffect(() => {
    if (visible) {
      animationId.current = requestAnimationFrame(animate)
      
      return () => {
        if (animationId.current) {
          cancelAnimationFrame(animationId.current)
        }
        if (updateTimer.current) {
          clearInterval(updateTimer.current)
        }
      }
    }
  }, [visible, animate])

  if (!visible) {
    return null
  }

  return (
    <div
      data-testid="fps-counter"
      className="fps-counter"
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        padding: '8px 12px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <div
        data-testid="fps-indicator"
        className={performanceClass}
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: performanceClass === 'fps-good' ? '#4CAF50' :
                          performanceClass === 'fps-medium' ? '#FFC107' : '#F44336'
        }}
      />
      <span data-testid="fps-value">{fps} FPS</span>
    </div>
  )
}