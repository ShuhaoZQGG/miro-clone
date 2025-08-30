# Next Cycle Tasks

## High Priority (Critical for Production)
1. **Fix Remaining Unit Tests**
   - 42 tests currently failing
   - Most failures related to canvas mock initialization
   - Need to update mocks for async canvas initialization pattern

2. **Implement Missing Drawing Tools**
   - Line tool (causing E2E test timeout)
   - Freehand drawing tool (causing E2E test timeout)
   - Both tools are expected by existing E2E tests

## Medium Priority (Quality Improvements)
3. **Address TypeScript Type Safety**
   - Fix 50+ ESLint warnings about `any` types
   - Improve type definitions for Fabric.js objects
   - Add proper typing for event handlers

4. **E2E Test Investigation**
   - Debug timeout issues in E2E tests
   - Add retry logic for flaky tests
   - Improve test stability with better wait conditions

5. **Performance Monitoring**
   - Add FPS tracking for canvas operations
   - Monitor memory usage during long sessions
   - Implement performance benchmarks

## Low Priority (Nice to Have)
6. **Developer Experience**
   - Fix port conflict (currently using 3003 instead of 3000)
   - Add hot reload for canvas changes
   - Improve error messages in development

7. **Documentation**
   - Document canvas lifecycle management approach
   - Add troubleshooting guide for common issues
   - Create performance optimization guide

## Technical Debt
- Refactor canvas disposal tests to use proper async patterns
- Consolidate duplicate test setup code
- Review and optimize bundle size
- Add integration tests for real-time collaboration

## Feature Enhancements (Future Cycles)
- Add canvas zoom controls UI
- Implement element grouping
- Add keyboard shortcuts for all tools
- Implement copy/paste functionality
- Add element alignment guides
- Implement smart connectors between elements

## Infrastructure
- Set up CI/CD pipeline with test automation
- Configure automated dependency updates
- Add monitoring and error tracking
- Implement feature flags for gradual rollout

## Notes
- Canvas refresh loop has been fixed (Cycle 16)
- Viewport metadata warning resolved (Cycle 16)
- Build is stable with no errors
- 81% unit test pass rate achieved