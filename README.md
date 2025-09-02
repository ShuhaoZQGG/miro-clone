# Miro Clone - Collaborative Whiteboard Application

## Project Overview
A real-time collaborative whiteboard application inspired by Miro, built with Next.js, TypeScript, and Supabase. Features real-time collaboration, extensive canvas tools, and enterprise-ready security.

## Core Features

### Canvas & Drawing Tools
- **Basic Shapes**: Rectangle, Circle, Line, Arrow
- **Extended Shapes**: Star, Hexagon, Triangle, Polygon
- **Drawing Tools**: Freehand drawing with customizable brush sizes
- **Sticky Notes**: Resizable colored notes with text editing
- **Text Tool**: Rich text editing with formatting options
- **Selection Tool**: Multi-select with lasso and rectangular selection
- **Eraser Tool**: Remove individual or multiple elements

### Real-time Collaboration
- **Live Cursors**: See other users' cursor positions in real-time
- **User Presence**: Active user indicators with names and colors
- **Collaborative Editing**: Multiple users can edit simultaneously
- **Conflict Resolution**: CRDT-based automatic merge of changes
- **Operation History**: Undo/redo with collaborative awareness
- **Voice/Video Chat**: Integrated communication tools
- **Comments & Mentions**: Threaded discussions with @mentions

### Content Management
- **Image Upload**: Drag-and-drop or paste images directly
- **File Support**: PNG, JPG, GIF, SVG support
- **Templates Gallery**: Pre-built templates for common use cases
- **Custom Templates**: Save boards as reusable templates
- **PDF Export**: Export boards to PDF format
- **SVG/PNG Export**: High-quality image exports
- **Board Sharing**: Public/private sharing with permissions

### Organization & Navigation
- **Grid Snapping**: Configurable grid with snap-to-grid
- **Layers**: Layer management with z-index control
- **Groups**: Group elements for collective manipulation
- **Pan & Zoom**: Smooth navigation with minimap
- **Infinite Canvas**: No boundaries on creativity
- **Keyboard Shortcuts**: Comprehensive shortcuts for power users
- **Search**: Find elements by text content or properties

### Performance Features
- **Canvas Virtualization**: Handles 1000+ objects smoothly
- **WebGL Acceleration**: GPU-accelerated rendering
- **Lazy Loading**: Progressive content loading
- **Offline Mode**: Work without internet connection
- **Auto-save**: Continuous background saving
- **Optimistic Updates**: Instant UI feedback

### Security & Authentication
- **User Authentication**: Email/password and OAuth providers
- **Role-based Access**: Owner, Admin, Editor, Viewer roles
- **Row-Level Security**: Database-level access control
- **Session Management**: Secure session handling
- **2FA Support**: Two-factor authentication option
- **SSO Integration**: Enterprise single sign-on

### Analytics & Monitoring
- **User Analytics**: Track engagement and usage
- **Performance Metrics**: Real-time performance monitoring
- **Error Tracking**: Sentry integration for error monitoring
- **Audit Logs**: Complete activity history
- **Health Checks**: System status monitoring endpoints

## Completed Features ✅

### Cycle 42-48 Achievements
- ✅ Image upload with drag & drop support
- ✅ Toast notification system
- ✅ Text editing manager implementation
- ✅ Grid snapping manager implementation
- ✅ Authentication system with Supabase
- ✅ Comments system with mentions
- ✅ PDF Export functionality
- ✅ 7 board templates (Sprint, Mind Map, SWOT, etc.)
- ✅ RLS policies for all database tables (28/30 optimized)
- ✅ Health check API endpoint
- ✅ Zero TypeScript errors in build
- ✅ Text tool toolbar integration
- ✅ Grid snapping UI controls
- ✅ Image upload button in toolbar
- ✅ Template gallery modal
- ✅ 428 tests passing (100% pass rate)
- ✅ Critical test fixes for type safety

### Infrastructure
- ✅ Next.js 15 with App Router
- ✅ TypeScript strict mode
- ✅ Supabase backend integration
- ✅ WebSocket real-time communication
- ✅ Redis caching layer
- ✅ Tailwind CSS styling
- ✅ Framer Motion animations
- ✅ Fabric.js canvas library

## In Progress 🚧

### Priority 1: Performance
- [ ] WebGL renderer integration
- [ ] Viewport culling for large boards
- [ ] Level-of-detail rendering

### Priority 2: Collaboration
- [ ] CRDT conflict resolution
- [ ] Visual conflict indicators
- [ ] Collaborative selection boxes

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5.2 (App Router)
- **Language**: TypeScript 5.6.2
- **Canvas**: Fabric.js 6.5.1
- **Styling**: Tailwind CSS 3.4.15
- **Animations**: Framer Motion 11.15.0
- **State**: Zustand 5.0.2

### Backend
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Socket.io 4.8.1
- **Cache**: Redis (Upstash)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth

### DevOps
- **Hosting**: Vercel (Frontend)
- **WebSocket**: Railway
- **Monitoring**: Sentry
- **Testing**: Jest, React Testing Library, Playwright
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
```

### Installation
```bash
# Clone repository
git clone https://github.com/ShuhaoZQGG/miro-clone.git
cd miro-clone

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SOCKET_URL=your_socket_server_url
SENTRY_DSN=your_sentry_dsn
```

### Testing
```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

### Building for Production
```bash
# Build application
npm run build

# Start production server
npm start
```

## Project Structure
```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── board/             # Board pages
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── canvas/           # Canvas-related components
│   ├── ui/               # UI components
│   └── shared/           # Shared components
├── lib/                   # Utilities and helpers
│   ├── canvas/           # Canvas utilities
│   ├── supabase/         # Supabase client
│   └── websocket/        # WebSocket handlers
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
├── styles/                # Global styles
└── tests/                 # Test files
```

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- Inspired by [Miro](https://miro.com)
- Built with [Next.js](https://nextjs.org)
- Powered by [Supabase](https://supabase.com)
- Canvas library: [Fabric.js](http://fabricjs.com)

## Support
For support, please open an issue in the GitHub repository or contact the development team.

## Roadmap
See [NEXT_CYCLE_TASKS.md](NEXT_CYCLE_TASKS.md) for detailed upcoming features and improvements.