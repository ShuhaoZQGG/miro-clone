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
  - OAuth buttons (Google, GitHub, Microsoft)
  - "Create Account" link
  - 2FA code input (when enabled)
- **States**: Loading, Error, Success, 2FA Required
- **Validation**: Real-time field validation
- **Security Indicators**: 
  - Password strength meter
  - Leaked password warning
  - MFA status badge

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
  - Privacy policy link
  - 2FA setup option

### 2. Dashboard

#### Board Gallery
- **Layout**: Grid view (default) / List view
- **Card Design** (280x200px):
  - Thumbnail preview (live render)
  - Title (truncated)
  - Last modified date
  - Collaborator avatars (max 3 +n)
  - Quick actions (duplicate, delete, share)
  - Hover state with overlay actions
  - Board member count badge
  - Public/Private indicator
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
  - Business Model Canvas
  - Custom Templates
- **Template Preview**:
  - Large preview (600x400px)
  - Description text
  - "Use Template" button
  - Creator attribution
  - Usage count
  - Category tags

### 3. Canvas Workspace

#### Toolbar (Left Sidebar - 72px wide)
- **Tools** (icon buttons with tooltips):
  - Select (V) - cursor icon
  - Pan (H) - hand icon
  - Rectangle (R) - square icon
  - Circle (O) - circle icon
  - Line (L) - line icon
  - Arrow (A) - arrow icon
  - Star (*) - star icon
  - Hexagon (H) - hexagon icon
  - Triangle (T) - triangle icon
  - Polygon (P) - polygon icon
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
  - Board members avatars
- **Center Section**:
  - Zoom controls (-, %, +, fit)
  - Grid toggle (icon button)
  - Undo/Redo buttons
  - History timeline
- **Right Section**:
  - Collaborator avatars (live)
  - Export menu (PDF, PNG, SVG)
  - Settings gear
  - Present mode button
  - Video chat toggle

#### Canvas Area
- **Infinite Canvas**: Pan with mouse/touch
- **Grid Overlay**: Dotted lines (configurable)
- **Minimap**: Bottom-right corner (160x120px)
- **Zoom Levels**: 10% - 400%
- **Selection Box**: Blue dashed border
- **Multi-select**: Shift+click or lasso
- **Context Menu**: Right-click on elements
- **Performance Monitor**: FPS, object count, render time
- **CRDT Conflict Indicators**: Visual overlap warnings

#### Property Panel (Right - 320px)
- **Context-Sensitive**: Changes based on selection
- **Sections**:
  - Transform (X, Y, Width, Height, Rotation)
  - Appearance (Fill, Stroke, Opacity)
  - Text Properties (Font, Size, Align, Color)
  - Layer Controls (Bring to front/back)
  - Actions (Group, Lock, Delete)
  - Animations (Transitions, Effects)
- **Number Inputs**: With increment/decrement buttons
- **Color Pickers**: Preset swatches + custom

### 4. Collaboration Features

#### Live Cursors
- **Design**: Colored cursor with user name tag
- **Smoothing**: 60fps interpolation
- **Visibility**: Fade at canvas edges
- **Colors**: Assigned from palette (8 colors)
- **Selection Boxes**: User-colored borders
- **Conflict Halos**: Red glow for editing conflicts

#### User Presence Indicator
- **Avatar Stack**: Max 5 visible, +n for overflow
- **Status Dot**: Green (active), Yellow (idle), Gray (offline)
- **Hover Card**:
  - User name and email
  - Current activity
  - Last seen time
  - Role badge (Owner, Admin, Editor, Viewer)

#### Comments System
- **Thread View**:
  - Avatar + name + timestamp
  - Comment text with @mentions
  - Reply input field
  - Resolve button
  - Edit/Delete for own comments
  - Mention notifications
- **Inline Comments**: Pin to canvas elements
- **Notification Badge**: Red dot with count
- **Comment Resolution**: Archive resolved threads

#### Voice/Video Chat Interface (WebRTC)
- **Minimized State** (Floating pill, bottom-right):
  - Participant count badge
  - Join/Leave toggle
  - Expand button
  - Audio indicator waves
- **Expanded State** (Side panel, 360px):
  - Video grid (2x2 for 4+ users)
  - Individual video tiles (16:9 aspect)
  - Audio waveform visualizer
  - Controls per participant:
    - Mute/unmute mic
    - Camera on/off
    - Screen share
    - Volume slider
    - Pin video
  - Self-view preview (corner)
  - Connection quality indicator
  - Background blur toggle
  - Noise cancellation toggle
- **Screen Share Mode**:
  - Full canvas takeover
  - Presenter controls overlay
  - Participant list sidebar
  - Annotation tools enabled
  - Recording indicator

### 5. Advanced Features

#### Grid Snapping Controls
- **Toggle Button**: In top toolbar
- **Settings Popover**:
  - Enable/disable checkbox
  - Grid size slider (4-64px)
  - Grid visibility toggle
  - Snap strength slider
  - Snap to objects toggle
- **Visual Feedback**: Elements snap with animation
- **Smart Guides**: Alignment lines appear

#### Text Editor Toolbar
- **Floating Toolbar**: Above selected text
- **Controls**:
  - Font family dropdown
  - Size dropdown (8-72px)
  - Bold, Italic, Underline toggles
  - Text color picker
  - Highlight color
  - Alignment buttons
  - List buttons (bullet, number)
  - Link insertion
- **Rich Text Support**: Markdown shortcuts

#### Image Upload Interface
- **Drag & Drop Zone**: Dashed border on hover
- **Upload Button**: In toolbar + context menu
- **Progress Bar**: For large files
- **Supported Formats**: PNG, JPG, GIF, SVG, WebP
- **Image Controls**: 
  - Resize handles
  - Crop tool
  - Filter effects
  - Opacity slider
- **Storage Quota**: Display remaining space

#### Export Modal
- **Format Selection**: Radio buttons
  - PDF (with page size options)
  - PNG (with resolution options)
  - SVG (vector format)
  - JPG (with quality slider)
- **Export Area**: Full board or selection
- **Quality Settings**: Slider for compression
- **Background**: Include/exclude toggle
- **Download Button**: Primary action
- **Share Link**: Generate public URL

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
3. Onboarding Tour (5 interactive steps)
4. Create First Board → Explore Tools
5. Invite Collaborator → Start Working

### 2. Returning User
1. Login → Dashboard (recent boards)
2. Select Board → Canvas loads (< 3s)
3. Continue work → Auto-save active
4. Collaborate in real-time
5. Share/Export → Logout

### 3. Collaboration Flow
1. Receive invite link → Join board
2. See live cursors → Start editing
3. Add comment → @mention teammate
4. Join video chat → Screen share
5. Resolve conflicts → Export final

### 4. Template Usage Flow
1. Browse templates → Filter by category
2. Preview template → Read description
3. Use template → Customize content
4. Save as new board → Share with team
5. Create custom template from board

## Accessibility Standards

### WCAG 2.1 Level AA Compliance
- **Color Contrast**: 4.5:1 minimum (7:1 for small text)
- **Focus Indicators**: Visible keyboard focus
- **Screen Reader**: ARIA labels and roles
- **Keyboard Navigation**: All features accessible
- **Alt Text**: For all images and icons
- **Skip Links**: For main navigation
- **Landmarks**: Semantic HTML regions

### Keyboard Shortcuts
- **Essential**:
  - Ctrl/Cmd+Z: Undo
  - Ctrl/Cmd+Shift+Z: Redo
  - Ctrl/Cmd+C/X/V: Copy/Cut/Paste
  - Delete/Backspace: Remove selected
  - Escape: Cancel operation
  - Space: Pan canvas (hold)
- **Tools**: Single letter shortcuts (V, H, R, etc.)
- **Navigation**: Arrow keys for element/canvas movement
- **Modifiers**: Shift (constrain), Alt (duplicate), Ctrl (multi-select)

## Performance Targets

### Loading Times
- Initial load: < 3 seconds
- Canvas render: < 100ms
- Tool switch: < 50ms
- Save operation: < 500ms
- Real-time sync: < 100ms latency

### Canvas Performance
- 60 FPS for pan/zoom
- Handle 1000+ objects smoothly
- WebGL acceleration enabled
- Viewport culling active
- LOD rendering for zoom levels

## Database-Aligned UI Components

### Board Management
- **Board List**: Fetched from `boards` table
- **Member Management**: Based on `board_members` table
  - Role selector (viewer, editor, admin)
  - Member invite modal
  - Permission matrix display
- **Version History**: From `board_versions` table
  - Version timeline
  - Rollback UI
  - Diff viewer

### User System
- **User Profiles**: Linked to `users` table
  - Avatar management
  - Profile settings
  - Metadata display
- **Authentication**: Supabase Auth integration
  - Session management
  - OAuth provider buttons
  - Password reset flow

### Comments & Mentions
- **Comment Threads**: From `comments` table
  - Thread hierarchy
  - Resolution status
  - Position markers
- **Mention System**: Using `mentions` table
  - @mention autocomplete
  - Notification badges
  - Mention highlights

### Template System
- **Template Browser**: From `board_templates` table
  - Category filters
  - Public/private toggle
  - Creator attribution
  - Canvas preview

## Error States

### Empty States
- **No Boards**: Illustration + "Create your first board" CTA
- **No Templates**: "No templates in this category"
- **No Comments**: "Start a discussion"
- **No Collaborators**: "Invite team members"

### Error Messages
- **Network Error**: Toast with retry button
- **Save Failed**: Banner with manual save option
- **Permission Denied**: Modal with explanation
- **Sync Conflict**: Side-by-side comparison
- **Invalid Input**: Inline field validation
- **Quota Exceeded**: Upgrade prompt

### Loading States
- **Canvas Loading**: Skeleton screen with progress
- **Image Upload**: Progress bar with percentage
- **Template Loading**: Shimmer effect
- **User Search**: Spinner with cancel option

## Production Deployment UI

### Infrastructure Status Dashboard
- **Service Health Indicators**:
  - Vercel (Frontend): Green/Yellow/Red status
  - Railway (WebSocket): Connection count
  - Supabase (Database): Query latency
  - Cloudflare (CDN): Cache hit rate
  - Sentry (Monitoring): Error rate graph

### Security Configuration UI
- **Supabase Security Panel**:
  - MFA toggle with QR code setup
  - Leaked password protection status
  - Session timeout configuration
  - IP allowlist management
  - API rate limiting controls

### Performance Monitoring
- **Real-time Metrics Display**:
  - Active users counter
  - WebSocket connections
  - Database pool status
  - Memory usage gauge
  - CPU utilization chart
  - Network bandwidth meter

### Deployment Controls
- **Environment Switcher**:
  - Development/Staging/Production toggle
  - Feature flags management
  - A/B test configuration
  - Rollback controls
  - Deployment history

## Implementation Notes

### Framework Integration
- **Styling**: Tailwind CSS + CSS Modules
- **Animation**: Framer Motion for transitions
- **Components**: Radix UI + Headless UI
- **Forms**: React Hook Form + Zod
- **State**: Zustand + CRDT (Yjs)
- **Canvas**: Fabric.js + WebGL
- **Real-time**: Socket.io + Supabase Realtime
- **Video**: WebRTC (SimplePeer)

### Critical UI Components Priority

1. **P0 - Foundation** (Complete):
   - Canvas with WebGL acceleration ✓
   - Real-time sync infrastructure ✓
   - Authentication flow ✓
   - Performance monitoring ✓

2. **P1 - Core Collaboration** (Complete):
   - Live cursors ✓
   - Conflict resolution ✓
   - Comments system ✓
   - Video chat panel ✓

3. **P2 - Production Ready**:
   - Infrastructure monitoring dashboard
   - Security configuration panel
   - Deployment management UI
   - Analytics dashboard

### Design Tokens
```css
:root {
  --color-primary: #0066FF;
  --color-secondary: #00D084;
  --color-accent: #FFB800;
  --color-error: #FF5757;
  --color-warning: #FFA500;
  --color-success: #00D084;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.16);
  --shadow-lg: 0 10px 20px rgba(0,0,0,0.19);
  --shadow-xl: 0 15px 25px rgba(0,0,0,0.22);
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 350ms ease;
}
```

## Responsive Design Matrix

| Component | Mobile | Tablet | Desktop | Wide |
|-----------|--------|--------|---------|------|
| Toolbar | Bottom | Left | Left | Left |
| Canvas | Full | Full | Center | Center |
| Properties | Sheet | Panel | Panel | Dual |
| Collaborators | Hidden | Top | Top | Top |
| Comments | Modal | Sidebar | Sidebar | Panel |
| Video Chat | Full | Float | Panel | Panel |
| Templates | List | Grid | Grid | Gallery |

## Next Steps

### Immediate Actions
1. Component library setup with design tokens
2. Accessibility audit tools integration
3. Performance profiling setup
4. User testing framework

### Future Enhancements
1. AI-powered layout suggestions
2. Advanced gesture recognition
3. AR/VR canvas support
4. Blockchain-based version control
5. ML-driven conflict prediction

## Design Handoff

### For Developers
- All colors use CSS variables
- Spacing follows 4px grid system
- Components use Radix UI primitives
- Animations use Framer Motion
- Icons from Lucide React

### For QA
- Test on all breakpoints
- Verify WCAG compliance
- Check performance targets
- Validate error states
- Test offline functionality

### For Product
- All core features designed
- Mobile experience optimized
- Accessibility standards met
- Performance targets defined
- Production UI specified