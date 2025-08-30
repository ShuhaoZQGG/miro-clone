# UI/UX Design Specifications - Cycle 34

## Design System

### Color Palette
- **Primary**: #4F46E5 (Indigo-600)
- **Secondary**: #10B981 (Emerald-500)
- **Background**: #F9FAFB (Gray-50)
- **Canvas**: #FFFFFF
- **Borders**: #E5E7EB (Gray-200)
- **Text Primary**: #111827 (Gray-900)
- **Text Secondary**: #6B7280 (Gray-500)
- **Success**: #10B981 (Green-500)
- **Warning**: #F59E0B (Amber-500)
- **Error**: #EF4444 (Red-500)

### Typography
- **Font Family**: Inter, system-ui, sans-serif
- **Headings**: 24px/32px/40px (h3/h2/h1)
- **Body**: 14px/16px
- **Small**: 12px
- **Monospace**: JetBrains Mono for code/metrics

## User Journeys

### 1. First-Time User Flow
```
Landing → Auto-create board → Tutorial overlay → Start creating
         ↓
     Sign up prompt (optional) → Save to cloud
```

### 2. Collaboration Flow
```
Share board → Copy link → Others join → See cursors/presence
           ↓
    Permission controls → Edit/View modes
```

### 3. Creation Flow
```
Select tool → Click/drag on canvas → Modify properties → Save changes
          ↓
     Real-time sync → Other users see updates
```

## Component Specifications

### Navigation Bar (64px height)
- **Logo**: Left-aligned, 32px height
- **Board Title**: Center, editable inline
- **User Avatars**: Right section, stacked with +N indicator
- **Share Button**: Primary CTA, right-aligned
- **Status Indicator**: Connection/sync status

### Toolbar (Left Panel - 72px width)
- **Tools Grid**: 2x4 layout
  - Select/Move
  - Rectangle
  - Circle
  - Line
  - Text
  - Sticky Note
  - Pen/Draw
  - Eraser
- **Active Tool**: Highlighted with primary color
- **Tooltips**: On hover with shortcuts

### Properties Panel (Right - 320px width, collapsible)
- **Context-sensitive**: Shows options for selected element
- **Sections**:
  - Transform (position, size, rotation)
  - Style (fill, stroke, opacity)
  - Text formatting (when text selected)
  - Layer controls (z-index)

### Canvas Area
- **Infinite Canvas**: Pan with spacebar+drag
- **Grid**: Optional, 20px spacing
- **Zoom Controls**: Bottom-right corner
  - Zoom in/out buttons
  - Zoom percentage
  - Fit to screen
  - Reset view

### Collaboration Features

#### User Presence
- **Cursor**: Colored cursor with user name label
- **Selection**: Colored outline when user selects element
- **Avatar Pills**: Top-right, max 5 visible + overflow
- **Following Mode**: Click avatar to follow user's viewport

#### Real-time Indicators
- **Typing Indicator**: "User is typing..." below text elements
- **Drawing Path**: Live preview of pen strokes
- **Moving Elements**: Ghost preview during drag

### Responsive Design

#### Desktop (>1280px)
- Full layout with all panels visible
- Optimal for creation and collaboration

#### Tablet (768px - 1280px)
- Collapsible side panels
- Touch-optimized controls
- Larger hit targets (44px minimum)

#### Mobile (< 768px)
- View-only mode by default
- Bottom sheet for properties
- Simplified toolbar
- Gesture controls (pinch zoom, two-finger pan)

## Accessibility

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: Full keyboard support
  - Tab through UI elements
  - Arrow keys for canvas navigation
  - Shortcuts for all tools
- **Screen Reader**: ARIA labels and live regions
- **Focus Indicators**: Visible focus rings (2px, high contrast)
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text

### Keyboard Shortcuts
- **Space**: Pan mode
- **V**: Select tool
- **R**: Rectangle
- **O**: Circle
- **T**: Text
- **N**: Sticky note
- **Cmd/Ctrl+Z**: Undo
- **Cmd/Ctrl+Shift+Z**: Redo
- **Cmd/Ctrl+C/V**: Copy/Paste
- **Delete**: Delete selected

## Interaction Patterns

### Canvas Interactions
- **Click**: Select element
- **Double-click**: Edit text inline
- **Drag**: Move element
- **Shift+Drag**: Constrain proportions/angles
- **Alt+Drag**: Duplicate element
- **Cmd/Ctrl+Click**: Multi-select

### Touch Gestures
- **Tap**: Select
- **Double-tap**: Zoom in
- **Pinch**: Zoom
- **Two-finger drag**: Pan
- **Long press**: Context menu

## Animation & Transitions

### Micro-interactions
- **Hover States**: 150ms ease-out
- **Tool Selection**: Scale 1.05 with spring
- **Panel Collapse**: 200ms slide
- **Element Creation**: Fade in 150ms
- **Deletion**: Scale down + fade 200ms

### Performance Targets
- **Initial Load**: < 3s
- **Tool Switch**: < 50ms
- **Canvas Pan/Zoom**: 60fps
- **Sync Delay**: < 100ms
- **Auto-save**: Every 5s or on idle

## Error States

### Connection Lost
- Toast notification with retry button
- Offline mode indicator
- Queue local changes

### Sync Conflicts
- Highlight conflicted elements
- Show resolution options
- Maintain version history

### Permission Denied
- Disabled tools with tooltip explanation
- Request access button
- View-only mode indicators

## Empty States

### New Board
- Welcome message
- Quick tutorial option
- Template suggestions
- Sample elements to try

### No Collaborators
- "Invite others" CTA
- Share link prominently displayed
- Benefits of collaboration listed

## Loading States

### Board Loading
- Skeleton screen matching layout
- Progressive loading (UI → Canvas → Elements)
- Loading percentage indicator

### Asset Loading
- Placeholder rectangles
- Progressive image loading
- Lazy loading for off-screen elements

## Mobile-First Considerations

### Progressive Enhancement
1. Core view/pan functionality
2. Basic shape creation
3. Advanced editing features
4. Real-time collaboration

### Performance Budget
- **Bundle Size**: < 200KB initial
- **Time to Interactive**: < 5s on 3G
- **Frame Rate**: Maintain 30fps minimum
- **Memory**: < 100MB for typical board