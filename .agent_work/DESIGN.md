# Miro Clone UI/UX Design Specifications

## 1. User Journeys

### 1.1 First-Time User Flow
1. **Landing** → Marketing page with value props
2. **Sign Up** → Supabase Auth (Email/OAuth)
3. **Onboarding** → Quick tutorial overlay
4. **Template Selection** → Choose starter template
5. **Canvas Interaction** → Begin creating

### 1.2 Returning User Flow
1. **Sign In** → Supabase Auth
2. **Dashboard** → Recent boards, folders, team workspaces
3. **Board Selection** → Open existing or create new
4. **Collaboration** → Real-time editing with team

### 1.3 Team Collaboration Flow
1. **Workspace Creation** → Set up team space
2. **Member Invitation** → Email invites with roles
3. **Permission Management** → Admin/Editor/Viewer
4. **Real-time Collaboration** → Live cursors, selections
5. **Comments & Mentions** → Async communication

## 2. Layout & Navigation

### 2.1 Application Shell
```
┌─────────────────────────────────────────────────┐
│ Header (60px)                                   │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │ Canvas Area                          │
│ (280px)  │ (Flexible)                           │
│          │                                       │
│ Collaps. │                                       │
│ (60px)   │                                       │
└──────────┴──────────────────────────────────────┘
```

### 2.2 Header Components
- **Logo** (Left)
- **Board Title** (Editable, Center-left)
- **Share Button** (Center-right)
- **User Presence Avatars** (Right)
- **User Menu** (Far right)

### 2.3 Sidebar Panels
- **Tools Panel** (Default)
  - Selection tool
  - Drawing tools
  - Shape tools
  - Text tool
  - Connector tool
  - Upload button
- **Templates Panel**
  - Search bar
  - Category filters
  - Template grid
- **Layers Panel**
  - Layer tree view
  - Visibility toggles
  - Lock controls
- **Comments Panel**
  - Thread list
  - Filter by resolved/unresolved

### 2.4 Canvas Controls
- **Zoom Controls** (Bottom-right)
  - Zoom in/out buttons
  - Zoom percentage
  - Fit to screen
- **Grid Toggle** (Bottom-left)
- **Minimap** (Bottom-right corner)

## 3. Component Specifications

### 3.1 Authentication (Supabase Auth UI)
```tsx
// Sign In Form
- Email input with validation
- Password input with show/hide
- Remember me checkbox
- Forgot password link
- OAuth buttons (Google, GitHub)
- Sign up link

// Sign Up Form
- Full name input
- Email input with validation
- Password input with strength meter
- Terms acceptance checkbox
- OAuth options
```

### 3.2 Dashboard
```tsx
// Board Grid
- Card layout (3-4 columns)
- Thumbnail preview
- Title, last modified
- Share status indicator
- Hover actions (Duplicate, Delete, Share)

// Folder Tree
- Expandable folders
- Drag & drop support
- Context menu (Rename, Delete, Move)
```

### 3.3 Canvas Toolbar
```tsx
// Text Formatting Bar (Contextual)
- Font family dropdown
- Font size dropdown
- Bold, Italic, Underline toggles
- Text color picker
- Alignment options
- List options

// Shape Properties Panel (Contextual)
- Fill color picker
- Stroke color picker
- Stroke width slider
- Opacity slider
- Corner radius (rectangles)
```

### 3.4 Template Gallery Modal
```tsx
// Gallery Layout
- Search bar with filters
- Category sidebar
- Grid of template cards (3 columns)
- Preview on hover
- Use template button

// Template Categories
- Sprint Planning
- Mind Maps
- User Journey
- SWOT Analysis
- Kanban Board
- Flowchart
- Wireframe
- Custom (user-created)
```

### 3.5 Comments System
```tsx
// Comment Thread
- User avatar
- User name & timestamp
- Comment text with mentions
- Reply button
- Resolve toggle
- Edit/Delete (own comments)

// Mention Popup
- User search
- Recent collaborators
- @mention autocomplete
```

## 4. Visual Design System

### 4.1 Color Palette
```scss
// Primary
$primary-500: #0066FF;
$primary-600: #0052CC;
$primary-400: #3385FF;

// Neutral
$gray-900: #1A1A1A;
$gray-700: #4A4A4A;
$gray-500: #7A7A7A;
$gray-300: #DADADA;
$gray-100: #F5F5F5;
$white: #FFFFFF;

// Semantic
$success: #00C851;
$warning: #FFB800;
$error: #FF3B30;
$info: #00B8FF;

// Canvas
$canvas-bg: #F8F9FA;
$grid-line: #E0E0E0;
$selection: #0066FF;
```

### 4.2 Typography
```scss
// Font Family
$font-primary: 'Inter', -apple-system, sans-serif;
$font-mono: 'JetBrains Mono', monospace;

// Sizes
$text-xs: 12px;
$text-sm: 14px;
$text-base: 16px;
$text-lg: 18px;
$text-xl: 24px;
$text-2xl: 32px;

// Weights
$font-regular: 400;
$font-medium: 500;
$font-semibold: 600;
$font-bold: 700;
```

### 4.3 Spacing System
```scss
$space-1: 4px;
$space-2: 8px;
$space-3: 12px;
$space-4: 16px;
$space-5: 20px;
$space-6: 24px;
$space-8: 32px;
$space-10: 40px;
$space-12: 48px;
```

### 4.4 Component Styling
```scss
// Buttons
.btn-primary {
  background: $primary-500;
  color: white;
  padding: $space-2 $space-4;
  border-radius: 6px;
  font-weight: $font-medium;
  
  &:hover {
    background: $primary-600;
  }
}

// Cards
.card {
  background: white;
  border: 1px solid $gray-300;
  border-radius: 8px;
  padding: $space-4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

// Inputs
.input {
  border: 1px solid $gray-300;
  border-radius: 4px;
  padding: $space-2 $space-3;
  
  &:focus {
    border-color: $primary-500;
    outline: 2px solid rgba(0, 102, 255, 0.2);
  }
}
```

## 5. Responsive Design

### 5.1 Breakpoints
```scss
$mobile: 640px;
$tablet: 768px;
$desktop: 1024px;
$wide: 1280px;
```

### 5.2 Mobile Adaptations
- **Collapsed Sidebar** → Bottom sheet on mobile
- **Touch Gestures** → Pinch zoom, pan, two-finger rotate
- **Simplified Toolbar** → Icon-only mode
- **Context Menus** → Action sheets
- **Modal Dialogs** → Full-screen on mobile

### 5.3 Tablet Optimizations
- **Floating Panels** → Dockable sidebars
- **Touch + Pencil** → Apple Pencil support
- **Gesture Controls** → Three-finger undo
- **Split View** → Side-by-side boards

## 6. Accessibility

### 6.1 WCAG 2.1 AA Compliance
- **Color Contrast** → 4.5:1 for normal text, 3:1 for large
- **Focus Indicators** → Visible keyboard navigation
- **Screen Reader** → ARIA labels and live regions
- **Keyboard Navigation** → Full keyboard support

### 6.2 Keyboard Shortcuts
```
General:
- Cmd/Ctrl + Z: Undo
- Cmd/Ctrl + Y: Redo
- Cmd/Ctrl + C: Copy
- Cmd/Ctrl + V: Paste
- Cmd/Ctrl + D: Duplicate
- Delete: Delete selected

Canvas:
- Space + Drag: Pan
- Cmd/Ctrl + 0: Fit to screen
- Cmd/Ctrl + Plus: Zoom in
- Cmd/Ctrl + Minus: Zoom out
- G: Toggle grid
- L: Toggle layers

Tools:
- V: Selection tool
- P: Pen tool
- R: Rectangle
- O: Ellipse
- T: Text tool
- C: Connector
```

### 6.3 Screen Reader Support
- Semantic HTML structure
- ARIA labels for icons
- Live regions for notifications
- Focus management in modals
- Descriptive link text

## 7. Interaction Patterns

### 7.1 Drag & Drop
- **File Upload** → Drag files onto canvas
- **Template Application** → Drag template to canvas
- **Element Arrangement** → Drag to reorder layers
- **Folder Organization** → Drag boards between folders

### 7.2 Real-time Feedback
- **Cursor Tracking** → Show other users' cursors
- **Selection Highlight** → Show who's editing what
- **Live Updates** → Instant sync of changes
- **Presence Indicators** → Active user avatars
- **Typing Indicators** → Show when others are typing

### 7.3 Progressive Disclosure
- **Contextual Toolbars** → Show relevant tools
- **Expandable Panels** → Collapse unused sections
- **Advanced Options** → Hide behind "More" menu
- **Tooltips** → Show on hover with shortcuts

## 8. Performance Considerations

### 8.1 Loading States
```tsx
// Skeleton Screens
- Dashboard grid skeleton
- Canvas loading spinner
- Template preview placeholders

// Progress Indicators
- Upload progress bars
- Export processing
- Template loading
```

### 8.2 Optimistic Updates
- Immediate visual feedback
- Background sync
- Conflict resolution UI
- Offline queue display

### 8.3 Error States
```tsx
// Error Messages
- Network connection lost
- Sync conflicts
- Permission denied
- File upload failed
- Export error

// Recovery Actions
- Retry button
- Offline mode
- Conflict resolution
- Alternative formats
```

## 9. Dark Mode Specifications

### 9.1 Dark Palette
```scss
$dark-bg: #1A1A1A;
$dark-surface: #2A2A2A;
$dark-border: #3A3A3A;
$dark-text: #E0E0E0;
$dark-muted: #A0A0A0;
```

### 9.2 Component Adaptations
- Inverted color schemes
- Adjusted contrast ratios
- Dimmed highlights
- Dark canvas option

## 10. Implementation Priority

### Phase 1: Core UI (Week 1)
1. Authentication flow with Supabase Auth UI
2. Dashboard and board management
3. Canvas with basic tools
4. Real-time cursors

### Phase 2: Collaboration (Week 2)
1. Comments system
2. Mentions and notifications
3. Team workspaces
4. Permission management

### Phase 3: Advanced Features (Week 3)
1. Expanded template gallery
2. Advanced text editor
3. Version history UI
4. Export options

### Phase 4: Polish (Week 4)
1. Dark mode
2. Mobile optimizations
3. Accessibility audit
4. Performance tuning

## Framework Recommendations

### Frontend Stack
- **React 19** with Next.js 15.5
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Framer Motion** for animations
- **Zustand** for state management

### Supabase Integration
- **@supabase/auth-ui-react** for authentication UI
- **@supabase/ssr** for server-side auth
- **Real-time subscriptions** for collaboration
- **Storage API** for file uploads

### Canvas Technology
- **Fabric.js** for canvas manipulation
- **Custom React hooks** for canvas state
- **Web Workers** for heavy computations
- **WebGL** for performance (future)