# Next Cycle Tasks

## Completed in Cycle 43
- ✅ Image upload feature with drag & drop
- ✅ Fixed TypeScript build errors
- ✅ Achieved 99.4% test coverage

## Priority 1: Canvas Feature Integration
- [ ] Integrate ImageUploadManager with existing Whiteboard component
- [ ] Add toolbar button for image upload
- [ ] Create file input UI component
- [ ] Wire up event handlers to canvas
- [ ] Add visual feedback for drag operations

## Priority 2: Continue Canvas Features
- [ ] **Text editing improvements**
  - Rich text support with formatting options
  - Font family and size selection
  - Text alignment and line spacing
  - Inline text editing on canvas
  
- [ ] **Grid snapping feature**
  - Configurable grid sizes (8px, 16px, 32px)
  - Snap-to-grid toggle in toolbar
  - Visual grid overlay with opacity control
  - Smart guides for alignment
  
- [ ] **Templates system**
  - Pre-built board templates (Kanban, Mind Map, etc.)
  - Save current board as template
  - Template gallery with preview
  - Template categories and search

## Priority 3: Performance & Collaboration
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

- [ ] **Test Coverage**
  - Fix 2 failing tests in canvas-engine.test.ts
  - Add integration tests for image upload
  - Performance testing with large files
  - Mobile device testing

## Priority 4: Production Deployment
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

## Future Enhancements
- [ ] Image editing (crop, rotate, filters)
- [ ] Image optimization/compression on upload
- [ ] Cloud storage integration (S3/Cloudinary)
- [ ] Real-time collaborative image editing
- [ ] Export boards with images (PDF/PNG/SVG)
- [ ] Version history with image snapshots
- [ ] AI-powered image suggestions

## Documentation Updates
- [ ] Update user guide with image upload instructions
- [ ] Document ImageUploadManager API
- [ ] Add performance best practices guide
- [ ] Create comprehensive deployment checklist
- [ ] Update README with new features

## Success Metrics for Next Cycle
- [ ] All canvas features integrated and working
- [ ] 100% test coverage maintained
- [ ] Build time < 5 minutes
- [ ] Bundle size < 500KB gzipped
- [ ] Page load time < 2 seconds
- [ ] Zero TypeScript errors
- [ ] Production deployment successful