import React, { useState } from 'react'
import { usePerformanceStore } from '@/store/performance'

interface PerformanceMetricsProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  minimal?: boolean
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  position = 'top-right',
  minimal = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const performanceData = usePerformanceStore()
  
  const formatMemory = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${Math.round(mb)} MB`
  }
  
  const getMemoryPercentage = () => {
    if (!performanceData.memory) return 0
    return ((performanceData.memory.used / performanceData.memory.limit) * 100).toFixed(1)
  }
  
  const getPositionStyles = () => {
    const styles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9998
    }
    
    switch (position) {
      case 'top-left':
        styles.top = '10px'
        styles.left = '10px'
        break
      case 'bottom-left':
        styles.bottom = '10px'
        styles.left = '10px'
        break
      case 'bottom-right':
        styles.bottom = '10px'
        styles.right = '10px'
        break
      case 'top-right':
      default:
        styles.top = '10px'
        styles.right = '10px'
        break
    }
    
    return styles
  }
  
  const isLowPerformance = performanceData.fps?.current ? performanceData.fps.current < 30 : false
  
  if (minimal) {
    return (
      <div
        data-testid="performance-metrics"
        style={{
          ...getPositionStyles(),
          padding: '6px 10px',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          color: 'white',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '12px',
          display: 'flex',
          gap: '12px'
        }}
      >
        <span>{performanceData.fps?.current || 0} FPS</span>
        <span>Objects: {performanceData.objectCount || 0}</span>
      </div>
    )
  }
  
  return (
    <div
      data-testid="performance-metrics"
      style={{
        ...getPositionStyles(),
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        borderRadius: '8px',
        padding: '12px',
        fontFamily: 'monospace',
        fontSize: '12px',
        minWidth: '250px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Performance Metrics</h3>
        <button
          data-testid="metrics-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>
      
      {isLowPerformance && (
        <div
          data-testid="performance-warning"
          style={{
            backgroundColor: '#ff5252',
            padding: '4px 8px',
            borderRadius: '4px',
            marginBottom: '8px'
          }}
        >
          ⚠️ Low FPS detected
        </div>
      )}
      
      <div
        data-testid="metrics-content"
        style={{
          display: isCollapsed ? 'none' : 'block'
        }}
      >
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>FPS</div>
          <div style={{ paddingLeft: '8px' }}>
            <div>{performanceData.fps?.current || 0}</div>
            <div style={{ fontSize: '10px', opacity: 0.8 }}>
              Avg: {performanceData.fps?.average || 0}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.8 }}>
              Min: {performanceData.fps?.min || 0}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.8 }}>
              Max: {performanceData.fps?.max || 0}
            </div>
          </div>
        </div>
        
        {performanceData.memory && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Memory</div>
            <div style={{ paddingLeft: '8px' }}>
              <div>{formatMemory(performanceData.memory.used)}</div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>
                {getMemoryPercentage()}% of limit
              </div>
            </div>
          </div>
        )}
        
        {performanceData.renderTime && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Render Time</div>
            <div style={{ paddingLeft: '8px' }}>
              <div>{performanceData.renderTime.average} ms</div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>
                Max: {performanceData.renderTime.max} ms
              </div>
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <div>Objects: {performanceData.objectCount || 0}</div>
          <div>Events: {performanceData.eventCount || 0}/s</div>
        </div>
      </div>
    </div>
  )
}