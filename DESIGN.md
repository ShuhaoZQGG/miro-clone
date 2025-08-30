# Cycle 23: UI/UX Design Specifications

## Design Overview
Performance monitoring dashboard and test infrastructure improvements for a collaborative whiteboard application with full-screen canvas support.

## User Journeys

### Journey 1: Canvas Full-Screen Experience
1. User loads board → Canvas instantly fills entire viewport (0 gaps)
2. Window resizes → Canvas adapts smoothly maintaining aspect ratio
3. User interacts → Smooth 60fps drag, create, and resize operations
4. Performance monitored → Real-time FPS counter shows performance

### Journey 2: Performance Monitoring
1. User opens board → FPS counter appears in corner
2. System tracks performance → Real-time FPS updates every 250ms
3. User sees performance issues → Visual indicators change color
4. User opens metrics dashboard → Detailed performance data displayed

### Journey 3: Smooth Interactions
1. User creates element → Ghost preview follows cursor smoothly
2. User drags element → Momentum physics provide natural feel
3. User resizes element → Real-time preview at 60fps
4. User releases → Element animates to final position

## Layout Specifications

### Canvas Container (Full-Screen)
```
Position: fixed
Inset: 0 (top: 0, right: 0, bottom: 0, left: 0)
Width: 100vw
Height: 100vh
Z-index: 0 (base layer)
Background: #F7F7F9 (light mode) / #1A1A1A (dark mode)
Overflow: hidden
```

### FPS Counter Component
```
Position: fixed
Top: 16px
Right: 16px
Width: auto (min 80px)
Height: 32px
Background: rgba(0,0,0,0.7)
Color: #FFFFFF
Font: 12px monospace
Border-radius: 4px
Padding: 4px 8px
Z-index: 1000
Display: flex
Align-items: center
Gap: 8px
```

**Visual States:**
- Good (>= 50 FPS): Green indicator (#4CAF50)
- Medium (30-49 FPS): Yellow indicator (#FFC107)
- Poor (< 30 FPS): Red indicator (#F44336)

### Performance Metrics Dashboard
```
Position: fixed
Bottom: 16px
Right: 16px
Width: 280px
Max-height: 400px
Background: rgba(255,255,255,0.95)
Border: 1px solid #E0E0E0
Border-radius: 8px
Shadow: 0 2px 8px rgba(0,0,0,0.1)
Z-index: 999
Padding: 12px
```

**Sections:**
1. **Header**
   - Title: "Performance Metrics"
   - Collapse/Expand toggle button
   - Background: transparent
   - Height: 32px
   - Cursor: pointer

2. **FPS Section**
   - Current FPS: Large display (14px)
   - Average FPS: 10-sample window
   - Min/Max values: Secondary text (10px)
   - Visual graph: Optional spark line

3. **Memory Section**
   - Heap used / total in MB
   - Memory limit display
   - Usage percentage with progress bar
   - Color coding for memory pressure

4. **Render Section**
   - Total element count
   - Average render time (ms)
   - Frame drops counter
   - Last update timestamp

## Interaction Design

### Canvas Full-Screen Behavior
- **Initialization**: Canvas fills viewport on mount
- **Resize Handling**: Debounced at 100ms for efficiency
- **Aspect Ratio**: Maintains canvas proportions
- **GPU Acceleration**: transform: translateZ(0)
- **Double Buffering**: Prevents flicker during updates

### Smooth Rendering Specifications
- **Frame Rate**: Consistent 60fps (16.67ms frame budget)
- **Input Latency**: < 10ms response to user actions
- **Animation Curves**: cubic-bezier(0.4, 0, 0.2, 1) for natural motion
- **RAF Loop**: Continuous animation frame updates
- **Momentum Physics**: Velocity-based drag continuation

### Performance Monitoring
- **Update Frequency**: 250ms (4Hz) for UI updates
- **Sample Window**: 10 frames for rolling average
- **Alert Threshold**: < 30 FPS for 3+ consecutive seconds
- **Visual Feedback**: Immediate color change on performance shift
- **Data Collection**: Continuous in background

### Dashboard Interactions
1. **Toggle Visibility**
   - Click header to collapse/expand
   - State persists in component state
   - Smooth slide animation (300ms)
   - Maintains performance tracking when collapsed

2. **Performance Alerts**
   - Flash warning when FPS < 30
   - Red border on critical performance
   - Console warnings in dev mode
   - Optional sound alert

## Technical Specifications

### Canvas Engine Optimizations
```javascript
// Full-screen canvas setup
canvas.setDimensions({
  width: window.innerWidth,
  height: window.innerHeight
})

// RAF-based render loop
let rafId = null
function renderLoop() {
  updatePhysics()
  renderCanvas()
  rafId = requestAnimationFrame(renderLoop)
}

// Smooth interactions
const MOMENTUM_DECAY = 0.95
const MIN_VELOCITY = 0.5
```

### Performance Tracking
```javascript
// FPS Calculation
frameCount++
const deltaTime = currentTime - lastTime
if (deltaTime >= updateInterval) {
  const fps = Math.round((frameCount * 1000) / deltaTime)
  updateFPSDisplay(fps)
  frameCount = 0
  lastTime = currentTime
}

// Memory Tracking (if available)
if (performance.memory) {
  const used = performance.memory.usedJSHeapSize
  const total = performance.memory.jsHeapSizeLimit
  const percentage = (used / total) * 100
}
```

### Test Infrastructure
```javascript
// RAF Mock for Testing
const rafMock = {
  callbacks: [],
  time: 0,
  requestAnimationFrame(cb) {
    const id = this.callbacks.length
    this.callbacks.push(cb)
    return id
  },
  flush(frames = 1) {
    for (let i = 0; i < frames; i++) {
      this.time += 16.67
      const cbs = [...this.callbacks]
      this.callbacks = []
      cbs.forEach(cb => cb(this.time))
    }
  }
}
```

## Visual Design

### Color Palette
```css
--canvas-bg: #F7F7F9
--canvas-grid: rgba(0,0,0,0.03)
--fps-good: #4CAF50
--fps-medium: #FFC107
--fps-poor: #F44336
--dashboard-bg: rgba(255,255,255,0.95)
--dashboard-border: #E0E0E0
--text-primary: #212121
--text-secondary: #757575
--accent-primary: #0066FF
```

### Typography
```css
--font-mono: 'Monaco', 'Courier New', monospace
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
--size-small: 10px
--size-normal: 12px
--size-large: 14px
--weight-normal: 400
--weight-bold: 600
```

### Spacing & Animations
```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--duration-fast: 150ms
--duration-normal: 300ms
--easing-default: cubic-bezier(0.4, 0, 0.2, 1)
--easing-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

## Accessibility

### Keyboard Support
- Tab: Navigate between UI elements
- Arrow keys: Pan canvas (when focused)
- Escape: Close/collapse dashboard
- Space: Toggle dashboard state
- Cmd/Ctrl + Scroll: Zoom in/out

### Screen Reader Support
- ARIA labels for all metrics
- Live regions for FPS updates (throttled)
- Role descriptions for interactive elements
- Status announcements for performance alerts

### Visual Accessibility
- High contrast text (WCAG AAA on dark backgrounds)
- Minimum touch target: 44x44px
- Clear focus indicators (3px outline)
- Color-blind safe palette (red/green alternatives)
- Text-based indicators alongside colors

## Responsive Design

### Desktop (> 1024px)
- Full dashboard with all metrics visible
- FPS counter in top-right corner
- Detailed performance graphs
- Multi-column layout for metrics

### Tablet (768px - 1024px)
- Compact dashboard layout
- Essential metrics only (FPS, memory)
- Single column layout
- Smaller font sizes

### Mobile (< 768px)
- FPS counter only (no dashboard)
- Simplified touch interactions
- Performance logging to console only
- Optimized for touch gestures

## Performance Optimizations

### Rendering Pipeline
1. **Viewport Culling**: Only render visible elements
2. **Layer Caching**: Static elements on separate layers
3. **Batch Updates**: Group DOM operations per frame
4. **Dirty Rectangle**: Only redraw changed regions
5. **Object Pooling**: Reuse element instances

### Memory Management
- Element pooling for frequently created items
- Lazy loading for off-screen content
- Automatic cleanup of disposed elements
- Maximum 100MB heap usage target
- Garbage collection triggers at 80% threshold

## Success Metrics

### Performance Targets
- Canvas fills 100% viewport with no gaps ✓
- Consistent 60fps during all interactions
- < 10ms input response time
- < 100ms resize adaptation
- Zero visual glitches or tearing

### Quality Metrics
- 100% test pass rate (target)
- Zero TypeScript errors ✓
- Zero ESLint errors ✓
- < 5 ESLint warnings
- Performance dashboard renders < 16ms

### User Experience
- Smooth element creation and manipulation
- Responsive to all user inputs
- Clear performance feedback
- No unexpected behaviors
- Professional, polished interface