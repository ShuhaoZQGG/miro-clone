# Miro Clone UI/UX Design Specifications

## Executive Summary
Unified design system for consolidated Miro Clone features focusing on performance, collaboration, and security after PR consolidation.

## Design Principles
- **Performance First**: Optimize for 1000+ canvas objects
- **Real-time Collaboration**: Live cursors, presence, conflict resolution
- **Accessibility**: WCAG 2.1 AA compliance
- **Responsive**: Desktop-first with mobile adaptation
- **Security**: Role-based UI controls

## Layout Architecture

### Primary Navigation
```
┌─────────────────────────────────────────────────────┐
│ Logo | Boards | Templates | Share | User | Settings │
└─────────────────────────────────────────────────────┘
```

### Canvas Layout
```
┌──────┬────────────────────────────────┬─────────┐
│ Tools│         Canvas Area            │ Layers  │
│ Panel│   (Infinite scroll/zoom)       │ Panel   │
│      │                                │         │
│      │   [Real-time cursors]          │ Comments│
│      │   [Objects/Shapes]             │ Thread  │
│      │   [Grid overlay]               │         │
└──────┴────────────────────────────────┴─────────┘
```

## Component Specifications

### 1. Toolbar (Left Panel)
**Width**: 60px collapsed, 240px expanded
**Tools**:
- Selection (V)
- Shapes (Rectangle, Circle, Line, Arrow, Star, Hexagon, Triangle)
- Drawing (Pen with brush sizes: 1px, 3px, 5px, 8px)
- Text (T)
- Sticky Notes (N)
- Image Upload (I)
- Eraser (E)
- Templates Gallery (G)

**Visual States**:
- Default: `bg-white border-gray-200`
- Hover: `bg-gray-50`
- Active: `bg-blue-50 border-blue-500`
- Disabled: `opacity-50 cursor-not-allowed`

### 2. Canvas Area
**Features**:
- Infinite scroll with virtual viewport
- Zoom: 10% - 500% (pinch/scroll)
- Grid: Toggle 10px/20px/off
- Minimap: Bottom-right 200x150px

**Performance Indicators**:
- FPS counter (top-right when enabled)
- Object count badge
- Network latency indicator

### 3. Real-time Collaboration UI
**User Presence**:
- Avatar circles (32px) with online status
- Cursor trails with user names
- Selection boxes with user colors
- Conflict indicators (yellow outline)

**Voice/Video Controls**:
```
[🎤 Mute] [📹 Camera] [🖥️ Share] [👥 Participants]
```

### 4. Layers Panel (Right)
**Width**: 280px
**Sections**:
- Object hierarchy tree
- Layer visibility toggles
- Lock/unlock controls
- Z-index reordering (drag)

### 5. Comments Thread
**Position**: Right panel below layers
**Features**:
- Threaded discussions
- @mentions autocomplete
- Resolve/reopen buttons
- Timestamp display

## Responsive Breakpoints

### Desktop (≥1280px)
- Full layout with all panels
- Keyboard shortcuts enabled
- Multi-select with lasso

### Tablet (768px - 1279px)
- Collapsible side panels
- Touch gestures enabled
- Simplified toolbar

### Mobile (< 768px)
- Bottom toolbar
- Floating action buttons
- Gesture-based navigation
- Read-only mode default

## Color System

### Primary Palette
```css
--primary-500: #0066FF;    /* Actions */
--gray-900: #111827;        /* Text */
--gray-100: #F3F4F6;        /* Backgrounds */
--success-500: #10B981;     /* Confirmations */
--warning-500: #F59E0B;     /* Conflicts */
--error-500: #EF4444;       /* Errors */
```

### User Colors (Collaboration)
```css
--user-1: #FF6B6B;  --user-5: #4ECDC4;
--user-2: #4ECDC4;  --user-6: #45B7D1;
--user-3: #45B7D1;  --user-7: #96CEB4;
--user-4: #96CEB4;  --user-8: #FFEAA7;
```

## Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Sizes
- Heading 1: 24px/32px (700)
- Heading 2: 20px/28px (600)
- Body: 14px/20px (400)
- Small: 12px/16px (400)
- Micro: 10px/14px (500)

## Interaction Patterns

### Canvas Navigation
- **Pan**: Space + drag / Middle mouse
- **Zoom**: Ctrl/Cmd + scroll / Pinch
- **Select**: Click / Drag rectangle
- **Multi-select**: Shift + click / Lasso

### Object Manipulation
- **Move**: Drag
- **Resize**: Corner/edge handles
- **Rotate**: Rotation handle above object
- **Group**: Ctrl/Cmd + G
- **Copy**: Ctrl/Cmd + C/V

### Keyboard Shortcuts
```
V - Selection tool       Ctrl+Z - Undo
R - Rectangle           Ctrl+Y - Redo
C - Circle              Ctrl+G - Group
L - Line                Ctrl+Shift+G - Ungroup
T - Text                Ctrl+D - Duplicate
N - Sticky note         Delete - Remove
I - Image               Ctrl+A - Select all
E - Eraser              Ctrl+S - Save
G - Templates           Ctrl+E - Export
```

## Accessibility Requirements

### WCAG 2.1 AA Compliance
- Color contrast: 4.5:1 minimum
- Focus indicators: 2px solid outline
- Keyboard navigation: All interactive elements
- Screen reader: ARIA labels and live regions
- Alt text: All images and icons

### Focus Management
```css
:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

## Performance Optimization

### Rendering Strategy
- **WebGL**: Hardware acceleration for 100+ objects
- **Canvas virtualization**: Render only visible viewport
- **LOD System**: Simplified rendering at low zoom
- **Throttling**: 60 FPS cap with degradation

### Loading States
```
Initial: Skeleton screens
Async: Progressive enhancement
Error: Graceful degradation
Offline: Local-first with sync queue
```

## Security UI Elements

### Role Indicators
- **Owner**: Crown icon + "Owner" badge
- **Admin**: Shield icon + "Admin" badge
- **Editor**: Pencil icon + edit capabilities
- **Viewer**: Eye icon + read-only mode

### Permission Controls
- Share dialog with role selector
- Public/private toggle
- Link expiration settings
- 2FA prompt for sensitive actions

## Export/Share Modal
```
┌─────────────────────────────────┐
│        Export Board              │
├─────────────────────────────────┤
│ Format:                          │
│ ○ PDF  ○ PNG  ○ SVG             │
│                                  │
│ Quality: [High ▼]               │
│ Include: ☑ Grid ☑ Comments      │
│                                  │
│ [Cancel]          [Export]       │
└─────────────────────────────────┘
```

## Template Gallery
```
┌─────────────────────────────────┐
│        Choose Template           │
├─────────────────────────────────┤
│ [Search templates...]            │
│                                  │
│ Categories:                      │
│ [All] [Sprint] [Mind Map] [SWOT] │
│                                  │
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │     │ │     │ │     │        │
│ └─────┘ └─────┘ └─────┘        │
│ Sprint  Mind Map SWOT           │
│                                  │
│ [Cancel]          [Use Template] │
└─────────────────────────────────┘
```

## Animation Specifications

### Transitions
```css
--transition-fast: 150ms ease-out;
--transition-normal: 250ms ease-in-out;
--transition-slow: 350ms ease-in-out;
```

### Canvas Objects
- Appear: Scale from 0.8 to 1 (250ms)
- Delete: Fade + scale to 0.8 (200ms)
- Move: No animation (real-time)
- Select: Border glow pulse (1s)

## Mobile Adaptations

### Touch Gestures
- **Tap**: Select
- **Double tap**: Edit text
- **Pinch**: Zoom
- **Two-finger drag**: Pan
- **Long press**: Context menu
- **Swipe left/right**: Tool switch

### Mobile Toolbar
```
[Selection] [Shapes] [Draw] [Text] [More]
```

## Error States

### Connection Lost
```
┌─────────────────────────────────┐
│ ⚠️ Connection Lost               │
│ Attempting to reconnect...       │
│ Your changes are saved locally  │
└─────────────────────────────────┘
```

### Conflict Resolution
```
┌─────────────────────────────────┐
│ ⚠️ Editing Conflict              │
│ Another user is editing this    │
│ [View Their Changes] [Override]  │
└─────────────────────────────────┘
```

## Progressive Enhancement

### Feature Detection
```javascript
if (supportsWebGL) enableHardwareAcceleration();
if (supportsWebRTC) enableVideoChat();
if (supportsOffline) enableLocalFirst();
```

### Graceful Degradation
1. WebGL → Canvas 2D fallback
2. WebRTC → Text chat only
3. Real-time → Polling fallback
4. Offline → Read-only mode

## Framework Recommendations

### Frontend Stack
- **React 18+**: Component architecture
- **Next.js 15**: SSR/SSG optimization
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Animations
- **Fabric.js**: Canvas manipulation
- **Zustand**: State management

### Component Library
- Radix UI: Accessible primitives
- Headless UI: Unstyled components
- React Aria: Accessibility hooks

### Performance Tools
- React.memo: Component optimization
- useMemo/useCallback: Computation cache
- Virtual scrolling: Large lists
- Web Workers: Heavy computations

## Testing Requirements

### Visual Regression
- Chromatic/Percy snapshots
- Cross-browser testing
- Responsive breakpoint tests

### Interaction Testing
- Playwright E2E scenarios
- Jest unit tests
- React Testing Library

### Performance Metrics
- Core Web Vitals targets:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
  - FPS > 30 (degraded)
  - FPS > 60 (optimal)

## Implementation Priority

### Phase 1: Core Consolidation
1. Unified toolbar with existing tools
2. Canvas with chosen WebGL renderer
3. Basic collaboration features

### Phase 2: Enhanced Features
1. Comments and mentions
2. Templates integration
3. Export functionality

### Phase 3: Advanced Features
1. Voice/video chat
2. Advanced templates
3. Mobile responsive design

### Phase 4: Polish
1. Animation refinements
2. Accessibility audit
3. Performance optimization

---

**Note**: This design prioritizes consolidation of existing features over new development per Cycle 54 requirements.