# Next Cycle Tasks

## Immediate Fixes Required (Cycle 25)
1. **Fix TypeScript Build Error** (BLOCKING - NEW)
   - File: src/lib/canvas-engine.ts:910
   - Property 'data' does not exist on type 'CanvasElement'
   - Add proper type guard or fix CanvasElement interface
   - This is preventing build completion

2. **Stabilize Test Suite** (CRITICAL)
   - Current: 59 failures (19.3% failure rate)
   - Target: <10 failures
   - Focus areas:
     - Canvas-fullscreen test failures
     - Smooth-interactions test issues
     - FPSCounter RAF mock setup
     - Timing-related test failures

3. **Type Safety Improvements**
   - Replace remaining TypeScript 'any' usages (4 warnings)
   - Focus on canvas-engine.ts type definitions
   - Improve type definitions for canvas elements with 'data' property

## Deferred Features from Cycle 23
1. **Performance Monitoring Integration**
   - Integrate FPS counter with main Whiteboard component
   - Add performance dashboard to UI
   - Implement memory tracking features

2. **E2E Testing**
   - Full-screen canvas behavior tests
   - Performance verification tests
   - GPU acceleration validation

## Technical Debt
1. **Test Infrastructure**
   - Improve RAF mock implementation
   - Better async test utilities
   - Consistent timing expectations

2. **Code Quality**
   - Reduce ESLint warnings further
   - Improve test coverage
   - Better error handling

## Feature Enhancements (Future)
1. **Canvas Improvements**
   - WebGL renderer for large canvases
   - Worker threads for computations
   - Better zoom/pan controls
   - Canvas rulers and guides

2. **Collaboration Features**
   - Real-time cursor tracking
   - Live collaboration support
   - Conflict resolution

3. **Performance Optimizations**
   - Viewport culling
   - Layer caching
   - Batch updates
   - Object pooling

## Documentation Needs
1. **README Updates**
   - Performance monitoring usage
   - Testing guidelines
   - Development setup

2. **API Documentation**
   - Canvas engine methods
   - Event handlers
   - Component props

## Architectural Considerations (Cycle 24 Review)
1. **Complexity Management**
   - Three attempts at same features indicate complexity issues
   - Consider breaking down features into smaller, testable units
   - Review if full-screen canvas and smooth interactions should be separate cycles

2. **Test Infrastructure Investment**
   - RAF mock implementation needs comprehensive solution
   - Consider dedicated test utilities module
   - Standardize timing expectations across all tests

## Priority Order
1. Fix build error at line 910 (immediate)
2. Achieve stable build (critical)
3. Reduce test failures to <10 (high)
4. RAF mock comprehensive fix (high)
5. Type safety improvements (medium)
6. Simplify feature implementation (medium)
7. Performance monitoring completion (low)
8. Documentation (low)

## Success Criteria for Next Cycle
- ✅ Build passes without ANY errors
- ✅ <10 test failures
- ✅ Zero TypeScript build errors
- ✅ Proper RAF mock implementation
- ✅ Clear path forward (no 4th attempt needed)