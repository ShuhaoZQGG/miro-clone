# Cycle 25: UI/UX Design Specifications

## Design Focus
Enhance developer experience with integrated performance monitoring and improved test visibility while maintaining existing full-screen canvas functionality.

## User Journeys

### 1. Developer Testing Workflow
**Goal**: Quickly identify and fix test failures
- Developer runs test suite → Visual test dashboard shows real-time progress
- Failed tests highlighted with clear error messages and stack traces
- One-click navigation to failing test file
- RAF timing issues clearly indicated with suggested fixes

### 2. Performance Monitoring Flow
**Goal**: Monitor canvas performance during development
- Developer enables performance overlay (keyboard shortcut: Ctrl+Shift+P)
- FPS counter displays in top-right corner (semi-transparent, draggable)
- Memory usage bar chart updates every second
- Performance degradation triggers visual warning (red tint when <30fps)

### 3. Canvas Interaction Debugging
**Goal**: Debug element interactions and data properties
- Developer hovers over canvas element → Tooltip shows element properties
- Debug panel (toggle: Ctrl+Shift+D) displays:
  - Active element details
  - Event stream
  - Canvas state tree
  - Element data properties

## Component Mockups

### Performance Overlay
```
┌─────────────────────────────────┐
│ FPS: 60 ▂▄▆█████████            │
│ MEM: 124MB ████████░░           │
│ OBJ: 245 elements               │
│ RAF: 16.67ms                    │
└─────────────────────────────────┘
Position: Fixed top-right
Background: rgba(0,0,0,0.7)
Text: #00ff00 (green) normal, #ff0000 (red) warnings
```

### Test Status Dashboard
```
┌─────────────────────────────────────────┐
│ Test Runner           [Stop] [Clear]    │
├─────────────────────────────────────────┤
│ ✓ 247 Passed  ✗ 59 Failed  ⚡ 0 Running │
├─────────────────────────────────────────┤
│ ✗ canvas-fullscreen.test.tsx:45        │
│   Expected fullscreen, got windowed     │
│ ✗ smooth-interactions.test.tsx:112     │
│   RAF timing mismatch (expected 16ms)  │
│ ✗ FPSCounter.test.tsx:23              │
│   Mock not properly initialized        │
└─────────────────────────────────────────┘
Background: Dark theme (#1a1a1a)
Expandable/Collapsible sections
```

### Element Inspector Panel
```
┌──────────────────────────┐
│ Element Inspector    [X] │
├──────────────────────────┤
│ Type: Rectangle         │
│ ID: elem-uuid-12345     │
│ Position: (100, 200)    │
│ Size: 200x150           │
│ Data: {                 │
│   color: "#ff6b6b"     │
│   layer: 2              │
│   locked: false        │
│ }                       │
├──────────────────────────┤
│ Events (last 5):        │
│ • mousedown 12:34:56    │
│ • drag 12:34:57         │
│ • dragend 12:34:58      │
└──────────────────────────┘
Position: Docked left
Width: 280px
Resizable
```

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

## Accessibility Specifications

### Keyboard Navigation
- Tab: Navigate between UI elements
- Ctrl+Shift+P: Toggle performance overlay
- Ctrl+Shift+D: Toggle debug panel
- Ctrl+Shift+T: Focus test dashboard
- Escape: Close active panel

### Screen Reader Support
- ARIA labels for all controls
- Performance metrics announced on significant changes
- Test failures announced immediately
- Role="alert" for critical warnings

### Visual Accessibility
- High contrast mode support
- Minimum 4.5:1 contrast ratio
- Color-blind friendly status indicators:
  - Success: ✓ checkmark + green
  - Error: ✗ X mark + red
  - Warning: ⚠ triangle + yellow
- Adjustable overlay opacity (40-90%)

## Responsive Design

### Desktop (>1200px)
- Full canvas with all panels visible
- Performance overlay in corner
- Debug panels docked to sides

### Tablet (768-1200px)
- Canvas maintains full viewport
- Panels collapse to icons
- Tap to expand panels temporarily

### Mobile (Testing Only, <768px)
- Read-only canvas view
- Performance metrics in header bar
- Swipe gestures for panel access

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

## Error States

### Build Errors
- Full-screen red overlay with error details
- Stack trace with syntax highlighting
- Quick fix suggestions when available
- Link to relevant documentation

### Test Failures
- Inline error display in test list
- Diff view for assertion failures
- Timing diagram for RAF issues
- Copy error to clipboard button

### Performance Warnings
- Yellow border when FPS < 45
- Red border when FPS < 30
- Memory leak detection alert
- Suggested optimizations panel

## Developer Tools Integration

### Browser DevTools
- Custom formatters for canvas elements
- Performance marks for key operations
- Console groups for debug output
- Network timing for asset loading

### VS Code Integration
- Click to open file at line
- Inline test status indicators
- Performance hints in editor
- Quick fix code actions

## Implementation Priority

1. **Critical**: Fix TypeScript build error display
2. **High**: Test dashboard with real-time updates
3. **High**: Basic performance overlay (FPS only)
4. **Medium**: Element inspector panel
5. **Medium**: Enhanced performance metrics
6. **Low**: VS Code integration features

## Success Metrics
- Build errors identified within 100ms
- Test results updated in real-time
- Performance overlay < 1% CPU usage
- All panels keyboard accessible
- Zero visual glitches at 60fps