# Miro Clone - UI/UX Design Specifications

## Design System

### Color Palette
- **Primary**: #0066FF (Blue) - Interactive elements, CTAs, selection
- **Secondary**: #00D084 (Green) - Success, online status, active users
- **Accent**: #FFB800 (Yellow) - Highlights, sticky notes, warnings
- **Error**: #FF5757 - Errors, destructive actions, conflicts
- **Warning**: #FFA500 - Pending states, sync issues
- **Collaboration**:
  - User-1: #FF6B6B (Red)
  - User-2: #4ECDC4 (Teal)
  - User-3: #45B7D1 (Sky)
  - User-4: #96CEB4 (Mint)
  - User-5: #FFEAA7 (Cream)
  - User-6: #DDA0DD (Plum)
  - User-7: #98D8C8 (Seafoam)
  - User-8: #FFB6C1 (Pink)
- **Neutral**:
  - Gray-900: #1A1A1A (Text primary)
  - Gray-700: #4A4A4A (Text secondary)
  - Gray-500: #9B9B9B (Disabled)
  - Gray-300: #E1E1E1 (Borders)
  - Gray-100: #F5F5F5 (Backgrounds)
  - White: #FFFFFF (Canvas)

### Typography
- **Font Family**: Inter (primary), JetBrains Mono (code)
- **Sizes**:
  - Display: 48px/56px (bold)
  - Heading-1: 32px/40px (semibold)
  - Heading-2: 24px/32px (semibold)
  - Heading-3: 20px/28px (medium)
  - Body: 14px/20px (regular)
  - Small: 12px/16px (regular)
  - Micro: 10px/14px (regular)

### Spacing
- Base unit: 4px
- Scale: 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px

### Elevation
- Level-0: none (flat)
- Level-1: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)
- Level-2: 0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)
- Level-3: 0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)
- Level-4: 0 15px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)
- Level-5: 0 20px 40px rgba(0,0,0,0.20) (modals)

## Layout Architecture

### Main Application Shell
```
┌─────────────────────────────────────────────────────┐
│ Header (56px) - Board title, Share, Export         │
├───────────┬─────────────────────────────┬──────────┤
│ Sidebar   │ Canvas Area                 │ Panels   │
│ (72px)    │ (flex-1)                   │ (360px)  │
│           │ ┌────────────────────────┐ │          │
│ [Select]  │ │ Performance Monitor   │ │ Properties│
│ [Hand]    │ │ FPS: 60 | Objects: 0  │ │ Layer     │
│ [─────]   │ └────────────────────────┘ │ Comments  │
│ [Rect]    │                             │ History   │
│ [Circle]  │     Infinite Canvas        │          │
│ [Line]    │     (WebGL Accelerated)   │ ┌──────┐ │
│ [Arrow]   │                             │ │Video │ │
│ [─────]   │                             │ │Chat  │ │
│ [Pen]     │ ┌────────────┐             │ │Panel │ │
│ [Text]    │ │  Minimap   │             │ └──────┘ │
│ [Note]    │ └────────────┘             │          │
│ [Image]   │                             │          │
└───────────┴─────────────────────────────┴──────────┘
```

### Responsive Breakpoints
- Mobile: 320-767px (Bottom sheet UI, touch optimized)
- Tablet: 768-1279px (Collapsible panels, floating toolbar)
- Desktop: 1280-1919px (Full feature set)
- Wide: 1920px+ (Multi-board view, extended panels)

## Component Specifications

### 1. Authentication Flow

#### Login Screen
- **Layout**: Centered card (400px width)
- **Components**:
  - Logo and app name
  - Email input with validation
  - Password input with show/hide toggle
  - "Remember me" checkbox
  - "Sign In" button (primary)
  - "Forgot Password?" link
  - OAuth buttons (Google, GitHub)
  - "Create Account" link
- **States**: Loading, Error, Success
- **Validation**: Real-time field validation

#### Registration Screen
- **Layout**: Multi-step wizard (3 steps)
- **Step 1**: Account creation (email, password)
- **Step 2**: Profile setup (name, avatar)
- **Step 3**: Workspace creation or join
- **Components**:
  - Progress indicator
  - Step navigation (back/next)
  - Form validation messages
  - Terms of service checkbox

### 2. Dashboard

#### Board Gallery
- **Layout**: Grid view (default) / List view
- **Card Design** (280x200px):
  - Thumbnail preview
  - Title (truncated)
  - Last modified date
  - Collaborator avatars (max 3 +n)
  - Quick actions (duplicate, delete, share)
  - Hover state with overlay actions
- **Sorting**: Recent, Name, Modified, Created
- **Filtering**: My boards, Shared, Templates, Archived

#### Template Gallery Modal
- **Layout**: Full-screen modal with categories
- **Categories**: Sidebar navigation
  - Sprint Planning
  - Mind Mapping
  - SWOT Analysis
  - User Journey
  - Kanban Board
  - Flowchart
  - Custom Templates
- **Template Preview**:
  - Large preview (600x400px)
  - Description text
  - "Use Template" button
  - Creator attribution

### 3. Canvas Workspace

#### Toolbar (Left Sidebar - 56px wide)
- **Tools** (icon buttons with tooltips):
  - Select (V) - cursor icon
  - Pan (H) - hand icon
  - Rectangle (R) - square icon
  - Circle (O) - circle icon
  - Line (L) - line icon
  - Arrow (A) - arrow icon
  - Pen (P) - pen icon
  - Text (T) - text icon
  - Sticky Note (N) - sticky icon
  - Image (I) - image icon
  - Eraser (E) - eraser icon
  - Comment (C) - comment icon
- **Tool Groups**: Separated by dividers
- **Active State**: Blue background, white icon
- **Keyboard Shortcuts**: Displayed on hover

#### Top Navigation Bar
- **Left Section**:
  - Board title (editable inline)
  - Star/favorite toggle
  - Share button (opens modal)
- **Center Section**:
  - Zoom controls (-, %, +, fit)
  - Grid toggle (icon button)
  - Undo/Redo buttons
- **Right Section**:
  - Collaborator avatars (live)
  - Export menu (PDF, PNG, SVG)
  - Settings gear
  - Present mode button

#### Canvas Area
- **Infinite Canvas**: Pan with mouse/touch
- **Grid Overlay**: Dotted lines (optional)
- **Minimap**: Bottom-right corner (160x120px)
- **Zoom Levels**: 10% - 400%
- **Selection Box**: Blue dashed border
- **Multi-select**: Shift+click or lasso
- **Context Menu**: Right-click on elements

#### Property Panel (Right - 320px)
- **Context-Sensitive**: Changes based on selection
- **Sections**:
  - Transform (X, Y, Width, Height, Rotation)
  - Appearance (Fill, Stroke, Opacity)
  - Text Properties (Font, Size, Align)
  - Layer Controls (Bring to front/back)
  - Actions (Group, Lock, Delete)
- **Number Inputs**: With increment/decrement buttons
- **Color Pickers**: Preset swatches + custom

### 4. Collaboration Features

#### Live Cursors
- **Design**: Colored cursor with user name tag
- **Smoothing**: 60fps interpolation
- **Visibility**: Fade at canvas edges
- **Colors**: Assigned from palette (8 colors)

#### User Presence Indicator
- **Avatar Stack**: Max 5 visible, +n for overflow
- **Status Dot**: Green (active), Yellow (idle)
- **Hover Card**:
  - User name and email
  - Current activity
  - Last seen time

#### Comments System
- **Thread View**:
  - Avatar + name + timestamp
  - Comment text with @mentions
  - Reply input field
  - Resolve button
  - Edit/Delete for own comments
- **Inline Comments**: Pin to canvas elements
- **Notification Badge**: Red dot with count

#### Voice/Video Chat Interface (WebRTC)
- **Minimized State** (Floating pill, bottom-right):
  - Participant count badge
  - Join/Leave toggle
  - Expand button
- **Expanded State** (Side panel, 360px):
  - Video grid (2x2 for 4+ users)
  - Individual video tiles (16:9 aspect)
  - Audio waveform visualizer
  - Controls per participant:
    - Mute/unmute mic
    - Camera on/off
    - Screen share
    - Volume slider
  - Self-view preview (corner)
  - Connection quality indicator
- **Screen Share Mode**:
  - Full canvas takeover
  - Presenter controls overlay
  - Participant list sidebar
  - Annotation tools enabled

### 5. Advanced Features

#### Grid Snapping Controls
- **Toggle Button**: In top toolbar
- **Settings Popover**:
  - Enable/disable checkbox
  - Grid size slider (4-64px)
  - Grid visibility toggle
  - Snap strength slider
- **Visual Feedback**: Elements snap with animation

#### Text Editor Toolbar
- **Floating Toolbar**: Above selected text
- **Controls**:
  - Font family dropdown
  - Size dropdown
  - Bold, Italic, Underline toggles
  - Text color picker
  - Alignment buttons
  - List buttons (bullet, number)
- **Rich Text Support**: Markdown shortcuts

#### Image Upload Interface
- **Drag & Drop Zone**: Dashed border on hover
- **Upload Button**: In toolbar + context menu
- **Progress Bar**: For large files
- **Supported Formats**: PNG, JPG, GIF, SVG
- **Image Controls**: Resize handles, crop tool

#### Export Modal
- **Format Selection**: Radio buttons
  - PDF (with page size options)
  - PNG (with resolution options)
  - SVG (vector format)
- **Export Area**: Full board or selection
- **Quality Settings**: Slider for compression
- **Download Button**: Primary action

### 6. Mobile Optimization

#### Touch Gestures
- **Pan**: Single finger drag
- **Zoom**: Pinch gesture (two fingers)
- **Rotate**: Two finger twist
- **Select**: Single tap
- **Multi-select**: Two finger tap or lasso
- **Context Menu**: Long press (haptic feedback)
- **Undo**: Three finger swipe left
- **Redo**: Three finger swipe right
- **Quick Zoom**: Double tap (zoom to element)

#### Mobile Toolbar (Bottom Sheet)
- **Collapsed State**: 64px height, swipe up to expand
- **Expanded State**: 280px height, tool grid
- **Layout**: 
  - Primary tools (first row, always visible)
  - Secondary tools (grid layout when expanded)
  - Active tool indicator (blue background)
- **Tool Size**: 48x48px minimum touch target
- **Tool Groups**: Swipeable carousel
- **Quick Actions Bar**: Undo, Redo, Delete (floating)

#### Responsive Canvas
- **Auto Layout**: Content reflows for viewport
- **Smart Zoom**: Auto-zoom to selection
- **Touch Handles**: 44x44px minimum (WCAG)
- **Gesture Hints**: First-time user overlays
- **Simplified Properties**: Bottom sheet with essentials
- **Performance Mode**: Reduced quality for smooth interaction

## User Journeys

### 1. First-Time User
1. Landing → Sign Up → Email Verification
2. Profile Setup → Choose Template/Blank
3. Onboarding Tour (5 steps)
4. Create First Board → Explore Tools
5. Invite Collaborator → Start Working

### 2. Returning User
1. Login → Dashboard (recent boards)
2. Select Board → Canvas loads
3. Continue work → Auto-save active
4. Share/Export → Logout

### 3. Collaboration Flow
1. Receive invite link → Join board
2. See live cursors → Start editing
3. Add comment → @mention teammate
4. Resolve discussion → Continue work
5. Export final version

## Accessibility Standards

### WCAG 2.1 Level AA Compliance
- **Color Contrast**: 4.5:1 minimum
- **Focus Indicators**: Visible keyboard focus
- **Screen Reader**: ARIA labels and roles
- **Keyboard Navigation**: All features accessible
- **Alt Text**: For all images and icons
- **Skip Links**: For main navigation

### Keyboard Shortcuts
- **Essential**:
  - Ctrl/Cmd+Z: Undo
  - Ctrl/Cmd+Y: Redo
  - Ctrl/Cmd+C/V: Copy/Paste
  - Delete: Remove selected
  - Escape: Cancel operation
- **Tools**: Single letter shortcuts (V, H, R, etc.)
- **Navigation**: Arrow keys for canvas pan

## Performance Targets

### Loading Times
- Initial load: < 3 seconds
- Canvas render: < 100ms
- Tool switch: < 50ms
- Save operation: < 500ms

### Canvas Performance
- 60 FPS for pan/zoom
- Handle 1000+ objects
- Smooth cursor tracking
- Instant selection feedback

## Error States

### Empty States
- **No Boards**: Illustration + "Create your first board"
- **No Templates**: "No templates available"
- **No Collaborators**: "Invite team members"

### Error Messages
- **Network Error**: Toast notification with retry
- **Save Failed**: Warning banner with manual save
- **Permission Denied**: Modal with explanation
- **Invalid Input**: Inline field validation

## Implementation Notes

### Framework Integration
- **Styling**: Tailwind CSS + CSS-in-JS for dynamic styles
- **Animation**: Framer Motion for smooth transitions
- **Components**: Radix UI primitives for accessibility
- **Forms**: React Hook Form with Zod validation
- **State**: Zustand for UI, CRDT for canvas state
- **Canvas**: Fabric.js with WebGL renderer
- **Real-time**: Socket.io for WebSocket communication
- **Video**: WebRTC with STUN/TURN servers

### Critical UI Components Priority

1. **P0 - Foundation**:
   - Canvas with WebGL acceleration
   - Real-time sync infrastructure
   - Authentication flow (Supabase Auth UI)
   - Performance monitoring overlay

2. **P1 - Core Collaboration**:
   - Live cursors with smooth interpolation
   - Conflict resolution indicators
   - Comments with @mentions
   - Video chat panel (WebRTC)

3. **P2 - Enhanced Features**:
   - Advanced template system
   - AI-powered suggestions
   - Mobile touch optimization
   - Offline mode with sync

### Design Tokens
```css
:root {
  --color-primary: #0066FF;
  --color-secondary: #00D084;
  --color-error: #FF5757;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.16);
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}
```

## Responsive Design Matrix

| Component | Mobile | Tablet | Desktop | Wide |
|-----------|--------|--------|---------|------|
| Toolbar | Bottom | Left | Left | Left |
| Canvas | Full | Full | Center | Center |
| Properties | Sheet | Panel | Panel | Panel |
| Collaborators | Hidden | Top | Top | Top |
| Comments | Modal | Sidebar | Sidebar | Sidebar |

## Supabase Integration UI

### Authentication Components
- **Supabase Auth UI**: Pre-built components for login/signup
- **Custom Overrides**: Brand colors, logo, terms
- **OAuth Providers**: Google, GitHub, Microsoft
- **Magic Link**: Email-based passwordless auth
- **Session Management**: Auto-refresh, logout controls

### Database-Driven Features
- **Board Permissions**: Role selector (owner, admin, editor, viewer)
- **Real-time Indicators**: WebSocket connection status
- **Storage Browser**: File upload progress, quota display
- **User Profiles**: Avatar upload to Supabase Storage
- **Audit Trail**: Activity history from database logs

### Performance Dashboard
- **Metrics Display**:
  - Active connections count
  - Database query time
  - Storage bandwidth usage
  - Real-time latency
- **Connection Status**: Green/yellow/red indicators
- **Sync Queue**: Pending operations visualization

## Advanced Template System

### Template Categories
1. **Business Strategy**:
   - SWOT Analysis (2x2 grid layout)
   - Business Model Canvas (9 blocks)
   - Lean Canvas (problem/solution focus)

2. **Project Management**:
   - Sprint Planning (columns: Todo, In Progress, Done)
   - Gantt Chart (timeline view)
   - Kanban Board (WIP limits)

3. **Design Thinking**:
   - User Journey Map (phases, touchpoints)
   - Empathy Map (think, feel, say, do)
   - Mind Map (radial layout)

4. **Technical**:
   - System Architecture (layers, components)
   - Database Schema (ERD style)
   - Flowchart (decision trees)

### AI-Powered Features
- **Smart Suggestions**: Next shape prediction
- **Auto-Layout**: Intelligent element arrangement
- **Content Generation**: Lorem ipsum for templates
- **Image Recognition**: Auto-tagging uploaded images

## Accessibility Enhancements

### Screen Reader Support
- **Canvas Navigation**: Spatial audio cues
- **Element Descriptions**: Alt text for all shapes
- **Landmark Regions**: ARIA labels for UI sections
- **Focus Management**: Trap focus in modals

### Keyboard-Only Operation
- **Tab Navigation**: Logical focus order
- **Tool Switching**: Number keys 1-9
- **Canvas Movement**: Arrow keys with modifiers
- **Element Manipulation**: Shift/Ctrl combinations

### Visual Accommodations
- **High Contrast Mode**: System preference detection
- **Color Blind Modes**: Protanopia, Deuteranopia filters
- **Zoom Levels**: 50% - 500% without quality loss
- **Reduced Motion**: Respect prefers-reduced-motion

## Production UI Considerations

### Error Recovery
- **Auto-Save Indicator**: Saving... / Saved / Error states
- **Offline Banner**: "Working offline, changes will sync"
- **Reconnection Toast**: "Connection restored"
- **Conflict Resolution Modal**: Side-by-side comparison

### Performance Indicators
- **FPS Counter**: Toggle in settings (dev mode)
- **Object Count**: Display in status bar
- **Memory Usage**: Warning at 80% threshold
- **Network Latency**: Ping display for collaboration

### Security UI
- **Permission Badges**: Lock icon for read-only
- **Share Dialog**: Permission matrix, expiry dates
- **Audit Log Viewer**: Filterable activity timeline
- **2FA Setup**: QR code, backup codes display

## Next Steps
- Finalize component specifications with development team
- Create high-fidelity mockups for critical flows
- Build interactive prototype for user testing
- Develop comprehensive design system documentation
- Implement accessibility testing framework