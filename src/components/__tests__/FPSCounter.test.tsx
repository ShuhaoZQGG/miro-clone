import React from 'react'
import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FPSCounter } from '../FPSCounter'
import { setupRAFMock } from '@/__tests__/utils/test-helpers'

describe('FPSCounter', () => {
  const rafMock = setupRAFMock()

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render FPS counter component', () => {
    render(<FPSCounter />)
    
    const fpsElement = screen.getByTestId('fps-counter')
    expect(fpsElement).toBeInTheDocument()
  })

  it('should display initial FPS value', () => {
    render(<FPSCounter />)
    
    const fpsDisplay = screen.getByTestId('fps-value')
    expect(fpsDisplay).toHaveTextContent('0 FPS')
  })

  it('should update FPS value based on frame rate', () => {
    render(<FPSCounter />)
    
    // Simulate 60 FPS (16ms per frame)
    act(() => {
      for (let i = 0; i < 60; i++) {
        rafMock.step(16.67)
      }
      jest.advanceTimersByTime(1000)
    })
    
    const fpsDisplay = screen.getByTestId('fps-value')
    expect(fpsDisplay).toHaveTextContent(/[5-6][0-9] FPS/)
  })

  it('should show performance indicator color', () => {
    render(<FPSCounter />)
    
    const indicator = screen.getByTestId('fps-indicator')
    
    // Good performance (>= 50 FPS)
    act(() => {
      for (let i = 0; i < 60; i++) {
        rafMock.step(16.67)
      }
      jest.advanceTimersByTime(1000)
    })
    expect(indicator).toHaveClass('fps-good')
    
    // Medium performance (30-49 FPS)
    act(() => {
      for (let i = 0; i < 35; i++) {
        rafMock.step(28.5)
      }
      jest.advanceTimersByTime(1000)
    })
    expect(indicator).toHaveClass('fps-medium')
    
    // Poor performance (< 30 FPS)
    act(() => {
      for (let i = 0; i < 20; i++) {
        rafMock.step(50)
      }
      jest.advanceTimersByTime(1000)
    })
    expect(indicator).toHaveClass('fps-poor')
  })

  it('should calculate average FPS over time window', () => {
    render(<FPSCounter />)
    
    // Simulate varying frame rates
    act(() => {
      // 60 FPS for 500ms
      for (let i = 0; i < 30; i++) {
        rafMock.step(16.67)
      }
      jest.advanceTimersByTime(500)
      
      // 30 FPS for 500ms
      for (let i = 0; i < 15; i++) {
        rafMock.step(33.33)
      }
      jest.advanceTimersByTime(500)
    })
    
    const fpsDisplay = screen.getByTestId('fps-value')
    // Average should be around 45 FPS
    expect(fpsDisplay).toHaveTextContent(/4[0-9] FPS/)
  })

  it('should be toggleable via visibility prop', () => {
    const { rerender } = render(<FPSCounter visible={true} />)
    
    expect(screen.getByTestId('fps-counter')).toBeVisible()
    
    rerender(<FPSCounter visible={false} />)
    
    expect(screen.queryByTestId('fps-counter')).not.toBeInTheDocument()
  })

  it('should expose FPS data via callback', () => {
    const onFPSUpdate = jest.fn()
    render(<FPSCounter onFPSUpdate={onFPSUpdate} />)
    
    act(() => {
      for (let i = 0; i < 60; i++) {
        rafMock.step(16.67)
      }
      jest.advanceTimersByTime(1000)
    })
    
    expect(onFPSUpdate).toHaveBeenCalledWith(expect.objectContaining({
      current: expect.any(Number),
      average: expect.any(Number),
      min: expect.any(Number),
      max: expect.any(Number)
    }))
  })
})