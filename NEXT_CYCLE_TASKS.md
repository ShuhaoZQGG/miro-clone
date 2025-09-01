# Next Cycle Tasks

## Completed in Previous Cycles
- ✅ Image upload feature with drag & drop (Cycle 42)
- ✅ Toast notification system (Cycle 42)
- ✅ Text editing manager implementation (Cycle 43)
- ✅ Grid snapping manager implementation (Cycle 43)
- ✅ Fixed TypeScript build errors
- ✅ Achieved 87.5% test coverage
- ✅ Template Gallery Integration (Cycle 45)
- ✅ Text Formatting Controls UI (Cycle 45)
- ✅ Grid Snapping Visual Feedback (Cycle 45)
- ✅ Upload Progress Indicators (Cycle 45)
- ✅ All Managers Connected to UI (Cycle 45)

## Priority 1: Test Infrastructure Fixes
- [ ] **Fix GridSnappingManager Mock**
  - Add `on` method to mock for event handling
  - Update test setup in ImageUploadIntegration.test.tsx
  - Ensure all manager mocks have complete interfaces

- [ ] **Clean Up Test Failures**
  - Fix remaining 25 ImageUploadIntegration test failures
  - Update outdated test mocks
  - Improve test isolation to prevent cascading failures
  - Achieve 100% test pass rate

## Priority 2: Feature Enhancements
- [ ] **Expand Template Gallery**
  - Add more pre-built templates:
    - Flowcharts
    - Mind Maps
    - Wireframes
    - SWOT Analysis
    - Kanban Boards
    - Sprint Planning
  - Allow users to save custom templates
  - Add template categories and search

- [ ] **Advanced Text Editing**
  - Font size selector (8px to 72px)
  - Font family dropdown (system fonts + Google Fonts)
  - Text color picker
  - Paragraph formatting options
  - Text alignment (left, center, right, justify)
  - Line height controls

- [ ] **E2E Testing**
  - Add Playwright tests for Template Gallery
  - Test text formatting keyboard shortcuts
  - Test grid snapping behavior
  - Test upload progress indicators
  - Test all UI integrations from Cycle 45

## Priority 3: Continue Canvas Features
- [ ] **Templates system**
  - Pre-built board templates:
    - Sprint planning board
    - Mind map template
    - User journey map
    - SWOT analysis
    - Kanban board
  - Save current board as template
  - Template gallery with preview
  - Template categories and search

- [ ] **Shape library expansion**
  - Add more shapes (star, hexagon, triangle, arrow)
  - Create shape categories
  - Implement shape search/filter
  - Custom shape creation

## Priority 4: Performance & Collaboration
- [ ] **Conflict resolution with CRDT**
  - Implement CRDT-based merge algorithms
  - Visual conflict indicators
  - Automatic resolution strategies
  
- [ ] **Canvas virtualization**
  - Viewport culling for 1000+ objects
  - Level-of-detail (LOD) rendering
  - Lazy loading of off-screen elements
  
- [ ] **WebGL acceleration**
  - Integrate with Fabric.js WebGL renderer
  - GPU-accelerated transformations
  - Performance mode toggle

## Technical Debt & Security
- [ ] **Supabase Security (from advisors)**
  - Enable leaked password protection
  - Add more MFA options (TOTP, SMS)
  - Fix RLS performance in analytics_events table
  - Fix RLS performance in billing_events table
  
- [ ] **Database Optimization**
  - Remove 14 unused indexes identified
  - Optimize query performance
  - Add missing indexes for common queries

- [ ] **Code Quality**
  - Refactor ImageUploadIntegration tests
  - Update outdated mocks
  - Remove unused dependencies
  - Code splitting for better performance

## Priority 5: Production Deployment
- [ ] **Environment Setup**
  - Install @sentry/nextjs dependency
  - Configure Sentry DSN
  - Set up Vercel deployment
  - Configure Railway for WebSocket
  
- [ ] **Monitoring & Health**
  - Create /api/health route
  - Set up uptime monitoring
  - Configure alert thresholds
  - Dashboard for metrics

## Documentation Updates
- [ ] Document TextEditingManager API
- [ ] Document GridSnappingManager API
- [ ] Update user guide with new features
- [ ] Create keyboard shortcuts documentation
- [ ] Update README with completed features
- [ ] Create comprehensive deployment checklist

## Known Issues to Address
- ImageUploadIntegration test failures (14 tests)
- E2E TypeScript errors (unrelated to features)
- Missing UI controls for text editing and grid snapping
- Performance with 100+ elements on canvas

## Success Metrics for Next Cycle
- [ ] All canvas features integrated and working
- [ ] 100% test coverage maintained
- [ ] Build time < 5 minutes
- [ ] Bundle size < 500KB gzipped
- [ ] Page load time < 2 seconds
- [ ] Zero TypeScript errors
- [ ] Production deployment successful

## Future Enhancements
- [ ] Image editing (crop, rotate, filters)
- [ ] Real-time collaborative text editing
- [ ] Advanced grid features (isometric, hexagonal)
- [ ] Export boards with all features (PDF/PNG/SVG)
- [ ] Version history with snapshots
- [ ] AI-powered content suggestions
- [ ] Mobile app development