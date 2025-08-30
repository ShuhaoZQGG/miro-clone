# Cycle 16: Fix E2E Tests and Canvas Refresh Issues

## Executive Summary
Cycle 16 focuses on fixing two critical issues blocking production deployment:
1. Two failing E2E tests
2. Canvas refresh loop causing performance issues and DOM errors

## Current Issues Analysis

### Issue 1: Failing E2E Tests
- **Status:** 2 tests failing (down from previous cycles)
- **Root Cause:** Likely route configuration or loading state issues
- **Impact:** Cannot validate canvas disposal fix

### Issue 2: Canvas Refresh Loop
- **Symptoms:**
  - Window keeps refreshing when entering board
  - Multiple canvas disposal errors in console
  - Performance degradation from repeated re-renders
- **Error Details:**
  ```
  canvas-engine.ts:725 Error disposing fabric canvas: NotFoundError: 
  Failed to execute removeChild on Node: The node to be removed is not a child of this node
  ```
- **Root Cause:** useEffect cleanup triggering unnecessary re-renders

### Issue 3: Metadata Warning
- **Warning:** Viewport metadata in wrong export location
- **Fix:** Move viewport from metadata export to viewport export in /board/[boardId]

## Requirements

### Functional Requirements
1. Fix 2 failing E2E tests
2. Resolve canvas refresh loop
3. Fix viewport metadata warning
4. Ensure stable canvas lifecycle management

### Non-Functional Requirements
- Performance: 60fps with no refresh loops
- Stability: Zero canvas disposal errors
- Test Coverage: 100% E2E tests passing
- Build: Clean compilation with no warnings

## Architecture & Technical Approach

### Canvas Lifecycle Fix
```typescript
// Problem: useEffect cleanup causing re-renders
useEffect(() => {
  // Canvas initialization
  return () => {
    // Cleanup triggering refresh
  };
}, [deps]); // Dependency array issues

// Solution: Proper cleanup with ref tracking
const isDisposing = useRef(false);
useEffect(() => {
  if (isDisposing.current) return;
  // Initialize
  return () => {
    isDisposing.current = true;
    // Safe cleanup
  };
}, [boardId]); // Stable dependencies
```

### E2E Test Strategy
1. Debug test failures with verbose logging
2. Fix route navigation issues
3. Add proper wait conditions
4. Validate canvas stability

## Implementation Plan

### Phase 1: Immediate Fixes (2 hours)
1. **Fix Viewport Metadata Warning**
   - Move viewport from metadata to viewport export
   - Location: app/board/[boardId]/page.tsx
   
2. **Debug E2E Test Failures**
   - Run tests with debug mode
   - Identify specific failure points
   - Fix navigation/timing issues

### Phase 2: Canvas Refresh Fix (3 hours)
1. **Analyze useCanvas Hook**
   - Review dependency array
   - Track re-render causes
   - Add logging for lifecycle events

2. **Implement Stable Cleanup**
   - Use ref to track disposal state
   - Prevent multiple disposal attempts
   - Ensure single initialization

3. **Fix DOM Removal Error**
   - Add parent existence check
   - Implement safe removal pattern
   - Handle edge cases gracefully

### Phase 3: Testing & Validation (1 hour)
1. **E2E Test Suite**
   - Run full test suite
   - Verify all tests pass
   - Check canvas disposal scenarios

2. **Manual Testing**
   - Test board navigation
   - Verify no refresh loops
   - Check console for errors

3. **Performance Testing**
   - Monitor FPS during board usage
   - Check memory usage
   - Validate no memory leaks

## Success Criteria
- ✅ All E2E tests passing (100%)
- ✅ No canvas refresh loops
- ✅ Zero canvas disposal errors
- ✅ Clean build with no warnings
- ✅ Stable 60fps performance

## Risk Mitigation
- **Risk:** useEffect dependency changes break functionality
- **Mitigation:** Comprehensive testing after each change

- **Risk:** Canvas disposal fix causes memory leaks
- **Mitigation:** Monitor memory usage, use Chrome DevTools

- **Risk:** E2E test fixes are flaky
- **Mitigation:** Add proper wait conditions, retry logic

## Technical Implementation Details

### File Changes Required
1. `app/board/[boardId]/page.tsx` - Fix viewport export
2. `src/hooks/useCanvas.ts` - Fix refresh loop
3. `src/lib/canvas-engine.ts` - Improve disposal safety
4. `e2e/` test files - Fix failing tests

### Testing Approach
- Unit tests for canvas lifecycle
- Integration tests for board navigation
- E2E tests for full user flows
- Performance monitoring

## Timeline
- **Total Duration:** 6 hours
- **Phase 1:** 2 hours (Immediate fixes)
- **Phase 2:** 3 hours (Canvas refresh fix)
- **Phase 3:** 1 hour (Testing & validation)

## Dependencies
- Existing canvas engine implementation
- Playwright test infrastructure
- Next.js 15.5.2 framework

## Deliverables
1. Fixed E2E tests (100% passing)
2. Stable canvas without refresh loops
3. Clean console (no errors/warnings)
4. Updated documentation
5. PR ready for merge