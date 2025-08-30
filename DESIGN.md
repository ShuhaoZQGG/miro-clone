# Cycle 8: UI/UX Design Specifications

## Executive Summary
Design specifications for critical fixes, production readiness, and performance optimizations. Focus on completing PDF export UI, responsive mobile toolbar, and production-grade error handling.

## User Journeys

### 1. PDF Export Journey
**Start:** User clicks Export button
**Process:**
1. Export modal opens with format selection
2. User selects PDF format
3. Quality/size options appear (A4/A3/Custom)
4. User clicks Export
5. Progress indicator shows (0-100%)
6. Success notification with download
**End:** PDF downloaded to device

### 2. Mobile Toolbar Journey (Portrait)
**Start:** User opens board on mobile device
**Process:**
1. Floating action button appears (bottom-right)
2. User taps FAB to expand toolbar
3. Circular menu opens with tool options
4. User selects tool
5. Toolbar collapses, tool active
**End:** User can use selected tool

### 3. Performance Settings Journey
**Start:** User experiences lag with many elements
**Process:**
1. Performance warning appears
2. User clicks "Optimize Performance"
3. Quality settings modal opens
4. User adjusts render quality slider
5. Board refreshes with new settings
**End:** Improved performance

### 4. Build Fix Journey
**Goal:** Developer fixes missing dependency
**Process:**
1. Run npm install @types/express
2. Verify TypeScript compilation
3. Run production build
4. Update package.json
**End:** Build succeeds

## Component Specifications

### FloatingActionButton Component
```
Position: fixed, bottom: 24px, right: 24px
Size: 56x56px (Material Design spec)
States:
- Default: Blue (#3B82F6), shadow-lg
- Hover: Scale(1.05), shadow-xl
- Active: Scale(0.95)
- Expanded: Rotate(45deg) transforms to X

Mobile Breakpoint: <768px width
Animation: Framer Motion spring transition
Z-index: 9999 (above all content)
```

### ProgressIndicator Component
```
Type: Linear progress bar with percentage
Position: Bottom of export modal
Height: 4px track, 8px on hover
Colors:
- Track: Gray-200 (#E5E7EB)
- Fill: Blue-500 (#3B82F6)
- Error: Red-500 (#EF4444)

Text: "Exporting... 45%" centered above bar
Cancel button: Right-aligned, text-red-600
Animation: Smooth fill transition
```

### MobileToolbar (Responsive)
```
Portrait Mode (<768px width):
- Hidden by default
- Triggered by FAB tap
- Circular radial menu
- 8 tool slots max
- 44x44px touch targets

Landscape Mode (≥768px width):
- Horizontal bar, bottom position
- Auto-hide after 3s inactivity
- Swipe up to show
- Full tool set visible
```

### PDFExportModal Component
```
Size: 480x360px desktop, fullscreen mobile
Sections:
1. Format Selection (Radio group)
   - PNG, JPG, SVG, PDF
2. PDF Options (when selected):
   - Page Size: A4/A3/Letter/Custom
   - Orientation: Portrait/Landscape
   - Quality: 72/150/300 DPI
   - Include Grid: Toggle
3. Progress Section:
   - ProgressIndicator component
   - Estimated time remaining
   - Cancel button
```

## Responsive Breakpoints

### Mobile Portrait
```
Width: 320px - 767px
Layout:
- Single column
- FAB for tools
- Fullscreen modals
- Vertical property panels
Touch: 44x44px minimum targets
```

### Mobile Landscape
```
Width: 568px - 1023px (height <600px)
Layout:
- Canvas full width
- Auto-hide toolbar
- Compact property panels
- Side drawer navigation
```

### Tablet
```
Width: 768px - 1279px
Layout:
- 2-column grid
- Persistent toolbar
- Floating panels
- Multi-select enabled
```

### Desktop
```
Width: 1280px+
Layout:
- Full feature set
- Multiple panels open
- Keyboard shortcuts active
- Advanced tools visible
```

## Error States

### Connection Errors
```
Component: Toast notification (top-center)
Types:
1. "Connection lost. Retrying..." (yellow)
2. "Reconnected" (green, auto-dismiss 3s)
3. "Unable to connect" (red, retry button)

Icons: WiFiOff, WifiIcon, AlertCircle
Animation: Slide down entry, fade exit
```

### Export Errors
```
Component: Modal alert overlay
Messages:
- "Export failed: Board too large"
- "Export timeout: Try smaller selection"
- "Server error: Please try again"

Actions:
- Retry button (primary)
- Cancel button (secondary)
- Help link (text)
```

### Rate Limit Errors
```
Component: Banner (top of canvas)
Message: "Too many requests. Please wait {seconds}s"
Color: Orange background, dark text
Countdown: Live timer update
Auto-dismiss: When limit expires
```

## Performance UI

### Level of Detail Indicators
```
Canvas Overlay (top-right):
- Element count: "523 objects"
- Render mode: "Quality/Performance/Auto"
- FPS counter: "60 fps" (green/yellow/red)
- Settings gear icon

Quality Modes:
1. High: Full detail, all effects
2. Medium: Reduced shadows, simplified paths
3. Low: Basic shapes, no effects
```

```
Skeleton Screens:
- Toolbar: Gray rectangles for buttons
- Canvas: Checkerboard pattern
- Panels: Shimmer animation

Progressive Loading:
1. Critical UI (100ms)
2. Canvas frame (300ms)
3. Elements by viewport (500ms)
4. Off-screen elements (lazy)
```

## Accessibility Specifications

### Keyboard Navigation
```
Tab Order:
1. Main toolbar
2. Canvas (arrow keys navigate)
3. Property panels
4. Floating elements

Focus Indicators:
- 2px blue outline
- 4px offset
- High contrast mode support
```

### Screen Reader Support
```
ARIA Labels:
- role="application" on canvas
- aria-live="polite" for updates
- aria-label on all buttons
- aria-describedby for complex tools

Announcements:
- "Element selected: Rectangle"
- "Zoom level: 150%"
- "5 users connected"
```

## Color System

### Status Colors
```
Success: #10B981 (green-500)
Warning: #F59E0B (amber-500)
Error: #EF4444 (red-500)
Info: #3B82F6 (blue-500)
```

### UI Colors
```
Background: #FFFFFF (white)
Surface: #F9FAFB (gray-50)
Border: #E5E7EB (gray-200)
Text Primary: #111827 (gray-900)
Text Secondary: #6B7280 (gray-500)
```

### Dark Mode (Future)
```
Background: #111827 (gray-900)
Surface: #1F2937 (gray-800)
Border: #374151 (gray-700)
Text Primary: #F9FAFB (gray-50)
Text Secondary: #9CA3AF (gray-400)
```

## Animation Specifications

### Transitions
```
Default: 200ms ease-out
Modals: 300ms spring(1, 100, 10)
FAB: 400ms spring(1, 80, 13)
Progress: 150ms linear
```

### Micro-interactions
```
Button Hover: scale(1.02)
Button Press: scale(0.98)
Toggle: translateX(20px)
Collapse: height transition
```

## Security UI

### Input Validation
```
Visual Feedback:
- Red border on invalid input
- Error message below field
- Sanitized preview for URLs
- Character count limits

Rate Limit UI:
- Countdown timer
- Disabled state for buttons
- Queue position indicator
```

### Authentication UI
```
Login State Indicators:
- Avatar in toolbar
- "Connecting..." status
- Session timeout warning (5min)
- Re-auth modal on expire
```

## Production Monitoring

### Health Status Dashboard
```
Admin Panel (/admin/health):
- WebSocket connections: counter
- Active boards: list with users
- Memory usage: graph
- Error rate: timeline
- Export queue: pending/completed
```

## Mobile Gesture Specifications

### Touch Gestures
```
Pan: 1-finger drag (20px threshold)
Zoom: 2-finger pinch (scale 0.5-3x)
Rotate: 2-finger twist (disabled by default)
Select: Tap (300ms timeout)
Multi-select: Long press (500ms)
Context Menu: 2-finger tap
```

### Gesture Priorities
```
1. System gestures (edge swipes)
2. Canvas pan/zoom
3. Element manipulation
4. Tool activation
5. UI interaction
```

## Success Metrics Visualization

### Performance Metrics
```
Dashboard Widgets:
- FPS Graph: Real-time line chart
- Load Time: Bar chart by feature
- Memory Usage: Area chart
```

## Deployment UI

### Environment Indicators
```
Dev: Orange banner "Development"
Staging: Yellow banner "Staging"
Production: No banner (clean)

Version Tag: Bottom-left corner
- "v1.0.0-cycle8"
- Git commit hash on hover
- Click for changelog
```

---
**Design Confidence:** 95%
**Accessibility:** WCAG 2.1 AA
**Performance Target:** 60fps with 500 elements
**Mobile First:** Progressive enhancement