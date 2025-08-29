# Miro Clone - UI/UX Design Specifications (Cycle 5)

## Design Overview

### Design System Foundation
- **Primary Color:** #4F46E5 (Indigo-600)
- **Secondary Color:** #10B981 (Emerald-500)
- **Error Color:** #EF4444 (Red-500)
- **Warning Color:** #F59E0B (Amber-500)
- **Typography:** Inter for UI, Mono for code elements
- **Border Radius:** 4px (small), 8px (medium), 12px (large)
- **Shadow System:** 0-5 levels for depth hierarchy

## User Journeys

### 1. Element Creation Journey
```
Start → Select Tool → Click Canvas → Configure Properties → Confirm Creation
```

**Interaction Details:**
- Tool selection provides immediate visual feedback
- Ghost preview follows cursor before placement
- Properties panel appears contextually after placement
- ESC key cancels operation at any stage

### 2. Real-time Collaboration Journey
```
Join Board → See Active Users → Observe Live Cursors → Edit Elements → See Updates
```

**Key Features:**
- User avatars in top-right corner (max 5 visible, +N indicator)
- Live cursors with user names and selection highlights
- Color-coded user activities (unique color per user)
- Optimistic updates with rollback on conflict

### 3. Export Journey
```
Select Elements → Click Export → Choose Format → Configure Options → Download
```

**Export Modal Flow:**
- Format selection (PNG/PDF/SVG) with visual previews
- Quality/resolution sliders for raster formats
- Bounds selection (All/Visible/Selection)
- Progress indicator for generation

## Component Specifications

### Toolbar (Enhanced)
```
┌─────────────────────────────────────────────┐
│ [▼][□][○][→][✎][T][🖼][↗][⤴][⤵][🗑]         │
└─────────────────────────────────────────────┘
```

**Tool Specifications:**
- **Select (V):** Default tool, multi-select with Shift
- **Rectangle (R):** Click-drag to create
- **Circle (C):** Click-drag from center with Shift for perfect circle
- **Arrow (A):** Click start point, drag to end
- **Pen (P):** Freehand drawing with pressure sensitivity
- **Text (T):** Click to place text cursor
- **Image (I):** Click to open upload dialog
- **Connector (L):** Smart connectors between elements
- **Undo (Cmd+Z):** Visual feedback on action reversal
- **Redo (Cmd+Shift+Z):** Disabled state when unavailable
- **Delete (Del):** Confirmation for multiple elements

### Properties Panel
```
┌──────────────┐
│ Properties   │
├──────────────┤
│ Fill: [████] │
│ Border: [──] │
│ Width: [200] │
│ Height: [100]│
│ Rotation: 0° │
│ Layer: ▲ ▼   │
└──────────────┘
```

**Contextual Properties:**
- Shows only relevant properties per element type
- Real-time preview of changes
- Batch editing for multiple selections
- Preset styles dropdown

### Collaboration Panel
```
┌──────────────┐
│ Active (3)   │
├──────────────┤
│ 👤 John      │
│ 👤 Sarah     │
│ 👤 Mike      │
├──────────────┤
│ 💬 Comments  │
│ 📍 Following │
└──────────────┘
```

**Features:**
- Click avatar to follow user's viewport
- Hover for last activity timestamp
- Private message capability
- Screen sharing indicator

### Element Types

#### Sticky Note (Enhanced)
```
┌─────────────┐
│ Title       │
│─────────────│
│ Content...  │
│             │
└─────────────┘
```

**Specifications:**
- Size: 200x200px default, resizable
- Colors: 8 preset colors + custom
- Text: Rich formatting (Bold/Italic/Lists)
- Tags: Bottom corner tag system
- Shadows: Subtle drop shadow for depth

#### Shape Elements
```
Rectangle:  ┌────┐
           │    │
           └────┘

Circle:     ⭕

Arrow:      ──→

Star:       ⭐
```

**Properties:**
- Fill: Solid/Gradient/Pattern options
- Border: Width (0-10px), Style (solid/dashed/dotted)
- Corner Radius: 0-50% for rectangles
- Shadows: 3 preset levels

#### Drawing Tool
```
Brush Sizes: • ○ ◉ ⬤
Opacity: [────────○] 80%
Smoothing: [──○──────] 30%
```

**Features:**
- Pressure sensitivity support
- Stroke smoothing algorithm
- Eraser mode toggle
- Color history (last 5 colors)

#### Connector Elements
```
Straight: ────────
Curved:   ╰────╯
Elbow:    ┌────┐
          └────┘
```

**Smart Features:**
- Auto-routing around elements
- Sticky endpoints to element edges
- Label support at midpoint
- Arrowhead styles (none/arrow/dot/diamond)

### Mobile Interface

#### Touch Gestures
- **Single Tap:** Select element
- **Double Tap:** Edit text/Enter element
- **Long Press:** Context menu
- **Pinch:** Zoom canvas
- **Two-finger Drag:** Pan canvas
- **Three-finger Swipe:** Undo/Redo

#### Mobile Toolbar
```
┌───┬───┬───┬───┬───┐
│ ▼ │ □ │ ○ │ ✎ │ ≡ │
└───┴───┴───┴───┴───┘
```

**Responsive Adjustments:**
- Bottom-positioned for thumb reach
- Collapsible secondary tools
- Full-screen mode toggle
- Simplified property panel

### Export Modal
```
┌────────────────────────────┐
│ Export Board               │
├────────────────────────────┤
│ Format:                    │
│ ◉ PNG  ○ PDF  ○ SVG       │
│                            │
│ Quality: [───────○] High   │
│ Scale: 2x                  │
│                            │
│ Include:                   │
│ ☑ Background               │
│ ☑ Grid                     │
│                            │
│ [Cancel] [Export]          │
└────────────────────────────┘
```

### Share Modal
```
┌────────────────────────────┐
│ Share Board                │
├────────────────────────────┤
│ Link: [.................]📋│
│                            │
│ Permissions:               │
│ ○ View only                │
│ ◉ Can comment              │
│ ○ Can edit                 │
│                            │
│ Expire after: [Never ▼]    │
│                            │
│ [Copy Link]                │
└────────────────────────────┘
```

## Responsive Design

### Breakpoints
- **Mobile:** 320px - 768px
- **Tablet:** 769px - 1024px
- **Desktop:** 1025px+

### Mobile Adaptations
- Toolbar moves to bottom
- Properties panel becomes modal
- Gestures replace hover states
- Simplified element creation

### Tablet Adaptations
- Side panels collapse to icons
- Touch-optimized element handles
- Landscape orientation optimized
- Floating action buttons

## Accessibility Specifications

### Keyboard Navigation
```
Tab         - Navigate UI elements
Arrow Keys  - Move selected elements
Space       - Pan mode toggle
Enter       - Edit selected element
Escape      - Cancel operation
Delete      - Remove selected
```

### Screen Reader Support
- ARIA labels for all tools
- Element descriptions announced
- Collaboration updates verbalized
- Focus indicators visible

### High Contrast Mode
- Increased border widths
- Enhanced color contrast (WCAG AAA)
- Pattern fills for color-blind users
- Focus rings more prominent

## WebSocket Protocol

### Message Types
```typescript
// Element Operations
{
  type: 'element:create' | 'element:update' | 'element:delete',
  elementId: string,
  data: ElementData,
  userId: string,
  timestamp: number
}

// User Presence
{
  type: 'presence:cursor' | 'presence:selection',
  userId: string,
  cursor?: { x: number, y: number },
  selection?: string[]
}

// Collaboration
{
  type: 'collab:lock' | 'collab:unlock',
  elementId: string,
  userId: string
}
```

### Conflict Resolution Strategy
1. **Optimistic Updates:** Apply changes immediately
2. **Version Vectors:** Track operation order
3. **Operational Transform:** Resolve concurrent edits
4. **Rollback Mechanism:** Revert on conflict

## Performance Optimizations

### Rendering Strategy
- **Viewport Culling:** Only render visible elements
- **LOD System:** Simplify distant elements
- **Debounced Updates:** Batch rapid changes
- **Canvas Layers:** Separate static/dynamic content

### Memory Management
- **Element Pooling:** Reuse DOM elements
- **Texture Atlas:** Combine small images
- **Lazy Loading:** Load elements on demand
- **Garbage Collection:** Clean unused references

## Visual States

### Element States
```
Default:     Normal appearance
Hover:       Subtle highlight
Selected:    Blue border + handles
Locked:      Gray overlay + lock icon
Moving:      Semi-transparent
Error:       Red border + icon
```

### Cursor States
```
default      - Arrow cursor
crosshair    - Element creation
move         - Dragging elements
grab         - Pan mode
text         - Text editing
not-allowed  - Disabled action
```

## Animation Specifications

### Micro-interactions
- **Tool Selection:** 150ms scale animation
- **Element Creation:** 200ms fade-in
- **Delete:** 300ms fade-out
- **Panel Toggle:** 250ms slide
- **Hover Effects:** 100ms transition

### Loading States
```
Skeleton:    ▭▭▭ ▭▭▭ ▭▭▭
Spinner:     ◐◓◑◒ (rotating)
Progress:    [████────] 50%
```

## Error Handling

### Error Messages
```
Connection Lost:    "Reconnecting..." (yellow banner)
Save Failed:        "Changes not saved" (red toast)
Upload Error:       "File too large" (inline error)
Permission Denied:  "View-only access" (blue info)
```

### Recovery Actions
- Auto-reconnect with exponential backoff
- Local storage for unsaved changes
- Retry mechanisms for failed operations
- Graceful degradation for features

## Implementation Guidelines

### Component Architecture
```typescript
// React component structure
interface WhiteboardProps {
  boardId: string
  userId: string
  isReadOnly?: boolean
}

// State management with Zustand
interface CanvasStore {
  elements: Map<string, CanvasElement>
  selectedIds: Set<string>
  addElement: (element: CanvasElement) => void
  updateElement: (id: string, updates: Partial<CanvasElement>) => void
  deleteElement: (id: string) => void
}

// Real-time sync
interface CollaborationStore {
  socket: Socket
  users: Map<string, UserPresence>
  sendOperation: (op: Operation) => void
  handleRemoteOperation: (op: Operation) => void
}
```

### Performance Requirements
- 60fps rendering with 500+ elements
- <100ms real-time sync latency
- <3s Time to Interactive
- <500MB memory usage for typical boards

### Testing Strategy
```javascript
// Unit tests for element operations
describe('Canvas Element Operations', () => {
  test('creates sticky note on click', async () => {
    const { user } = render(<Whiteboard />)
    await user.click(screen.getByRole('button', { name: 'Sticky Note' }))
    await user.click(canvas)
    expect(screen.getByRole('note')).toBeInTheDocument()
  })
})

// Integration tests for collaboration
describe('Real-time Collaboration', () => {
  test('syncs cursor positions', async () => {
    const { mockSocket } = renderWithSocket(<Whiteboard />)
    mockSocket.emit('cursor:move', { x: 100, y: 200 })
    expect(screen.getByTestId('remote-cursor')).toHaveStyle({
      transform: 'translate(100px, 200px)'
    })
  })
})
```

## Handoff Updates

### Completed Design Decisions
- ✅ Operational Transform for conflict resolution (simpler than CRDT)
- ✅ Touch gestures prioritize pan/zoom over selection on mobile
- ✅ PDF export server-side for consistency
- ✅ Three permission levels: View/Comment/Edit

### Design Constraints for Development
- Maximum 1000 elements per board for performance
- WebSocket message size limit: 64KB
- Image uploads: 10MB max, auto-resize to 2048px
- Undo history: Last 100 operations

### Frontend Framework Recommendations
- Continue with Next.js 15 + React 19
- Use Framer Motion for animations
- React Query for server state
- Radix UI for accessible components
- React Hook Form for input handling

### Next Phase: Development
Ready for implementation with all UI/UX specifications defined.