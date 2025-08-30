# UI/UX Design Specifications - Cycle 16

## Executive Summary
Design focused on resolving canvas refresh loops and improving stability while maintaining intuitive collaborative whiteboard experience.

## User Journey Maps

### 1. Board Entry Flow
```
Landing → Board Selection → Loading State → Canvas Initialization → Ready State
         ↓                  ↓               ↓                      ↓
    [Board List]     [Spinner+Message] [Canvas Mount]      [Interactive Canvas]
```

### 2. Canvas Interaction Flow
```
Tool Selection → Canvas Action → Visual Feedback → State Update → Collaboration Sync
      ↓              ↓                ↓                ↓              ↓
  [Toolbar]    [Mouse/Touch]    [Cursor Change]  [Canvas Update] [User Presence]
```

### 3. Error Recovery Flow
```
Canvas Error → Graceful Degradation → Recovery Action → Re-initialization
     ↓               ↓                      ↓                ↓
[DOM Error]   [Preserve State]      [Cleanup+Retry]   [Canvas Ready]
```

## Responsive Design Mockups

### Desktop Layout (1920x1080)
```
┌─────────────────────────────────────────────────────────────┐
│ Toolbar (60px)                                     [Export]  │
├──────┬──────────────────────────────────────────┬───────────┤
│      │                                          │           │
│ Tool │         Canvas Area                      │ Collab    │
│Panel │         (Infinite Scroll)                │ Panel     │
│(80px)│                                          │ (320px)   │
│      │         [Canvas Content]                 │           │
│      │                                          │ [Users]   │
│      │                                          │           │
└──────┴──────────────────────────────────────────┴───────────┘
        Status Bar (40px)                          
```

### Tablet Layout (768x1024)
```
┌──────────────────────────────────────┐
│ Compact Toolbar (50px)               │
├──────────────────────────────────────┤
│                                      │
│         Canvas Area                  │
│         (Full Width)                 │
│                                      │
│    [Floating Tool Panel]             │
│    [Collapsible Collab]              │
│                                      │
└──────────────────────────────────────┘
  Bottom Navigation (60px)
```

### Mobile Layout (375x812)
```
┌─────────────────────┐
│ Mobile Header (44px)│
├─────────────────────┤
│                     │
│   Canvas Area       │
│   (Touch Optimized) │
│                     │
│ [FAB Tools]         │
│                     │
├─────────────────────┤
│ Bottom Tools (80px) │
└─────────────────────┘
```

## Component Specifications

### 1. Canvas Container
- **Purpose**: Stable canvas mounting point
- **Key Properties**:
  - Fixed dimensions relative to viewport
  - Overflow: hidden
  - Touch-action: none (prevent scroll interference)
  - Position: relative (for absolute child positioning)
- **Error Handling**: 
  - Parent node verification before DOM operations
  - Cleanup ref tracking to prevent double disposal

### 2. Toolbar
- **Height**: 60px desktop, 50px tablet, 44px mobile
- **Sections**: Tools | Zoom Controls | Actions
- **Interaction**: Click/tap with visual feedback
- **State**: Active tool highlighted

### 3. Tool Panel
- **Width**: 80px desktop, floating on tablet/mobile
- **Tools**: Select, Sticky, Rectangle, Circle, Text, Line
- **Visual**: Icons with tooltips
- **Mobile**: Floating Action Button (FAB) pattern

### 4. Collaboration Panel
- **Width**: 320px desktop, overlay on mobile
- **Features**: User presence, cursor tracking, activity feed
- **Performance**: Throttled updates (60fps max)

## Accessibility Specifications

### 1. Keyboard Navigation
- **Tab Order**: Toolbar → Tool Panel → Canvas → Collaboration
- **Shortcuts**:
  - `V` - Select tool
  - `S` - Sticky note
  - `R` - Rectangle
  - `C` - Circle
  - `T` - Text
  - `Ctrl+A` - Select all
  - `Delete` - Remove selected
  - `Ctrl+Plus/Minus` - Zoom
  - `Ctrl+0` - Reset zoom
  - `Escape` - Clear selection

### 2. Screen Reader Support
- **ARIA Labels**: All interactive elements
- **Live Regions**: Canvas state changes
- **Descriptions**: Tool functionality
- **Announcements**: User actions and errors

### 3. Visual Accessibility
- **Contrast Ratios**: WCAG AA compliant (4.5:1 text, 3:1 UI)
- **Focus Indicators**: 2px solid outline
- **Color Coding**: Never sole indicator
- **Text Size**: Minimum 14px, scalable to 200%

## Performance Targets

### 1. Canvas Rendering
- **Frame Rate**: 60fps sustained
- **Disposal Errors**: 0 (zero tolerance)
- **Memory Leaks**: None (proper cleanup)
- **Refresh Loops**: Prevented via stable refs

### 2. Loading States
- **Initial Load**: < 2 seconds
- **Tool Switch**: < 100ms
- **Canvas Update**: < 16ms (single frame)
- **Collaboration Sync**: < 200ms

## Error Prevention Design

### 1. Canvas Lifecycle Management
```typescript
// Pseudo-code for stable canvas mounting
interface CanvasMount {
  container: HTMLElement | null
  fabricInstance: fabric.Canvas | null
  isDisposed: boolean
  disposeToken: Symbol // Unique token per mount
}
```

### 2. DOM Safety Checks
- Always verify parent exists before removeChild
- Use try-catch for DOM operations
- Maintain disposal state flag
- Prevent double initialization

### 3. Viewport Metadata Fix
- Move viewport config from metadata to viewport export
- Ensure Next.js 13+ compatibility
- Proper meta tag placement

## Mobile Optimizations

### 1. Touch Interactions
- **Gestures**: Pinch zoom, pan, rotate
- **Touch Targets**: Minimum 44x44px
- **Feedback**: Haptic on supported devices
- **Prevention**: No accidental selections

### 2. Responsive Canvas
- **Scaling**: Viewport-based units
- **Orientation**: Handle rotation gracefully
- **Performance**: Reduce quality on zoom
- **Memory**: Aggressive cleanup on background

## Testing Requirements

### 1. E2E Test Coverage
- Canvas initialization without errors
- Tool selection and drawing
- Zoom controls functionality
- Export capabilities
- Error recovery scenarios

### 2. Visual Regression
- Component rendering consistency
- Layout stability across breakpoints
- Animation smoothness
- Error state appearance

## Implementation Notes

### Critical Fixes Required:
1. **Viewport Metadata**: Move from metadata export to viewport export in `/board/[boardId]`
2. **Canvas Disposal**: Implement parent node verification before removeChild operations
3. **Refresh Loop**: Add stable ref management to prevent continuous re-renders
4. **E2E Tests**: Debug and fix 2 failing tests with verbose logging

### Design Principles:
- **Stability First**: Prevent errors over feature richness
- **Progressive Enhancement**: Core functionality works everywhere
- **Graceful Degradation**: Fallbacks for all error states
- **Performance Budget**: Never exceed 16ms per frame

## Color Palette
- **Primary**: #0066FF (Interactive elements)
- **Secondary**: #6B7280 (UI chrome)
- **Success**: #10B981 (Confirmations)
- **Warning**: #F59E0B (Cautions)
- **Error**: #EF4444 (Errors)
- **Background**: #F9FAFB (Canvas)
- **Surface**: #FFFFFF (Panels)

## Typography
- **Font Family**: Inter, system-ui, sans-serif
- **Headings**: 600 weight
- **Body**: 400 weight
- **Code**: 'Fira Code', monospace
- **Sizes**: 14px base, 12px small, 16px large

## Next Steps for Development
1. Implement viewport export fix immediately
2. Add robust DOM safety checks in canvas disposal
3. Stabilize canvas mounting with proper ref management
4. Enable E2E test debugging with detailed logs
5. Monitor performance metrics post-fix
