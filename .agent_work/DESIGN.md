# Miro Clone - UI/UX Design Specifications

## User Journeys

### 1. First-Time User Flow
**Entry**: Landing page → Sign up → Email verification → Onboarding
- Welcome modal with 3-slide feature tour
- Auto-create first board from template selection
- Interactive tutorial overlay on first board (skippable)
- Tooltips for first-time tool usage

### 2. Board Creation Flow  
**Entry**: Dashboard → New Board button
- Template gallery modal (categorized: Sprint, Mind Map, SWOT, Kanban, etc.)
- Blank board option with quick-start tips
- Recent templates section
- Board naming inline with auto-save

### 3. Collaboration Flow
**Entry**: Board → Share button → Invite collaborators
- Email/link sharing modal with permission levels (Viewer/Editor/Admin)
- Live user avatars in top-right corner (max 5 visible, +N indicator)
- Cursor tracking with name labels on hover
- Real-time typing indicators for text elements
- Voice/video chat activation from user avatar click

### 4. Content Creation Flow
**Primary Tools**: Left sidebar with grouped tools
- Selection/Navigation group (cursor, pan, zoom)
- Shape tools group (rectangle, circle, line, arrow, polygon)
- Content tools group (text, sticky note, image upload)
- Drawing tools group (pen, highlighter, eraser)
- Each tool shows keyboard shortcut on hover

## Screen Mockups

### Main Canvas Layout
```
┌─────────────────────────────────────────────────────┐
│ [Logo] File Edit View Insert Format Tools Help  [User]│ ← Header (48px)
├───┬─────────────────────────────────────────────┬───┤
│   │                                             │   │
│ T │                                             │ L │
│ o │          Main Canvas Area                   │ a │
│ o │          (Infinite scroll)                  │ y │
│ l │                                             │ e │
│ b │          [Canvas content here]              │ r │
│ a │                                             │ s │
│ r │                                             │   │
│   │                                             │ P │
│(48)│                                           │ a │
│   │                                             │ n │
│   │ ┌─────────┐                                │ e │
│   │ │ Minimap │                                │ l │
│   │ └─────────┘                                │   │
│   │                                             │(280)
├───┴─────────────────────────────────────────────┴───┤
│ Grid: ON | Zoom: 100% | Users: 3 | Saved          │ ← Status bar (32px)
└─────────────────────────────────────────────────────┘
```

### Toolbar Components
- **Primary Tools** (left sidebar, 48px wide):
  - Select tool (V)
  - Pan tool (H)
  - Rectangle (R)
  - Circle (O)
  - Line (L)
  - Arrow (A)
  - Text (T)
  - Sticky note (N)
  - Pen tool (P)
  - Eraser (E)
  - Image upload (I)
  - Template gallery (G)

- **Context Toolbar** (appears above selected elements):
  - Fill color picker
  - Stroke color picker
  - Stroke width (1-10px)
  - Font family (for text)
  - Font size (8-72pt)
  - Bold/Italic/Underline
  - Text alignment
  - Layer controls (bring forward/back)
  - Group/Ungroup
  - Lock/Unlock
  - Delete

### Responsive Breakpoints
- **Desktop**: 1440px+ (full feature set)
- **Laptop**: 1024px-1439px (collapsible panels)
- **Tablet**: 768px-1023px (floating toolbar, hidden layers panel)
- **Mobile**: 320px-767px (bottom navigation, gesture controls)

## Component Specifications

### Authentication Components
- **Login/Signup Forms**: Centered modal, 400px wide
  - Supabase Auth UI components integration
  - Social login buttons (Google, GitHub, Microsoft)
  - Email/password fields with validation
  - "Remember me" checkbox
  - Password strength indicator
  - 2FA input field (6-digit code)

### Canvas Tools
- **Shape Tools**: 
  - Preview on hover before placement
  - Click-and-drag creation
  - Shift+drag for proportional shapes
  - Default styles from user preferences

- **Text Tool**:
  - Click to create text box
  - Auto-resize based on content
  - Rich text toolbar on selection
  - @mention autocomplete in comments

- **Selection Tool**:
  - Rectangle selection (drag)
  - Lasso selection (Alt+drag)
  - Multi-select with Shift+click
  - Selection box with resize handles (8 points)

### Collaboration Features
- **Live Cursors**: Smooth 60fps interpolation
  - User color coding (10 distinct colors)
  - Name label fade-in on stop (2s delay)
  - Trail effect for movement visualization

- **User Presence Indicators**:
  - Avatar circles (32px) in header
  - Online status dot (green/yellow/gray)
  - "Following" mode indicator
  - Viewport rectangles in minimap

- **Comments System**:
  - Floating comment bubbles (min 200px wide)
  - Thread expansion on click
  - @mention with user search
  - Resolve/reopen buttons
  - Timestamp and author info

### Performance UI
- **Settings Panel** (gear icon → dropdown):
  - WebGL acceleration toggle
  - Quality presets (Low/Medium/High/Ultra)
  - FPS limit selector (30/60/120/Unlimited)
  - Debug overlay toggle
  - Cache management controls

- **Performance Overlay** (when enabled):
  - FPS counter (top-right)
  - Object count
  - Memory usage
  - Network latency
  - Render time graph

## Accessibility Features

### Keyboard Navigation
- **Tab order**: Toolbar → Canvas → Panels → Status bar
- **Focus indicators**: 2px blue outline on all interactive elements
- **Shortcuts panel**: ? key opens comprehensive list
- **Navigation mode**: Tab key switches between elements

### Screen Reader Support
- **ARIA labels**: All tools and buttons
- **Live regions**: Status updates, user joins/leaves
- **Semantic HTML**: Proper heading hierarchy
- **Alt text**: All images and icons

### Visual Accessibility
- **High contrast mode**: System preference detection
- **Color blind modes**: Protanopia, Deuteranopia filters
- **Zoom controls**: Ctrl+/- with 25%-400% range
- **Focus mode**: Dim inactive UI elements

### Motor Accessibility
- **Large hit targets**: Minimum 44x44px touch targets
- **Drag alternatives**: Arrow key movement (10px increments)
- **Sticky keys**: Hold-free modifier keys
- **Dwell clicking**: Hover to activate option

## Theme System

### Light Theme (Default)
- Background: #FFFFFF
- Canvas: #F5F5F5
- Primary: #0066FF
- Text: #1A1A1A
- Borders: #E0E0E0
- Shadows: rgba(0,0,0,0.1)

### Dark Theme
- Background: #1A1A1A
- Canvas: #2D2D2D
- Primary: #4D94FF
- Text: #FFFFFF
- Borders: #404040
- Shadows: rgba(0,0,0,0.3)

### Component States
- **Hover**: Brightness +10%
- **Active**: Primary color overlay
- **Disabled**: Opacity 0.5
- **Focus**: 2px ring offset
- **Error**: #FF4444 border
- **Success**: #44FF44 border

## Animation Specifications

### Transitions
- **Tool switches**: 200ms ease-out
- **Panel toggles**: 300ms slide
- **Modal opens**: 250ms fade + scale
- **Hover states**: 150ms ease
- **Loading states**: Pulse animation 1.5s

### Canvas Animations
- **Object creation**: 200ms scale-up from center
- **Object deletion**: 200ms scale-down + fade
- **Selection box**: Dashed border animation
- **Cursor tracking**: No delay, 60fps
- **Pan/Zoom**: Momentum scrolling with deceleration

## Data Visualization

### Minimap
- **Position**: Bottom-left corner (200x150px)
- **Features**: 
  - Viewport rectangle (draggable)
  - User viewport indicators (colored borders)
  - Object density heatmap
  - Click to navigate

### Grid System
- **Default**: 20px grid, #E0E0E0 lines
- **Zoom adaptive**: Hide below 50% zoom
- **Snap threshold**: 5px proximity
- **Toggle**: Ctrl+G shortcut

### Layers Panel
- **Position**: Right sidebar (280px wide)
- **Features**:
  - Tree view with expand/collapse
  - Drag to reorder
  - Eye icon for visibility
  - Lock icon for editing
  - Double-click to rename
  - Group management

## Export/Share UI

### Export Modal
- **Formats**: PDF, PNG, SVG, JPG
- **Options**:
  - Area selection (full board/selection/viewport)
  - Quality slider (PNG/JPG)
  - Scale factor (0.5x-4x)
  - Background toggle
  - Grid lines toggle

### Share Modal
- **Tabs**: Link/Email/Embed
- **Permissions**: 
  - View only (no toolbar)
  - Can comment (limited toolbar)
  - Can edit (full access)
  - Admin (manage users)
- **Advanced**:
  - Password protection
  - Expiry date
  - Download permissions

## Mobile Adaptations

### Touch Gestures
- **Pan**: Single finger drag
- **Zoom**: Pinch gesture
- **Select**: Long press
- **Multi-select**: Two-finger tap
- **Context menu**: Two-finger long press
- **Undo/Redo**: Two/three finger swipe

### Mobile UI Changes
- **Bottom toolbar**: Collapsed by default
- **Floating action button**: Quick tool access
- **Full-screen mode**: Hide all UI
- **Gesture hints**: First-time user overlay
- **Simplified tools**: Essential tools only

## Framework Recommendations

### Frontend Stack
- **UI Framework**: React 18 with Next.js 15
- **Component Library**: Radix UI + Tailwind CSS
- **Canvas**: Fabric.js with WebGL renderer
- **State**: Zustand + CRDT (Yjs)
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Design System
- **Spacing**: 4px base unit (4, 8, 12, 16, 24, 32, 48, 64)
- **Typography**: Inter font family
  - Headings: 24px, 20px, 18px, 16px
  - Body: 14px regular/medium
  - Small: 12px
- **Border radius**: 4px (small), 8px (medium), 12px (large)
- **Shadows**: 3 levels (sm, md, lg)

### Performance Targets
- **Initial load**: < 3s on 3G
- **Time to interactive**: < 5s
- **FPS**: 60fps for canvas operations
- **Bundle size**: < 500KB initial
- **Lighthouse score**: 90+ across all metrics

## Success Metrics
- **Onboarding completion**: > 80%
- **Tool discovery**: All tools used within first session
- **Collaboration activation**: Share within 24 hours
- **Mobile engagement**: 30% of sessions
- **Accessibility score**: WCAG 2.1 AA compliant
