import { debounce } from '../utils'

describe('Resize Handler Tests', () => {
  let resizeCallback: jest.Mock
  let debouncedResize: ReturnType<typeof debounce>

  beforeEach(() => {
    jest.useFakeTimers()
    resizeCallback = jest.fn()
    debouncedResize = debounce(resizeCallback, 100)
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  describe('Debounced Resize', () => {
    it('should debounce resize events at 100ms', () => {
      // Trigger multiple resize events rapidly
      for (let i = 0; i < 10; i++) {
        debouncedResize({ width: 1920 + i, height: 1080 + i })
      }

      // Should not call immediately
      expect(resizeCallback).not.toHaveBeenCalled()

      // Fast-forward 50ms
      jest.advanceTimersByTime(50)
      expect(resizeCallback).not.toHaveBeenCalled()

      // Fast-forward to 100ms
      jest.advanceTimersByTime(50)
      expect(resizeCallback).toHaveBeenCalledTimes(1)
      expect(resizeCallback).toHaveBeenCalledWith({ width: 1929, height: 1089 })
    })

    it('should reset timer on each call within debounce period', () => {
      debouncedResize({ width: 1920, height: 1080 })
      
      // Wait 90ms
      jest.advanceTimersByTime(90)
      expect(resizeCallback).not.toHaveBeenCalled()
      
      // Call again, should reset timer
      debouncedResize({ width: 1600, height: 900 })
      
      // Wait another 90ms (total 180ms from first call)
      jest.advanceTimersByTime(90)
      expect(resizeCallback).not.toHaveBeenCalled()
      
      // Wait final 10ms to complete debounce
      jest.advanceTimersByTime(10)
      expect(resizeCallback).toHaveBeenCalledTimes(1)
      expect(resizeCallback).toHaveBeenCalledWith({ width: 1600, height: 900 })
    })

    it('should handle rapid continuous resizing', () => {
      const sizes = [
        { width: 1920, height: 1080 },
        { width: 1600, height: 900 },
        { width: 1280, height: 720 },
        { width: 1024, height: 768 },
        { width: 800, height: 600 }
      ]

      // Simulate rapid resizing
      sizes.forEach((size, index) => {
        setTimeout(() => debouncedResize(size), index * 20)
      })

      // Execute all scheduled timeouts
      jest.advanceTimersByTime(80)
      
      // Should not have called yet
      expect(resizeCallback).not.toHaveBeenCalled()

      // Wait for debounce to complete
      jest.advanceTimersByTime(100)
      
      // Should only call once with last value
      expect(resizeCallback).toHaveBeenCalledTimes(1)
      expect(resizeCallback).toHaveBeenCalledWith({ width: 800, height: 600 })
    })

    it('should allow separate calls after debounce period', () => {
      // First resize
      debouncedResize({ width: 1920, height: 1080 })
      jest.advanceTimersByTime(100)
      expect(resizeCallback).toHaveBeenCalledTimes(1)

      // Second resize after debounce completed
      debouncedResize({ width: 1600, height: 900 })
      jest.advanceTimersByTime(100)
      expect(resizeCallback).toHaveBeenCalledTimes(2)

      // Verify both calls
      expect(resizeCallback).toHaveBeenNthCalledWith(1, { width: 1920, height: 1080 })
      expect(resizeCallback).toHaveBeenNthCalledWith(2, { width: 1600, height: 900 })
    })
  })

  describe('Canvas Resize Integration', () => {
    it('should maintain aspect ratio during resize', () => {
      const maintainAspectRatio = (size: { width: number; height: number }) => {
        const aspectRatio = 16 / 9
        const currentRatio = size.width / size.height
        
        if (Math.abs(currentRatio - aspectRatio) > 0.01) {
          // Adjust to maintain aspect ratio
          if (currentRatio > aspectRatio) {
            size.height = size.width / aspectRatio
          } else {
            size.width = size.height * aspectRatio
          }
        }
        
        resizeCallback(size)
      }

      const debouncedAspectResize = debounce(maintainAspectRatio, 100)

      debouncedAspectResize({ width: 1920, height: 1080 })
      jest.advanceTimersByTime(100)
      
      expect(resizeCallback).toHaveBeenCalledWith({ width: 1920, height: 1080 })

      // Test with non-standard aspect ratio
      debouncedAspectResize({ width: 1600, height: 1000 })
      jest.advanceTimersByTime(100)
      
      // Should adjust height to maintain 16:9
      expect(resizeCallback).toHaveBeenCalledWith({ 
        width: 1600, 
        height: 900 
      })
    })

    it('should handle minimum canvas size constraints', () => {
      const MIN_WIDTH = 320
      const MIN_HEIGHT = 240

      const constrainedResize = (size: { width: number; height: number }) => {
        const constrained = {
          width: Math.max(size.width, MIN_WIDTH),
          height: Math.max(size.height, MIN_HEIGHT)
        }
        resizeCallback(constrained)
      }

      const debouncedConstrainedResize = debounce(constrainedResize, 100)

      // Test below minimum
      debouncedConstrainedResize({ width: 200, height: 150 })
      jest.advanceTimersByTime(100)
      expect(resizeCallback).toHaveBeenCalledWith({ width: 320, height: 240 })

      // Test above minimum
      debouncedConstrainedResize({ width: 800, height: 600 })
      jest.advanceTimersByTime(100)
      expect(resizeCallback).toHaveBeenCalledWith({ width: 800, height: 600 })
    })

    it('should handle maximum canvas size constraints', () => {
      const MAX_WIDTH = 4096
      const MAX_HEIGHT = 4096

      const constrainedResize = (size: { width: number; height: number }) => {
        const constrained = {
          width: Math.min(size.width, MAX_WIDTH),
          height: Math.min(size.height, MAX_HEIGHT)
        }
        resizeCallback(constrained)
      }

      const debouncedConstrainedResize = debounce(constrainedResize, 100)

      // Test above maximum
      debouncedConstrainedResize({ width: 5000, height: 5000 })
      jest.advanceTimersByTime(100)
      expect(resizeCallback).toHaveBeenCalledWith({ width: 4096, height: 4096 })
    })
  })
})