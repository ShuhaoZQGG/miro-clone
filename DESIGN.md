# Miro Clone - UI/UX Design Specifications (Cycle 49)

## Design System

### Color Palette
- **Primary**: #0066FF (Blue) - Interactive elements, CTAs
- **Secondary**: #00D084 (Green) - Success states, collaboration indicators  
- **Accent**: #FFB800 (Yellow) - Highlights, sticky notes, conflicts
- **Error**: #FF5757 - Errors, destructive actions
- **Warning**: #FFA500 - Warnings, pending states, CRDT conflicts
- **Performance**:
  - Green: #10B981 (Good performance)
  - Yellow: #F59E0B (Warning performance)
  - Red: #EF4444 (Critical performance)
- **Neutral**:
  - Gray-900: #1A1A1A (Text primary)
  - Gray-700: #4A4A4A (Text secondary)
  - Gray-500: #9B9B9B (Disabled)
  - Gray-300: #E1E1E1 (Borders)
  - Gray-100: #F5F5F5 (Backgrounds)
  - White: #FFFFFF (Canvas)

### Typography
- **Font Family**: Inter (primary), SF Mono (code)
- **Sizes**:
  - Heading-1: 32px/40px (bold)
  - Heading-2: 24px/32px (semibold)
  - Heading-3: 20px/28px (semibold)
  - Body: 14px/20px (regular)
  - Small: 12px/16px (regular)
  - Micro: 10px/14px (regular)

### Spacing
- Base unit: 4px
- Common values: 4, 8, 12, 16, 24, 32, 48, 64px

### Elevation
- Level-1: 0 1px 3px rgba(0,0,0,0.12)
- Level-2: 0 4px 6px rgba(0,0,0,0.16)
- Level-3: 0 10px 20px rgba(0,0,0,0.19)

## Layout Architecture

### Main Application Shell
```
┌─────────────────────────────────────────────────────┐
│ Header (56px)                                       │
├───────────┬─────────────────────────────┬──────────┤
│ Sidebar   │ Canvas Area                 │ Panels   │
│ (56px)    │ (flex-1)                   │ (320px)  │
│           │                             │          │
│ Tools     │ Infinite Canvas            │ Context  │
│           │                             │ Menus    │
└───────────┴─────────────────────────────┴──────────┘
```

### Responsive Breakpoints
- Mobile: 320-767px (Single column, bottom toolbar)
- Tablet: 768-1023px (Collapsible sidebar)
- Desktop: 1024-1439px (Standard layout)
- Wide: 1440px+ (Extended workspace)

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

#### Voice/Video Controls
- **Floating Bar**: Bottom center
- **Controls**:
  - Mic toggle with indicator
  - Camera toggle
  - Screen share button
  - Participant list
  - Leave call button
- **Participant Videos**: Grid layout (max 4)

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
- **Zoom**: Pinch gesture
- **Select**: Tap
- **Multi-select**: Long press + drag
- **Context Menu**: Long press

#### Mobile Toolbar
- **Position**: Bottom of screen
- **Layout**: Horizontal scroll
- **Tool Size**: 48x48px touch targets
- **Collapse/Expand**: Swipe up/down

#### Responsive Canvas
- **Auto-zoom**: Fit content on load
- **Touch-friendly**: Larger selection handles
- **Simplified UI**: Essential tools only

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
- Use Tailwind CSS classes for styling
- Framer Motion for animations
- Radix UI for accessible components
- React Hook Form for form handling
- Zustand for state management

### Critical UI Components Priority
1. **P0 - Security & Environment**:
   - Password strength indicator
   - MFA setup flow
   - Environment variable config UI

2. **P1 - Core Features**:
   - Text tool toolbar integration
   - Grid snapping controls
   - Image upload button
   - Template gallery modal

3. **P2 - Performance**:
   - Loading skeletons
   - Virtualized lists
   - Progressive image loading

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

## Cycle 49 Priority Features

### WebGL Rendering System
- **Canvas Architecture**: Three.js WebGL renderer
- **Performance HUD**: Real-time metrics overlay
  - FPS counter with color coding
  - Object count and memory usage
  - Network latency indicator
- **Level of Detail (LOD)**:
  - Far: Bounding boxes only
  - Medium: Simplified shapes
  - Near: Full detail rendering
- **Viewport Culling**: Only render visible objects

### CRDT Conflict Resolution UI
- **Conflict Indicator**: Yellow pulse animation on conflicted elements
- **Resolution Modal**:
  ```
  ┌──────────────────────────────────┐
  │ ⚠️ Merge Conflict Detected       │
  │                                  │
  │ Your Version    │ Their Version  │
  │ [Preview A]     │ [Preview B]    │
  │                                  │
  │ [Keep Mine] [Keep Theirs] [Merge]│
  └──────────────────────────────────┘
  ```
- **Visual Diff**: Side-by-side comparison
- **Auto-merge**: For non-conflicting properties

### Mobile PWA Experience
- **Install Prompt**: Custom install banner
- **Offline Mode**: Service worker with sync
- **Touch Gestures**:
  - Pinch: Zoom
  - Two-finger rotate: Rotate selection
  - Three-finger swipe: Undo/redo
  - Long press: Context menu
- **Mobile-Optimized Toolbar**:
  - Bottom dock position
  - Larger touch targets (48x48px min)
  - Swipeable tool panels

### Performance Monitoring Dashboard
- **Metrics Panel** (collapsible):
  - Real-time FPS graph
  - Memory usage chart
  - Network activity monitor
  - WebSocket connection status
- **Optimization Suggestions**:
  - Auto-detect performance issues
  - Suggest quality reductions
  - Offer to switch to simplified mode

## Implementation Phases

### Phase 1: WebGL Integration (Week 1-2)
- Set up Three.js renderer
- Implement basic shape rendering
- Add viewport culling
- Create performance HUD

### Phase 2: CRDT & Collaboration (Week 3-4)
- Integrate Yjs library
- Build conflict detection system
- Design resolution UI components
- Implement merge strategies

### Phase 3: Mobile PWA (Week 5-6)
- Configure service worker
- Implement touch gesture handlers
- Create responsive toolbar
- Add offline sync

### Phase 4: Polish & Optimization (Week 7)
- Performance profiling
- Accessibility audit
- User testing
- Bug fixes

## Technical Design Constraints

### Performance Requirements
- **Target**: 60fps with 2000+ objects
- **Memory**: < 500MB for large boards
- **Load Time**: < 3s initial, < 100ms canvas
- **Network**: Handle 200ms latency gracefully

### Browser Support
- Chrome 90+ (primary)
- Safari 15+ (with polyfills)
- Firefox 90+
- Edge 90+
- Mobile Safari (special handling)

### Accessibility
- WCAG 2.1 Level AA
- Keyboard navigation complete
- Screen reader support
- High contrast mode

## Framework Recommendations

### Frontend Stack (Existing + New)
- **Framework**: Next.js 15 ✓
- **UI Components**: Radix UI + Tailwind ✓
- **Canvas**: Fabric.js ✓ + Three.js (new)
- **CRDT**: Yjs (new)
- **State**: Zustand ✓
- **PWA**: Workbox (new)
- **Monitoring**: Web Vitals API (new)

### Component Architecture
- Atomic design pattern
- Compound components
- CSS variables for theming
- Storybook for development

## Next Steps
- Implement WebGL renderer with Three.js
- Integrate Yjs for CRDT support
- Build conflict resolution UI
- Create mobile-responsive layouts
- Add performance monitoring dashboard