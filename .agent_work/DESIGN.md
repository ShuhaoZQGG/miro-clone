# UI/UX Design Specifications - Cycle 30

## Design System

### Color Palette
- **Primary**: #4F46E5 (Indigo-600)
- **Secondary**: #10B981 (Emerald-500)
- **Background**: #FFFFFF / #1F2937 (dark mode)
- **Surface**: #F9FAFB / #374151 (dark mode)
- **User Cursors**: Dynamic HSL based on user ID

### Typography
- **Font**: Inter, system-ui fallback
- **Headings**: 700 weight
- **Body**: 400 weight
- **Code**: JetBrains Mono

## User Journeys

### 1. First-Time User Flow
```
Landing → Sign Up → Email Verify → Workspace Create → Board Create → Tutorial
```

### 2. Collaboration Flow
```
Board Open → Share Link → User Joins → Real-time Edit → Conflict Resolution → Save
```

### 3. Offline Recovery Flow
```
Connection Lost → Local Queue → Reconnect → Sync Changes → Merge Conflicts → Resume
```

## Component Specifications

### Authentication Modal
- **Dimensions**: 480px × 600px
- **Fields**: Email, Password, Remember Me
- **Actions**: Sign In, Sign Up, OAuth (Google/GitHub)
- **States**: Loading, Error, Success

### Collaboration Toolbar
- **Position**: Top-right, fixed
- **Components**:
  - User avatars (max 5, +N overflow)
  - Share button with copy link
  - Connection status indicator
  - Active users count

### User Presence Indicators

#### Cursor Design
```css
.cursor {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid userColor;
  opacity: 0.8;
  transition: transform 100ms cubic-bezier(0.4, 0, 0.2, 1);
}

.cursor-label {
  background: userColor;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
```

#### Selection Box
- **Border**: 2px dashed, user color
- **Background**: user color at 10% opacity
- **Corner handles**: 8px squares

### Real-time Status Bar
- **Position**: Bottom-left
- **Width**: 280px
- **Components**:
  - Connection status (🟢 Connected / 🟡 Syncing / 🔴 Offline)
  - Last sync timestamp
  - Pending operations count
  - Retry button (when disconnected)

### Conflict Resolution Dialog
- **Trigger**: Auto-show on conflict
- **Layout**: Split view comparison
- **Actions**: Keep Mine, Keep Theirs, Merge Both
- **Preview**: Live preview of each option

## Responsive Breakpoints

### Desktop (≥1280px)
- Full toolbar with labels
- Multi-column property panels
- Floating minimap

### Tablet (768px - 1279px)
- Collapsed toolbar (icons only)
- Single column panels
- Hidden minimap

### Mobile (< 768px)
- Bottom navigation bar
- Touch-optimized controls
- Gesture-based interactions
- Read-only mode by default

## Accessibility Specifications

### WCAG 2.1 AA Compliance
- **Color Contrast**: 4.5:1 minimum
- **Focus Indicators**: 2px outline, offset 2px
- **Keyboard Navigation**: Tab order, arrow keys for canvas
- **Screen Reader**: ARIA labels on all interactive elements

### Keyboard Shortcuts
- `Ctrl/Cmd + S`: Save
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Y`: Redo
- `Space`: Pan mode
- `V`: Select tool
- `T`: Text tool
- `R`: Rectangle tool

## Animation Specifications

### Cursor Movement
- **Duration**: 100ms
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1)
- **Interpolation**: Linear for < 200px, ease for larger moves

### Element Transitions
- **Create**: fadeIn 200ms
- **Update**: transform 150ms
- **Delete**: fadeOut 150ms
- **Batch**: stagger 50ms between items

### Connection States
- **Connecting**: pulse animation 1s
- **Connected**: fadeIn 300ms
- **Disconnected**: shake 300ms
- **Reconnecting**: rotate spinner 1s linear

## Performance Targets

### Metrics
- **FCP**: < 1.5s
- **TTI**: < 3.5s
- **CLS**: < 0.1
- **FPS**: 60fps during interactions

### Optimization Strategies
- Virtual scrolling for large boards
- Canvas element pooling
- Debounced sync (100ms)
- Viewport culling
- Progressive image loading

## Dark Mode Specifications

### Surface Colors
- **Background**: #111827
- **Card**: #1F2937
- **Border**: #374151
- **Text Primary**: #F9FAFB
- **Text Secondary**: #9CA3AF

### Component Adjustments
- Reduced contrast for eye comfort
- Inverted shadows
- Muted accent colors
- Preserved user cursor brightness

## Error States

### Connection Errors
- Toast notification with retry action
- Status bar indication
- Queue visualization

### Sync Conflicts
- Modal dialog with diff view
- Color-coded changes
- Resolution options

### Permission Errors
- Inline error messages
- Disabled state indicators
- Fallback to read-only mode