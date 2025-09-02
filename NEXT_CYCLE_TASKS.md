# Next Cycle Tasks

## Immediate Fixes Required (Cycle 48 Revision)
1. **Fix TypeScript Build Error**
   - Add 'awareness-changed' to CanvasEngineEvents interface in canvas-engine.ts
   - Add all CRDT-related event types
   - Ensure proper typing for event handlers

2. **Fix Performance Stats**
   - Initialize performance stats properly in canvas-engine
   - Ensure getPerformanceStats() always returns valid numbers
   - Add null/undefined checks

3. **Fix Failing Tests**
   - Fix 8 failing tests in smooth-interactions.test.ts
   - Ensure FPS calculations work correctly
   - Verify all test assertions have valid data

## After Fixes Approved

### Priority 2: UI/UX Enhancements
- [ ] Advanced collaboration cursors with names
- [ ] User presence indicators
- [ ] Template system implementation
- [ ] Export functionality (PNG, SVG, PDF)
- [ ] Mobile responsiveness

### Priority 3: Backend Improvements
- [ ] Enable leaked password protection in Supabase Auth
- [ ] Add more MFA options (TOTP, SMS)
- [ ] Implement audit logging
- [ ] Add performance monitoring endpoints

### Technical Debt
- [ ] Improve test coverage to 95%+
- [ ] Add E2E tests for performance features
- [ ] Documentation for WebGL and CRDT features
- [ ] Performance tuning guide

### Known Issues
- Auth security warnings need addressing
- Need production deployment configuration
- Performance monitoring in production environment