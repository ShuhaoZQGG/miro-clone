# Miro Clone - Comprehensive UI/UX Design Specifications

## Design Vision
Complete UI/UX specifications for ALL core features from README.md, with special focus on security (MFA), performance (WebGL), and missing UI integrations.

## Design System

### Color Palette
```css
--primary: #0066FF        /* Actions, links, active states */
--primary-hover: #0052CC  /* Hover states */
--secondary: #6B7280      /* Secondary actions */
--success: #10B981        /* Success states */
--warning: #F59E0B        /* Warnings */
--error: #EF4444          /* Errors */
--surface: #FFFFFF        /* Canvas, cards */
--surface-alt: #F9FAFB    /* Panels, backgrounds */
--border: #E5E7EB         /* Borders, dividers */
--text-primary: #111827   /* Primary text */
--text-secondary: #6B7280 /* Secondary text */
--text-disabled: #9CA3AF  /* Disabled text */
```

### Typography
- **Font Family**: Inter, system-ui, sans-serif
- **Headings**: 24px/20px/16px (h1/h2/h3)
- **Body**: 14px regular/medium
- **Small**: 12px
- **Button**: 14px medium

### Spacing
- Base unit: 4px
- Component padding: 8px/12px/16px
- Section spacing: 24px/32px
- Breakpoints: 640px/768px/1024px/1280px

## Layout Structure

### Main Application Layout
```
┌─────────────────────────────────────────────────────────┐
│ Header (56px)                                           │
├─────────┬────────────────────────────────┬─────────────┤
│Sidebar  │       Canvas Area              │Properties   │
│(240px)  │       (Flexible)               │Panel(320px) │
│         │                                 │             │
│Tools    │       Infinite Canvas          │Context      │
│Layers   │                                 │Settings     │
│Pages    │                                 │Comments     │
│         │                                 │             │
└─────────┴────────────────────────────────┴─────────────┘
Footer Status Bar (32px)
```

## Component Specifications

### 1. Header Bar
**Purpose**: Primary navigation and board controls
**Components**:
- Logo & Board Title (left)
- View Controls (center): Zoom slider, Fit to screen, Grid toggle
- User Actions (right): Share, Export, Profile menu
**Interactions**:
- Board title: Click to edit (inline)
- Zoom: Slider + keyboard shortcuts (Cmd/Ctrl +/-)
- Share: Opens modal with permission controls

### 2. Tool Sidebar
**Sections**:

#### Drawing Tools
- **Select** (V): Default cursor
- **Hand** (H): Pan canvas
- **Rectangle** (R): Draw rectangles
- **Circle** (O): Draw circles
- **Line** (L): Draw lines
- **Arrow** (A): Draw arrows
- **Pen** (P): Freehand drawing
- **Text** (T): Add text
- **Sticky Note** (N): Add sticky notes
- **Image** (I): Upload images
- **Eraser** (E): Remove elements

#### Shape Library (Expandable)
- Basic: Square, Circle, Triangle, Diamond
- Extended: Star, Hexagon, Pentagon, Cloud
- Arrows: Various arrow types
- Custom: User-saved shapes

#### Templates Button
- Opens modal gallery
- Categories: Sprint, Mind Map, SWOT, Kanban, etc.
- Preview thumbnails with hover details

### 3. Canvas Area
**Features**:
- Infinite scroll with virtual viewport
- Grid overlay (toggleable, configurable 10/20/50px)
- Minimap (bottom-right corner, 200x150px)
- Context menu on right-click
- Multi-select with marquee or Shift+click
- Zoom controls (10%-500%)

**Visual Indicators**:
- Selection: Blue outline with resize handles
- Hover: Light blue glow
- Active editing: Dashed outline
- Locked: Gray overlay with lock icon
- Grouped: Purple outline

### 4. Properties Panel
**Dynamic Sections** (based on selection):

#### No Selection
- Canvas settings
- Grid size selector
- Background color
- Canvas dimensions

#### Shape Selected
- Transform: X, Y, Width, Height, Rotation
- Style: Fill color, Border color, Border width
- Effects: Shadow, Opacity
- Actions: Lock, Group, Duplicate, Delete

#### Text Selected
- Font family dropdown
- Font size (8-144px)
- Weight (Regular/Medium/Bold)
- Alignment (Left/Center/Right/Justify)
- Color picker
- Line height
- Letter spacing

#### Image Selected
- Crop tool
- Filters (Brightness, Contrast, Saturation)
- Replace image button
- Alt text field

### 5. Collaboration Features

#### Live Cursors
- Colored cursor with user name label
- Smooth animation (60fps)
- Fade out after 3s inactivity

#### User Presence Bar
- Avatar circles (max 5 visible, +N for others)
- Online indicator (green dot)
- Click for user list modal

#### Comments System
- Thread indicators on canvas
- Side panel for comment threads
- @mention autocomplete
- Resolve/reopen actions
- Timestamp and user info

### 6. Modals & Dialogs

#### Template Gallery Modal
```
┌─────────────────────────────────────┐
│ Choose a Template            [X]    │
├─────────────────────────────────────┤
│ Categories │  Template Grid         │
│ • All      │  ┌──┐ ┌──┐ ┌──┐      │
│ • Sprint   │  │  │ │  │ │  │      │
│ • Mind Map │  └──┘ └──┘ └──┘      │
│ • SWOT     │  ┌──┐ ┌──┐ ┌──┐      │
│ • Kanban   │  │  │ │  │ │  │      │
│            │  └──┘ └──┘ └──┘      │
├─────────────────────────────────────┤
│        [Cancel]  [Use Template]     │
└─────────────────────────────────────┘
```

#### Share Modal
```
┌─────────────────────────────────────┐
│ Share Board                  [X]    │
├─────────────────────────────────────┤
│ Link Sharing: [Toggle]              │
│ ┌─────────────────────────────┐    │
│ │ https://app.com/board/xyz   │    │
│ └─────────────────────────────┘    │
│                                     │
│ Permissions:                        │
│ ○ View only                        │
│ ● Can edit                         │
│ ○ Can comment                      │
│                                     │
│ Invite by Email:                   │
│ [email@example.com    ] [Send]     │
│                                     │
│ Members:                           │
│ • John Doe (Owner)                 │
│ • Jane Smith (Editor) [Remove]     │
├─────────────────────────────────────┤
│            [Done]                   │
└─────────────────────────────────────┘
```

### 7. Priority UI Integration Components

#### Text Tool Integration
```
┌─────────────────────────────────────┐
│ Text Formatting Toolbar             │
├─────────────────────────────────────┤
│ [B] [I] [U] | Font▼ | Size▼ | A°   │
│ [≡] [≡] [≡] [≡] | Color | ▣ | ⊞   │
└─────────────────────────────────────┘
```
- Appears on text selection
- Floating above selected text
- Auto-hide on blur
- Keyboard shortcuts shown on hover

#### Grid Controls Panel
```
┌─────────────────────────────────────┐
│ Grid Settings                       │
├─────────────────────────────────────┤
│ ☑ Show Grid                        │
│ ☑ Snap to Grid                     │
│ Grid Size: [10px ▼]                │
│ Grid Color: [#E5E7EB]              │
│ Opacity: [====----] 40%            │
└─────────────────────────────────────┘
```
- Accessible from View menu or toolbar
- Real-time preview on change
- Persists per board

#### Image Upload Integration
```
┌─────────────────────────────────────┐
│ Add Image                           │
├─────────────────────────────────────┤
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐       │
│ │   Drop files here or     │       │
│ │   [Browse Files]          │       │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘       │
│                                     │
│ Recent:                             │
│ [📷] [📷] [📷] [📷] [📷]          │
│                                     │
│ From URL: [___________] [Add]      │
└─────────────────────────────────────┘
```
- Drag & drop anywhere on canvas
- Paste from clipboard (Ctrl/Cmd+V)
- URL import support
- Progress bar during upload

## User Journeys

### 1. First-Time User Flow
```
Landing → Sign Up → Onboarding Tour → Template Selection → 
Canvas Introduction → Tool Tips → Create First Shape → Save
```

### 2. Create New Board Flow
```
Dashboard → New Board → Choose Template/Blank → 
Set Title → Configure Settings → Start Creating
```

### 3. Collaboration Flow
```
Open Board → Share Button → Set Permissions → 
Copy Link/Invite → Collaborator Joins → 
See Live Cursor → Co-edit
```

### 4. Image Upload Flow
```
Select Image Tool → Click Canvas/Drag File → 
Preview → Confirm Placement → Resize/Position → 
Apply Properties
```

### 5. Text Editing Flow
```
Select Text Tool → Click Canvas → Type → 
Format Toolbar Appears → Style Text → 
Click Outside to Finish
```

## Responsive Design

### Desktop (1280px+)
- Full layout with all panels
- Optimal canvas space
- All features accessible

### Tablet (768px-1279px)
- Collapsible sidebar (icon mode)
- Properties panel as overlay
- Touch-optimized controls
- Larger hit targets (44px min)

### Mobile (< 768px)
- Bottom tool bar
- Full-screen canvas
- Gesture controls (pinch zoom, two-finger pan)
- Simplified property sheets
- Mobile-specific interactions

## Accessibility

### WCAG AA Compliance
- **Color Contrast**: 4.5:1 minimum
- **Focus Indicators**: Visible outlines on all interactive elements
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and live regions
- **Alternative Text**: Required for all images

### Keyboard Shortcuts
- Tab navigation through UI
- Arrow keys for fine positioning
- Space for hand tool
- Escape to deselect
- Delete/Backspace to remove

### Visual Accessibility
- High contrast mode support
- Zoom up to 200% without loss
- Colorblind-friendly palettes
- Motion reduction options

## Loading & Progress States

### Canvas Loading
- Skeleton screens for UI
- Progressive canvas rendering
- "Loading..." indicator with progress

### Image Upload Progress
```
┌────────────────────────┐
│ Uploading image...     │
│ ████████░░░░░░░ 75%    │
│ [Cancel]               │
└────────────────────────┘
```

### Auto-save Indicator
- Saving... (animated dots)
- Saved (checkmark, fade after 2s)
- Error: "Failed to save" with retry

## Error States

### Connection Lost
- Banner: "Connection lost. Attempting to reconnect..."
- Offline mode indicator
- Queue changes for sync

### Upload Errors
- Toast: "File too large (max 10MB)"
- Toast: "Unsupported format"
- Inline: "Failed to load image" with retry

### Permission Errors
- Modal: "You don't have permission to edit"
- Inline: "View-only mode"

## Animation & Transitions

### Micro-interactions
- Button hover: Scale 1.05, 150ms ease
- Tool selection: Background fade, 200ms
- Panel collapse: Slide + fade, 300ms
- Element selection: Border animate in, 100ms

### Canvas Animations
- Pan: Smooth scroll, no lag
- Zoom: Animated scale, 200ms
- Element creation: Fade in, 150ms
- Delete: Fade out + scale down, 200ms

## Performance Considerations

### Viewport Optimization
- Render only visible elements
- LOD system for zoom levels
- Virtualized element lists
- Debounced updates (16ms)

### Asset Loading
- Lazy load images
- Progressive image rendering
- Cache frequently used assets
- CDN for static resources

### Real-time Sync
- Optimistic UI updates
- Debounced broadcasts (100ms)
- Conflict resolution indicators
- Offline queue management

## Platform-Specific Features

### PWA Support
- Install prompt
- Offline functionality
- Push notifications
- App-like experience

### Native Features
- Clipboard integration
- Drag & drop from OS
- Native file dialogs
- System shortcuts

## Success Metrics

### Performance KPIs
- Time to Interactive: < 3s
- Frame rate: 60fps constant
- Input latency: < 50ms
- Save time: < 500ms

### Usability Metrics
- Task completion: > 95%
- Error rate: < 5%
- Time on task: Competitive
- User satisfaction: > 4.5/5

## Implementation Notes

### Component Library
- Use Radix UI primitives
- Tailwind for styling
- Framer Motion for animations
- React Hook Form for forms

### State Management
- Zustand for UI state
- Canvas state in Fabric.js
- WebSocket for real-time
- IndexedDB for offline

### Testing Requirements
- Component testing with RTL
- E2E with Playwright
- Visual regression with Percy
- Performance with Lighthouse

## Design Handoff

### Assets Required
- Icon set (24px, SVG)
- Logo variations
- Loading animations
- Empty states illustrations

### Documentation
- Component usage guide
- Design token reference
- Pattern library
- Accessibility checklist

## Key UI/Manager Integration Points

### TextEditingManager UI
- Toolbar button with "T" icon
- Floating formatting toolbar
- Keyboard shortcut (T)
- Context menu integration

### GridSnappingManager UI
- Toggle in View menu
- Settings panel in properties
- Visual grid overlay
- Snap indicator on drag

### ImageUploadManager UI
- Toolbar button with image icon
- Drag & drop zone
- Upload progress bar
- Recent images gallery

### Template Gallery UI
- Modal with category sidebar
- Grid view of templates
- Preview on hover
- "Use Template" action

## Security Features UI (Priority)

### Multi-Factor Authentication (MFA)
#### Setup Flow
```
┌─────────────────────────────────────────┐
│ Secure Your Account with 2FA            │
├─────────────────────────────────────────┤
│ 1. Scan QR Code with Authenticator App  │
│   ┌─────────────────┐                   │
│   │                 │                   │
│   │   [QR CODE]     │                   │
│   │                 │                   │
│   └─────────────────┘                   │
│                                          │
│ 2. Or enter manually:                   │
│   [ABCD-EFGH-IJKL-MNOP]                │
│                                          │
│ 3. Enter verification code:             │
│   [______] 6-digit code                 │
│                                          │
│ 4. Save backup codes:                   │
│   • XXXX-XXXX  • YYYY-YYYY             │
│   • ZZZZ-ZZZZ  • AAAA-AAAA             │
│   [Download]   [Copy]                   │
├─────────────────────────────────────────┤
│ [Skip for now]  [Enable 2FA]            │
└─────────────────────────────────────────┘
```

#### Security Dashboard
- Location: User Settings → Security
- Sections:
  - MFA Status (enabled/disabled toggle)
  - Active Sessions list with locations
  - Password strength meter
  - Recent security events log
  - Trusted devices management

### Session Management UI
- Show active sessions with:
  - Device type icon
  - Location (city, country)
  - Last active timestamp
  - IP address (partially hidden)
  - Revoke button

## Performance Optimization UI

### WebGL Settings Panel
```
┌─────────────────────────────────────────┐
│ Performance Settings                     │
├─────────────────────────────────────────┤
│ Rendering Engine:                        │
│ ○ Canvas 2D (Compatible)                │
│ ● WebGL (Recommended)                   │
│                                          │
│ Quality Preset:                          │
│ [Low] [Medium] [High] [Auto]            │
│                                          │
│ Advanced:                                │
│ ☑ Hardware Acceleration                 │
│ ☑ Viewport Culling                      │
│ ☑ Level of Detail (LOD)                 │
│ FPS Limit: [60 ▼]                       │
│                                          │
│ Performance Monitor: [Toggle]            │
└─────────────────────────────────────────┘
```

### Performance Overlay (Dev Mode)
- Position: Top-right corner
- Metrics:
  - FPS: Current/Average
  - Objects: Visible/Total
  - Render Time: ms
  - Memory: MB used
  - Network Latency: ms

## Extended Shape Tools

### Advanced Shapes Panel
```
┌─────────────────────────────────────────┐
│ Shape Library                           │
├─────────────────────────────────────────┤
│ Basic Shapes:                           │
│ [□] [○] [△] [◇] [⬟] [⬢]              │
│                                          │
│ Stars & Polygons:                       │
│ [☆] [★] [✦] [✧] [⬟] [⬢]              │
│                                          │
│ Arrows:                                  │
│ [→] [⇒] [⇨] [➜] [➔] [➤]              │
│                                          │
│ Custom Shapes:                          │
│ [+] Add custom shape                    │
│ • My Shape 1                            │
│ • My Shape 2                            │
└─────────────────────────────────────────┘
```

## Real-time Collaboration Enhancements

### Voice/Video Call UI
```
┌─────────────────────────────────────────┐
│ Board Call (3 participants)             │
├─────────────────────────────────────────┤
│ [👤] [👤] [👤] [+Invite]                │
│                                          │
│ [🎤] [📹] [🖥️] [⚙️] [End Call]        │
│ Mute  Cam  Share Settings               │
└─────────────────────────────────────────┘
```

### Conflict Resolution UI
```
┌─────────────────────────────────────────┐
│ ⚠️ Editing Conflict                     │
├─────────────────────────────────────────┤
│ Multiple users editing same object:     │
│                                          │
│ Your Version    |  Their Version        │
│ [Preview]       |  [Preview]            │
│                                          │
│ [Keep Mine] [Keep Theirs] [Merge]       │
└─────────────────────────────────────────┘
```

## Advanced Canvas Features

### Rulers & Guides
```
┌─────────────────────────────────────────┐
│←─┬───┬───┬───┬───┬───┬───┬───┬───┬───→│ Horizontal Ruler
├─────────────────────────────────────────┤
│↑ │                                      │
│┬ │         Canvas Area                  │
││ │         • Drag from ruler to         │
││ │           create guides              │
││ │         • Snap to guides             │
│↓ │                                      │
└─────────────────────────────────────────┘
  Vertical Ruler
```

### Smart Connectors
- Auto-routing between shapes
- Connection points (N, S, E, W)
- Curved/straight/orthogonal options
- Labels on connectors
- Arrowhead styles

## PDF Export Advanced Options
```
┌─────────────────────────────────────────┐
│ Export to PDF                           │
├─────────────────────────────────────────┤
│ Page Setup:                             │
│ Size: [A4 ▼]  Orientation: [◉] [○]     │
│                                          │
│ Content:                                 │
│ ○ Entire Board                          │
│ ● Selected Objects                      │
│ ○ Current View                          │
│                                          │
│ Options:                                 │
│ ☑ Include Comments                      │
│ ☑ Include Grid                          │
│ ☐ Include Background                    │
│ ☑ Vector Graphics (smaller file)        │
│                                          │
│ Quality: [====------] High              │
│                                          │
│ [Preview]        [Cancel] [Export]      │
└─────────────────────────────────────────┘
```

## Offline Mode UI
```
┌─────────────────────────────────────────┐
│ 🔴 Offline Mode                         │
├─────────────────────────────────────────┤
│ You're working offline. Changes will    │
│ sync when connection is restored.       │
│                                          │
│ • 5 changes pending sync                │
│ • Last sync: 2 minutes ago              │
│                                          │
│ [View Changes] [Retry Connection]       │
└─────────────────────────────────────────┘
```

## Analytics Dashboard
```
┌─────────────────────────────────────────┐
│ Board Analytics                         │
├─────────────────────────────────────────┤
│ Engagement:                             │
│ • Views: 234 (↑12% this week)          │
│ • Active Users: 8                       │
│ • Comments: 45                          │
│ • Edit Time: 3h 24m average            │
│                                          │
│ Activity Timeline:                      │
│ [====│===│=======│==]                  │
│ Mon  Tue  Wed   Thu  Fri               │
│                                          │
│ Top Contributors:                       │
│ 1. John Doe (145 edits)                │
│ 2. Jane Smith (89 edits)               │
│ 3. Bob Wilson (67 edits)               │
└─────────────────────────────────────────┘
```

## Enterprise Features

### SSO Login Screen
```
┌─────────────────────────────────────────┐
│ Sign in to Miro Clone                   │
├─────────────────────────────────────────┤
│ [🏢 Sign in with Company SSO]           │
│                                          │
│ ─────── or ───────                      │
│                                          │
│ Email: [________________]               │
│ Password: [________________]            │
│                                          │
│ [Sign In]                               │
│                                          │
│ Other options:                          │
│ [G] Google  [MS] Microsoft  [GH] GitHub │
└─────────────────────────────────────────┘
```

### Audit Log Viewer
- Filterable by:
  - User
  - Action type
  - Date range
  - Board/Resource
- Export to CSV
- Real-time updates

## Mobile-Specific Features

### Mobile Toolbar (Bottom)
```
┌─────────────────────────────────────────┐
│ [✋] [▢] [○] [T] [✏️] [💬] [⋮]        │
│ Pan  Shape Text Draw Comment More       │
└─────────────────────────────────────────┘
```

### Touch Gestures
- Pinch: Zoom in/out
- Two-finger drag: Pan
- Long press: Context menu
- Double tap: Edit mode
- Three-finger tap: Undo
- Swipe left on object: Delete

## Accessibility Features

### High Contrast Mode
- Increased contrast ratios
- Bold outlines
- Larger text options
- Reduced transparency
- Clear focus indicators

### Keyboard Navigation Map
- Tab: Next element
- Shift+Tab: Previous element
- Arrow keys: Move selection
- Enter: Activate/Edit
- Escape: Cancel/Deselect
- Delete: Remove selected

## Health Check Dashboard (Admin)
```
┌─────────────────────────────────────────┐
│ System Health                           │
├─────────────────────────────────────────┤
│ API Status: ● Healthy                   │
│ Database: ● Connected                   │
│ WebSocket: ● Active (234 connections)   │
│ Storage: ● Available (45% used)         │
│ Cache: ● Hit rate 89%                   │
│                                          │
│ Response Times:                         │
│ • API: 45ms avg                        │
│ • Database: 12ms avg                   │
│ • WebSocket: 8ms avg                   │
│                                          │
│ [View Logs] [Run Diagnostics]          │
└─────────────────────────────────────────┘
```

## Search & Filter UI
```
┌─────────────────────────────────────────┐
│ 🔍 Search canvas...                     │
├─────────────────────────────────────────┤
│ Filter by:                              │
│ [All ▼] [Any time ▼] [Anyone ▼]       │
│                                          │
│ Results (23):                           │
│ • "Project timeline" (Text)            │
│ • "Sprint planning" (Sticky)           │
│ • "User flow diagram" (Group)          │
│                                          │
│ [Previous] [Next] [Close]              │
└─────────────────────────────────────────┘
```

## Version History UI
```
┌─────────────────────────────────────────┐
│ Version History                         │
├─────────────────────────────────────────┤
│ Current Version                         │
│                                          │
│ • 2 hours ago - John Doe               │
│   Added sprint planning section         │
│   [View] [Restore]                     │
│                                          │
│ • 5 hours ago - Jane Smith             │
│   Updated user flow diagram            │
│   [View] [Restore]                     │
│                                          │
│ • Yesterday - Auto-save                │
│   Automatic backup                     │
│   [View] [Restore]                     │
│                                          │
│ [Load More]                            │
└─────────────────────────────────────────┘
```

## Technical Constraints

### From Planning Phase
- Security: MFA configuration required
- Performance: WebGL renderer implementation
- Database: Optimize RLS policies
- UI Integration: Wire existing managers to UI

### Frontend Framework
- Next.js 15 App Router
- TypeScript strict mode
- Tailwind CSS styling
- Framer Motion animations
- Zustand state management
- Fabric.js with WebGL support
- Supabase Auth with MFA