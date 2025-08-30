# Miro Clone - Cycle 6 UI/UX Design Specifications

## Executive Summary
Cycle 6 focuses on completing the remaining critical features: real-time collaboration with WebSocket integration, export functionality (PNG/PDF/SVG), mobile touch gestures, and fixing remaining integration tests. This design document provides detailed specifications for user journeys, component interfaces, and technical implementation patterns.

## 1. User Journeys

### 1.1 Real-time Collaboration Journey
```
User A Opens Board → WebSocket Connection Established → User Presence Indicator Active
User B Joins Board → Both See Live Cursors → Simultaneous Editing → Conflict Resolution
User A Edits Element → Change Propagated → User B Sees Update in <100ms
Connection Lost → Offline Mode → Changes Queued → Reconnect → Sync Changes
```

### 1.2 Export Journey
```
User Clicks Export → Modal Opens → Select Format (PNG/PDF/SVG)
Choose Options (Bounds, Quality, Background) → Click Export
Server Generates File → Download Starts → Success Notification
```

### 1.3 Mobile Interaction Journey
```
User Opens on Mobile → Responsive Layout Loads → Touch Pan/Zoom
Long Press to Select → Drag to Move → Pinch to Zoom → Two-Finger Rotate
Touch Drawing Mode → Single Finger Draw → Two Finger Pan Canvas
```

## 2. Component Specifications

### 2.1 Real-time Collaboration Components

#### WebSocket Connection Status
```tsx
interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  latency?: number;
  userCount: number;
  onReconnect?: () => void;
}

// Visual States:
// Connected: Green dot + "Connected" + latency
// Connecting: Yellow pulsing dot + "Connecting..."
// Disconnected: Red dot + "Offline" + Reconnect button
// Error: Red dot + Error message + Retry button
```

#### User Presence Indicators
```tsx
interface UserPresenceProps {
  users: Array<{
    id: string;
    name: string;
    avatarColor: string;
    cursor?: { x: number; y: number };
    selection?: string[];
    isActive: boolean;
  }>;
  maxVisible?: number; // Default: 5
}

// Visual Design:
// - Avatar circles (32px) with initials
// - Stack horizontally with -8px overlap
// - Show "+N more" for overflow
// - Hover shows user tooltip
// - Click shows user list modal
```

#### Live Cursor Display
```tsx
interface LiveCursorProps {
  userId: string;
  position: { x: number; y: number };
  userName: string;
  color: string;
  isTyping?: boolean;
}

// Visual Design:
// - Colored cursor icon (16x16)
// - Name label (12px font) on hover
// - Smooth 60fps interpolation
// - Fade out after 5s inactivity
// - Typing indicator animation
```

### 2.2 Export Modal Component

#### Export Dialog Interface
```tsx
interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  elementCount: number;
}

interface ExportOptions {
  format: 'png' | 'pdf' | 'svg';
  bounds: 'visible' | 'all' | 'selection';
  quality?: 'low' | 'medium' | 'high'; // PNG only
  scale?: 1 | 2 | 3; // Resolution multiplier
  includeBackground: boolean;
  includeWatermark?: boolean;
}

// Layout:
// - Modal: 480px wide, auto height
// - Format selector: Radio buttons with icons
// - Options section: Conditional based on format
// - Preview thumbnail: 200x150px
// - Export button: Primary action
```

#### Export Progress Indicator
```tsx
interface ExportProgressProps {
  stage: 'preparing' | 'rendering' | 'compressing' | 'done';
  progress: number; // 0-100
  estimatedTime?: number; // seconds
  onCancel?: () => void;
}

// Visual Design:
// - Linear progress bar with percentage
// - Stage description text
// - Estimated time remaining
// - Cancel button (during processing)
// - Success checkmark animation on complete
```

### 2.3 Mobile Touch Interface

#### Touch Gesture Overlay
```tsx
interface TouchGestureOverlayProps {
  mode: 'select' | 'pan' | 'draw';
  activeGesture?: 'pinch' | 'rotate' | 'drag';
  touchPoints: Array<{ x: number; y: number }>;
}

// Visual Feedback:
// - Touch points: 44px circles with ripple effect
// - Gesture indicators: Lines between touch points
// - Mode indicator: Bottom bar with icons
// - Gesture hints: First-time user tooltips
```

#### Mobile Toolbar
```tsx
interface MobileToolbarProps {
  orientation: 'portrait' | 'landscape';
  activeTool: string;
  isCollapsed: boolean;
  onToolChange: (tool: string) => void;
}

// Layout:
// Portrait: Bottom dock, 64px height, scrollable
// Landscape: Side panel, 64px width, scrollable
// Collapsed: Floating FAB with expand action
// Tool icons: 44x44px touch targets
```

## 3. Responsive Design Specifications

### 3.1 Breakpoints
```scss
$breakpoints: (
  mobile: 320px,    // iPhone SE
  tablet: 768px,    // iPad Portrait
  desktop: 1024px,  // iPad Landscape+
  wide: 1440px      // Desktop
);
```

### 3.2 Layout Adaptations

#### Mobile (320-767px)
```
Header: Collapsed with hamburger menu
Toolbar: Bottom dock, swipeable
Canvas: Full screen with gesture controls
Panels: Full-screen overlays when opened
Touch targets: Minimum 44x44px
Font sizes: Base 16px, minimum 14px
```

#### Tablet (768-1023px)
```
Header: Condensed with icon-only buttons
Toolbar: Side panel, collapsible
Canvas: Full viewport minus toolbar
Panels: Sliding drawers (40% width)
Touch targets: Minimum 44x44px
Font sizes: Base 15px
```

#### Desktop (1024px+)
```
Header: Full with text labels
Toolbar: Left sidebar, 64px width
Canvas: Flexible with panel space
Panels: Docked or floating
Mouse targets: Standard 32x32px
Font sizes: Base 14px
```

## 4. Real-time Collaboration Protocol

### 4.1 WebSocket Message Types

#### Client → Server Messages
```typescript
type ClientMessage = 
  | { type: 'join'; boardId: string; userId: string }
  | { type: 'leave'; boardId: string }
  | { type: 'cursor'; position: Position }
  | { type: 'operation'; op: Operation }
  | { type: 'selection'; elementIds: string[] }
  | { type: 'typing'; elementId: string; isTyping: boolean }
  | { type: 'ping'; timestamp: number };
```

#### Server → Client Messages
```typescript
type ServerMessage =
  | { type: 'joined'; users: UserPresence[] }
  | { type: 'user_joined'; user: UserPresence }
  | { type: 'user_left'; userId: string }
  | { type: 'cursor_update'; userId: string; position: Position }
  | { type: 'operation'; op: Operation; userId: string }
  | { type: 'selection_update'; userId: string; elementIds: string[] }
  | { type: 'typing_update'; userId: string; elementId: string; isTyping: boolean }
  | { type: 'sync'; operations: Operation[] }
  | { type: 'conflict'; original: Operation; transformed: Operation }
  | { type: 'pong'; timestamp: number; serverTime: number };
```

### 4.2 Operational Transform Implementation

#### Transform Matrix
```typescript
// Transform priority matrix for concurrent operations
const transformMatrix = {
  'create-create': (op1, op2) => [op1, op2], // Independent
  'create-update': (op1, op2) => [op1, op2], // Independent
  'create-delete': (op1, op2) => [op1, null], // Delete wins
  'update-update': (op1, op2) => mergeUpdates(op1, op2),
  'update-delete': (op1, op2) => [null, op2], // Delete wins
  'delete-delete': (op1, op2) => [null, null], // Both deleted
};
```

## 5. Export System Design

### 5.1 Client-Side Export (PNG)
```typescript
interface ClientExporter {
  exportAsPNG(options: {
    canvas: fabric.Canvas;
    bounds: Bounds;
    scale: number;
    includeBackground: boolean;
  }): Promise<Blob>;
}

// Implementation:
// 1. Calculate export bounds
// 2. Create offscreen canvas
// 3. Scale and render elements
// 4. Convert to blob
// 5. Trigger download
```

### 5.2 Server-Side Export (PDF/SVG)
```typescript
interface ServerExporter {
  exportAsPDF(options: {
    elements: CanvasElement[];
    pageSize: 'A4' | 'A3' | 'Letter';
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number };
  }): Promise<Buffer>;

  exportAsSVG(options: {
    elements: CanvasElement[];
    viewBox: { x: number; y: number; width: number; height: number };
    preserveAspectRatio: boolean;
  }): Promise<string>;
}
```

## 6. Mobile Touch Gestures

### 6.1 Gesture Recognition
```typescript
interface GestureRecognizer {
  // Single touch
  tap: { duration: <300ms, movement: <10px };
  longPress: { duration: >500ms, movement: <10px };
  drag: { movement: >10px };
  
  // Multi-touch
  pinch: { touches: 2, scale: true };
  rotate: { touches: 2, rotation: true };
  pan: { touches: 2, parallel: true };
  
  // Drawing
  draw: { touches: 1, inDrawMode: true };
}
```

### 6.2 Touch Event Handling Priority
```
1. Drawing mode: Single touch → Draw
2. Selection mode: Long press → Select
3. Default: Two finger → Pan/Zoom
4. Selected element: Single touch → Move
5. Canvas: Double tap → Reset zoom
```

## 7. Accessibility Specifications

### 7.1 Keyboard Navigation
```typescript
const keyboardShortcuts = {
  // Navigation
  'Tab': 'Next element',
  'Shift+Tab': 'Previous element',
  'Arrow Keys': 'Move selection',
  'Space': 'Pan canvas',
  
  // Actions
  'Enter': 'Edit selected',
  'Delete': 'Delete selected',
  'Ctrl+Z': 'Undo',
  'Ctrl+Y': 'Redo',
  'Ctrl+C': 'Copy',
  'Ctrl+V': 'Paste',
  'Ctrl+A': 'Select all',
  'Ctrl+E': 'Export',
  
  // Zoom
  'Ctrl+Plus': 'Zoom in',
  'Ctrl+Minus': 'Zoom out',
  'Ctrl+0': 'Reset zoom',
};
```

### 7.2 Screen Reader Support
```typescript
interface AriaLabels {
  canvas: 'Whiteboard canvas with {count} elements';
  element: '{type} element at position {x}, {y}';
  toolbar: 'Drawing tools toolbar';
  userPresence: '{count} users currently editing';
  exportButton: 'Export board as image or document';
}
```

## 8. Performance Optimization

### 8.1 Rendering Strategy
```typescript
interface RenderOptimization {
  // Level of Detail (LOD)
  farLOD: { distance: >2x, render: 'bbox' };
  mediumLOD: { distance: >1x, render: 'simplified' };
  nearLOD: { distance: <1x, render: 'full' };
  
  // Culling
  frustumCulling: true;
  occlusionCulling: false; // Too expensive
  
  // Batching
  batchSize: 100; // Elements per render batch
  frameTime: 16ms; // Target 60fps
}
```

### 8.2 Network Optimization
```typescript
interface NetworkOptimization {
  // Message batching
  batchInterval: 50ms;
  maxBatchSize: 10;
  
  // Compression
  messageCompression: 'gzip';
  imageCompression: 'webp';
  
  // Throttling
  cursorThrottle: 30ms;
  operationThrottle: 0ms; // No throttle
}
```

## 9. Error Handling & Recovery

### 9.1 Connection Error States
```typescript
interface ErrorRecovery {
  connectionLost: {
    action: 'Show offline banner';
    recovery: 'Auto-reconnect with exponential backoff';
    maxRetries: 5;
  };
  
  syncError: {
    action: 'Show sync error dialog';
    recovery: 'Offer manual refresh or continue offline';
  };
  
  exportError: {
    action: 'Show error notification';
    recovery: 'Retry with reduced quality/size';
  };
}
```

### 9.2 Conflict Resolution UI
```typescript
interface ConflictResolutionUI {
  display: 'Non-blocking notification';
  options: ['Accept theirs', 'Keep mine', 'Merge'];
  timeout: 5000; // Auto-resolve to 'Accept theirs'
  history: 'Maintain conflict log for undo';
}
```

## 10. Visual Design System

### 10.1 Color Palette
```scss
// Collaboration colors (user avatars)
$user-colors: (
  1: #FF6B6B,  // Red
  2: #4ECDC4,  // Teal
  3: #45B7D1,  // Blue
  4: #96E6B3,  // Green
  5: #F7DC6F,  // Yellow
  6: #BB8FCE,  // Purple
  7: #85C1E2,  // Light Blue
  8: #F8B739,  // Orange
);

// Status colors
$status: (
  connected: #10B981,    // Green
  connecting: #F59E0B,   // Yellow
  disconnected: #EF4444, // Red
  syncing: #3B82F6,      // Blue
);
```

### 10.2 Animation Specifications
```scss
// Transitions
$transition-fast: 150ms ease;
$transition-normal: 250ms ease;
$transition-slow: 350ms ease;

// Animations
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes ripple {
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

// Motion preferences
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

## 11. Implementation Priority

### Phase 1: Real-time Foundation (Week 1)
1. WebSocket server setup
2. Connection management
3. User presence system
4. Basic operation sync

### Phase 2: Collaboration Features (Week 2)
1. Live cursors
2. Operational transform
3. Conflict resolution
4. Offline queue

### Phase 3: Export System (Week 3)
1. PNG export (client)
2. PDF export (server)
3. SVG export (server)
4. Export UI/UX

### Phase 4: Mobile & Polish (Week 4)
1. Touch gesture handlers
2. Responsive layouts
3. Performance optimization
4. Integration test fixes

## 12. Success Metrics

### Performance KPIs
- WebSocket latency: <100ms (p95)
- Cursor smoothness: 60fps
- Export time: <5s for 500 elements
- Mobile responsiveness: <100ms touch feedback

### User Experience KPIs
- Conflict rate: <1% of operations
- Export success rate: >99%
- Touch gesture accuracy: >95%
- Accessibility score: WCAG 2.1 AA

## Conclusion

This design specification provides comprehensive guidance for implementing the remaining Miro clone features in Cycle 6. The focus is on real-time collaboration with robust conflict resolution, efficient export functionality, and mobile-first touch interactions. All designs prioritize performance, accessibility, and user experience while maintaining the clean architecture established in previous cycles.