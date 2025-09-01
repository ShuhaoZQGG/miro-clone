# Miro Clone - Collaborative Whiteboard Application

A feature-rich collaborative whiteboard application built with Next.js, React, and Fabric.js, providing real-time collaboration capabilities similar to Miro.

## Core Features

### Canvas & Drawing
- ✅ **Infinite Canvas** - Pan, zoom, and navigate seamlessly
- ✅ **Drawing Tools** - Freehand drawing with customizable brush sizes and colors
- ✅ **Shape Tools** - Rectangle, ellipse, line, and connector tools
- ✅ **Text Elements** - Rich text editing with formatting options (bold, italic, underline)
- ✅ **Image Upload** - Drag & drop or click to upload images with progress indicators
- ✅ **Grid Snapping** - Precise alignment with visual feedback and snap indicators

### Collaboration
- ✅ **Real-time Sync** - WebSocket-based live collaboration with Socket.io
- ✅ **User Presence** - See active users and their cursors in real-time
- ✅ **Selection Sharing** - View what others are selecting or editing
- [ ] **Comments & Mentions** - Add comments to elements and mention team members
- [ ] **Version History** - Track changes and restore previous versions

### Templates & Productivity
- ✅ **Template Gallery** - Pre-built templates for common use cases
- [ ] **Custom Templates** - Save boards as reusable templates
- [ ] **Board Templates**:
  - Sprint Planning
  - Mind Maps
  - User Journey Maps
  - SWOT Analysis
  - Kanban Boards
  - Flowcharts
  - Wireframes

### Organization & Management
- ✅ **Layer Management** - Arrange elements with z-index controls
- ✅ **Element Grouping** - Group and ungroup elements
- ✅ **Undo/Redo** - Full history management with keyboard shortcuts
- [ ] **Folders & Projects** - Organize boards into projects
- [ ] **Search** - Find boards, elements, and text content

### Export & Sharing
- ✅ **Export Formats** - PNG, JPG, SVG export capabilities
- [ ] **PDF Export** - High-quality PDF generation
- [ ] **Public Sharing** - Share boards with view-only links
- [ ] **Embed Support** - Embed boards in other applications

### User Experience
- ✅ **Keyboard Shortcuts** - Comprehensive keyboard navigation
- ✅ **Touch Gestures** - Mobile-friendly touch controls
- ✅ **Toast Notifications** - User feedback for actions
- ✅ **Upload Progress** - Visual progress indicators
- ✅ **Grid Alignment Guides** - Visual helpers for precise positioning
- [ ] **Dark Mode** - Theme switching support

### Performance & Optimization
- [ ] **Canvas Virtualization** - Handle 1000+ elements efficiently
- [ ] **WebGL Acceleration** - GPU-powered rendering
- [ ] **Lazy Loading** - Progressive content loading
- [ ] **Offline Mode** - Work without internet connection

### Security & Authentication
- [ ] **User Authentication** - Secure login with Supabase
- [ ] **Team Workspaces** - Collaborative spaces for teams
- [ ] **Permission System** - View, edit, and admin roles
- [ ] **SSO Support** - Enterprise single sign-on

## Completed Features

### Cycle 45 (Latest)
- ✅ Template Gallery Integration with UI
- ✅ Text Formatting Controls (Bold, Italic, Underline)
- ✅ Grid Snapping Visual Feedback
- ✅ Upload Progress Indicators
- ✅ All Canvas Managers Connected to UI

### Cycle 43-44
- ✅ Text Editing Manager Implementation
- ✅ Grid Snapping Manager Implementation
- ✅ Test Infrastructure Improvements (93.9% pass rate)

### Cycle 42
- ✅ Image Upload with Drag & Drop
- ✅ Toast Notification System
- ✅ Upload Manager with Progress Tracking

### Previous Cycles
- ✅ Canvas Engine with Fabric.js
- ✅ State Management with Zustand
- ✅ WebSocket Server with Socket.io
- ✅ Drawing Tools (Rectangle, Ellipse, Line, Freehand)
- ✅ Layer Management System
- ✅ Undo/Redo System
- ✅ Touch Gesture Support
- ✅ Export System (PNG, JPG, SVG)

## In Progress

### Current Focus
- [ ] Fixing test infrastructure (GridSnappingManager mock)
- [ ] Expanding Template Gallery with more templates
- [ ] Advanced text editing features (font size, family, color)
- [ ] E2E testing for new UI integrations

### Next Priority
- [ ] PDF Export Implementation
- [ ] Canvas Performance Optimization
- [ ] Conflict Resolution with CRDT
- [ ] User Authentication with Supabase

## Tech Stack

### Frontend
- **Framework:** Next.js 15.5.2, React 19
- **Canvas:** Fabric.js 6.5.1
- **State Management:** Zustand 5.0.2
- **Real-time:** Socket.io Client 4.8.1
- **Styling:** Tailwind CSS 3.4.1
- **Animations:** Framer Motion 11.11.17
- **UI Components:** Radix UI

### Backend
- **WebSocket Server:** Express + Socket.io
- **Database:** Supabase (PostgreSQL)
- **File Storage:** Supabase Storage
- **Authentication:** Supabase Auth (planned)

### Development
- **Language:** TypeScript 5
- **Testing:** Jest, React Testing Library, Playwright
- **Build Tool:** Next.js with Turbopack
- **Linting:** ESLint
- **Package Manager:** npm

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ShuhaoZQGG/miro-clone.git
cd miro-clone
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Add your Supabase credentials
```

4. Run the development server:
```bash
npm run dev
```

5. Start the WebSocket server (in a separate terminal):
```bash
npm run websocket
```

6. Open [http://localhost:3000](http://localhost:3000)

### Testing

Run unit tests:
```bash
npm test
```

Run E2E tests:
```bash
npm run test:e2e
```

## Project Structure

```
miro-clone/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/             # Core libraries and managers
│   │   ├── canvas/      # Canvas-related managers
│   │   ├── store/       # Zustand state management
│   │   └── websocket/   # Real-time collaboration
│   ├── hooks/           # Custom React hooks
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
├── tests/              # Test files
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── e2e/          # End-to-end tests
└── docs/              # Documentation

```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Guidelines

- Write tests first (TDD approach)
- Maintain >90% test coverage
- Follow TypeScript strict mode
- Use conventional commits
- Document new features
- Ensure accessibility (WCAG 2.1 AA)

## Performance Targets

- 60fps rendering with 500+ elements
- <100ms real-time sync latency
- <3s Time to Interactive
- <2s page load time
- Bundle size <500KB gzipped

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Inspired by [Miro](https://miro.com)
- Built with [Fabric.js](http://fabricjs.com/)
- Real-time powered by [Socket.io](https://socket.io/)
- Database by [Supabase](https://supabase.com/)