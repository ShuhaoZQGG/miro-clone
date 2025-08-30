# Cycle 22: Architectural Plan

## Vision
Continue improving the Miro board project to address remaining features and quality issues. Focus on test stability, performance monitoring, and code quality improvements.

## Current State Analysis

### Achievements (Cycle 21)
- ✅ Canvas fills 100% viewport (fixed inset-0)
- ✅ Smooth 60fps interactions with RAF loop
- ✅ Momentum physics for drag operations
- ✅ Ghost preview for element creation
- ✅ Pinch zoom gesture support
- ✅ Auto-quality adjustment

### Outstanding Issues
- 64 failing tests (timing/mock issues)
- Missing E2E tests for full-screen behavior
- No performance monitoring dashboard
- ESLint 'any' type warnings

## Requirements

### Functional Requirements
1. **Test Stability** (Priority 1)
   - Fix 64 failing unit tests
   - Resolve timing issues in performance tests
   - Improve RAF mock setup

2. **E2E Testing** (Priority 2)
   - Full-screen canvas behavior tests
   - Canvas resize responsiveness tests
   - 60fps performance verification
   - GPU acceleration tests

3. **Performance Monitoring** (Priority 3)
   - Dev mode FPS counter
   - Performance metrics collection
   - Memory usage tracking
   - Dashboard implementation

### Non-Functional Requirements
- Maintain 60fps during interactions
- < 10ms input latency
- 100% test pass rate
- Zero TypeScript errors
- Clean ESLint output

## Architecture

### Component Structure
```
src/
├── components/
│   ├── Whiteboard.tsx (existing)
│   └── PerformanceMonitor.tsx (new)
├── lib/
│   ├── canvas-engine.ts (existing)
│   ├── utils.ts (existing)
│   └── performance-tracker.ts (new)
└── tests/
    ├── unit/ (fix existing)
    └── e2e/ (add new)
```

### Technical Stack
- **Framework**: Next.js 14 + TypeScript
- **Canvas**: Fabric.js with RAF optimization
- **Testing**: Jest + React Testing Library + Playwright
- **Performance**: Web Performance API + Custom metrics

## Implementation Phases

### Phase 1: Test Fixes (2 days)
1. Fix timing issues in unit tests
2. Improve mock setup for RAF/async
3. Adjust unrealistic timing expectations
4. Achieve 100% test pass rate

### Phase 2: E2E Testing (1 day)
1. Create full-screen canvas tests
2. Add resize responsiveness tests
3. Verify 60fps in E2E scenarios
4. Test GPU acceleration

### Phase 3: Performance Monitoring (1 day)
1. Build FPS counter component
2. Implement metrics collection
3. Create monitoring dashboard
4. Add memory tracking

### Phase 4: Code Quality (1 day)
1. Fix ESLint warnings
2. Improve type safety
3. Document performance strategies
4. Update README

## Risk Analysis

### Technical Risks
1. **Test Timing Issues**
   - Risk: Flaky tests in CI
   - Mitigation: Use proper async utilities, increase timeouts

2. **Performance Regression**
   - Risk: New features impact 60fps
   - Mitigation: Automated performance tests, benchmarks

### Schedule Risks
1. **Scope Creep**
   - Risk: Adding features beyond test/monitoring
   - Mitigation: Strict focus on quality improvements

## Success Metrics
- ✅ 100% unit test pass rate
- ✅ 95%+ E2E test pass rate
- ✅ Consistent 60fps in performance tests
- ✅ Zero TypeScript errors
- ✅ < 50 ESLint warnings
- ✅ Performance dashboard deployed

## Next Cycle Considerations
- WebGL renderer for large canvases
- Worker threads for computations
- Real-time collaboration features
- Canvas rulers and guides

## Decision Points
- Use existing test infrastructure vs upgrade
- Custom performance tracker vs third-party
- Dashboard as separate app vs integrated

## Timeline
- Day 1-2: Test fixes
- Day 3: E2E testing
- Day 4: Performance monitoring
- Day 5: Code quality + documentation