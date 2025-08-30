import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PerformanceMetrics } from '../PerformanceMetrics'
import { usePerformanceStore } from '@/store/performance'

jest.mock('@/store/performance', () => ({
  usePerformanceStore: jest.fn()
}))

describe('PerformanceMetrics', () => {
  const mockPerformanceData = {
    fps: {
      current: 60,
      average: 58,
      min: 45,
      max: 60
    },
    memory: {
      used: 50 * 1024 * 1024, // 50 MB
      limit: 2048 * 1024 * 1024 // 2 GB
    },
    renderTime: {
      average: 12,
      max: 25
    },
    objectCount: 150,
    eventCount: 30
  }

  beforeEach(() => {
    const mockStore = usePerformanceStore as unknown as jest.Mock
    mockStore.mockReturnValue(mockPerformanceData)
  })

  it('should render performance metrics dashboard', () => {
    render(<PerformanceMetrics />)
    
    expect(screen.getByTestId('performance-metrics')).toBeInTheDocument()
  })

  it('should display FPS metrics', () => {
    render(<PerformanceMetrics />)
    
    expect(screen.getByText('FPS')).toBeInTheDocument()
    expect(screen.getByText('60')).toBeInTheDocument()
    expect(screen.getByText('Avg: 58')).toBeInTheDocument()
    expect(screen.getByText('Min: 45')).toBeInTheDocument()
    expect(screen.getByText('Max: 60')).toBeInTheDocument()
  })

  it('should display memory usage', () => {
    render(<PerformanceMetrics />)
    
    expect(screen.getByText('Memory')).toBeInTheDocument()
    expect(screen.getByText('50 MB')).toBeInTheDocument()
    expect(screen.getByText(/2\.4%/)).toBeInTheDocument() // Percentage of limit
  })

  it('should display render time metrics', () => {
    render(<PerformanceMetrics />)
    
    expect(screen.getByText('Render Time')).toBeInTheDocument()
    expect(screen.getByText('12 ms')).toBeInTheDocument()
    expect(screen.getByText('Max: 25 ms')).toBeInTheDocument()
  })

  it('should display object and event counts', () => {
    render(<PerformanceMetrics />)
    
    expect(screen.getByText('Objects: 150')).toBeInTheDocument()
    expect(screen.getByText('Events: 30/s')).toBeInTheDocument()
  })

  it('should be collapsible', () => {
    render(<PerformanceMetrics />)
    
    const toggleButton = screen.getByTestId('metrics-toggle')
    const content = screen.getByTestId('metrics-content')
    
    // Check initial state - content is visible (no display: none)
    expect(content.style.display).not.toBe('none')
    
    // Click to collapse
    fireEvent.click(toggleButton)
    expect(content.style.display).toBe('none')
    
    // Click to expand
    fireEvent.click(toggleButton)
    expect(content.style.display).toBe('block')
  })

  it('should show performance warnings', () => {
    const lowPerformanceData = {
      fps: {
        current: 25,
        average: 28,
        min: 20,
        max: 35
      },
      memory: mockPerformanceData.memory,
      renderTime: mockPerformanceData.renderTime,
      objectCount: mockPerformanceData.objectCount,
      eventCount: mockPerformanceData.eventCount
    }
    
    const mockStore = usePerformanceStore as unknown as jest.Mock
    mockStore.mockReturnValue(lowPerformanceData)
    
    render(<PerformanceMetrics />)
    
    expect(screen.getByTestId('performance-warning')).toBeInTheDocument()
    expect(screen.getByText(/Low FPS detected/)).toBeInTheDocument()
  })

  it('should allow position customization', () => {
    render(<PerformanceMetrics position="bottom-right" />)
    
    const dashboard = screen.getByTestId('performance-metrics')
    // Check that the element has the expected inline styles for bottom-right position
    const styles = window.getComputedStyle(dashboard)
    expect(dashboard.style.bottom).toBe('10px')
    expect(dashboard.style.right).toBe('10px')
    expect(dashboard.style.position).toBe('fixed')
  })

  it('should support minimal view mode', () => {
    render(<PerformanceMetrics minimal />)
    
    // In minimal mode, only show FPS and key metrics
    expect(screen.getByText(/60 FPS/)).toBeInTheDocument()
    expect(screen.queryByText('Render Time')).not.toBeInTheDocument()
  })
})