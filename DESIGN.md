# Cycle 7: UI/UX Design Specifications

## Overview
Focus on completing remaining features with emphasis on real-time collaboration, export functionality, and mobile optimization while fixing critical TypeScript build error.

## 1. User Journeys

### 1.1 Critical Fix Journey
**Goal:** Developer fixes TypeScript error blocking build
```
Start → Identify error location (history-manager.ts:208) → 
Fix function signature → Run tests → Verify build → 
Deploy successful build
```

### 1.2 Real-time Collaboration Journey
**Goal:** Multiple users collaborate on same board
```
User A opens board → User B joins → 
Both see cursor positions → User A creates element → 
User B sees it immediately → Conflict resolution handles simultaneous edits
```

### 1.3 Export Journey
**Goal:** Export board to different formats
```
User clicks Export → Select format (PNG/PDF/SVG) → 
Configure options → Preview → Download file
```

### 1.4 Mobile Journey
**Goal:** Use board on touch device
```
Open on mobile → Pinch to zoom → Two-finger pan → 
Long-press for context menu → Draw with finger → 
Access mobile-optimized toolbar
```

## 2. Component Specifications

### 2.1 WebSocket Connection Status
```typescript
interface ConnectionStatus {
  state: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  latency: number;
  users: number;
}
```
**Visual:** Status indicator in top-right corner
- 🔴 Disconnected (red)
- 🟡 Connecting/Reconnecting (yellow pulse)
- 🟢 Connected (green)
- Display latency in ms when connected

### 2.2 User Presence Indicators
```typescript
interface UserPresence {
  userId: string;
  name: string;
  avatarColor: string;
  cursor: { x: number; y: number };
  selection: string[];
}
```
**Visual:** 
- Colored cursors with user name labels
- Avatar circles in top bar showing active users
- Selection highlights in user's color
- Typing indicators when editing text

### 2.3 Export Modal
```typescript
interface ExportOptions {
  format: 'png' | 'pdf' | 'svg';
  quality: 'low' | 'medium' | 'high';
  bounds: 'visible' | 'all' | 'selection';
  background: boolean;
  scale: 1 | 2 | 3;
}
```
**Layout:**
```
┌─── Export Board ───────────────┐
│ Format: [PNG ▼]                │
│ Quality: ○Low ●Med ○High       │
│ Include: ●Visible ○All ○Selected│
│ □ Include background            │
│ Scale: [1x ▼]                  │
│ [Preview] [Cancel] [Export]    │
└─────────────────────────────────┘
```

### 2.4 Mobile Toolbar
**Landscape (width > 768px):**
- Horizontal toolbar at top
- Tool groups with separators
- Touch-friendly 44x44px buttons

**Portrait (width ≤ 768px):**
- Floating action button (FAB) bottom-right
- Expandable radial menu
- Collapsible side panels

## 3. WebSocket Protocol

### 3.1 Message Types
```typescript
// Client → Server
type ClientMessage = 
  | { type: 'join'; boardId: string; userId: string }
  | { type: 'cursor'; position: Position }
  | { type: 'operation'; op: Operation }
  | { type: 'selection'; elementIds: string[] };

// Server → Client  
type ServerMessage =
  | { type: 'joined'; users: UserPresence[] }
  | { type: 'user_joined'; user: UserPresence }
  | { type: 'cursor_update'; userId: string; position: Position }
  | { type: 'operation'; op: Operation; userId: string };
```

### 3.2 Operational Transform Matrix
```typescript
const transformMatrix = {
  'create-create': (op1, op2) => [op1, op2], // Independent
  'update-update': (op1, op2) => mergeUpdates(op1, op2),
  'delete-delete': (op1, op2) => [null, null], // Both deleted
  'update-delete': (op1, op2) => [null, op2], // Delete wins
};
```

## 4. Mobile Touch Gestures

### 4.1 Gesture Priority
1. **Pan (Two fingers):** Canvas navigation
2. **Pinch:** Zoom in/out
3. **Rotate (Two fingers):** Rotate selected element
4. **Tap:** Select element
5. **Long press:** Context menu
6. **Swipe:** Quick tool switching

### 4.2 Touch Targets
- Minimum size: 44x44px
- Spacing: 8px between targets
- Visual feedback: Ripple effect on touch
- Haptic feedback: Light vibration on actions

## 5. Responsive Breakpoints

### 5.1 Desktop (≥1024px)
- Full toolbar visible
- Side panels expanded
- Multi-column property panels
- Hover states enabled

### 5.2 Tablet (768px-1023px)
- Condensed toolbar
- Collapsible side panels
- Touch-optimized controls
- Simplified property panels

### 5.3 Mobile (<768px)
- FAB with radial menu
- Bottom sheet for properties
- Fullscreen canvas mode
- Gesture-based navigation

## 6. Accessibility Requirements

### 6.1 Keyboard Navigation
```
Tab: Navigate between elements
Shift+Tab: Navigate backwards
Space: Select/deselect
Enter: Edit text element
Delete: Remove selected
Ctrl+Z/Cmd+Z: Undo
Ctrl+Y/Cmd+Y: Redo
Arrow keys: Move selected element
```

### 6.2 Screen Reader Support
- ARIA labels for all tools
- Canvas element descriptions
- Operation announcements
- Status updates for connection

### 6.3 Color Contrast
- Text: 4.5:1 minimum ratio
- Icons: 3:1 minimum ratio
- Focus indicators: 3px outline
- High contrast mode support

## 7. Performance Optimization

### 7.1 Rendering Strategy
```typescript
class RenderOptimizer {
  // Level of Detail (LOD)
  getElementLOD(element: Element, zoom: number): 'full' | 'simplified' | 'bbox' {
    if (zoom < 0.5) return 'bbox';
    if (zoom < 0.8) return 'simplified';
    return 'full';
  }
  
  // Viewport culling
  isInViewport(element: Element, viewport: Rect): boolean {
    return intersects(element.bounds, viewport);
  }
}
```

### 7.2 Message Batching
- Batch interval: 50ms
- Max batch size: 10 operations
- Cursor throttle: 30ms
- Compression for large messages

### 7.3 Asset Loading
- Lazy load images
- Progressive image loading
- Cache frequently used assets
- Preload next likely tools

## 8. Error Handling

### 8.1 Connection Errors
```
Connection Lost → Show banner → 
Attempt reconnect (exponential backoff) → 
Switch to offline mode → 
Queue operations → Sync when reconnected
```

### 8.2 Conflict Resolution
```
Detect conflict → Apply transform → 
If unresolvable → Show conflict dialog → 
User chooses version → Continue
```

### 8.3 Export Errors
```
Export fails → Show specific error → 
Offer retry or alternative format → 
Fallback to client-side export if server fails
```

## 9. Visual Design System

### 9.1 Color Palette
```css
--primary: #6366f1;
--secondary: #8b5cf6;
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--neutral: #6b7280;
```

### 9.2 Typography
```css
--font-heading: 'Inter', sans-serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### 9.3 Spacing Scale
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
```

## 10. Animation Guidelines

### 10.1 Micro-interactions
- Tool selection: 150ms ease-out
- Element creation: 200ms spring
- Delete: 150ms scale + fade
- Connection: 300ms draw path

### 10.2 Performance Budget
- First paint: <1s
- Interactive: <3s
- Animation: 60fps minimum
- Input latency: <100ms

## Next Steps
1. Fix TypeScript build error immediately
2. Implement WebSocket server with room management
3. Add real-time cursor tracking and presence
4. Create export service with PDF generation
5. Implement mobile touch handlers
6. Add comprehensive error recovery
7. Performance testing with 50+ concurrent users