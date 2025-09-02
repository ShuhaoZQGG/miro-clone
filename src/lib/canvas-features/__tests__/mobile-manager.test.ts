import { MobileManager } from '../mobile-manager';

describe('MobileManager', () => {
  let manager: MobileManager;
  let mockCanvas: any;
  let global.window: any;

  beforeEach(() => {
    mockCanvas = {
      setWidth: jest.fn(),
      setHeight: jest.fn(),
      setZoom: jest.fn(),
      getZoom: jest.fn(() => 1),
      renderAll: jest.fn(),
      getPointer: jest.fn((e) => ({ x: 100, y: 100 })),
      findTarget: jest.fn(),
      setActiveObject: jest.fn(),
      discardActiveObject: jest.fn(),
      getActiveObject: jest.fn(),
      getObjects: jest.fn(() => []),
      absolutePan: jest.fn(),
      relativePan: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      fire: jest.fn(),
      getElement: jest.fn(() => document.createElement('canvas')),
      upperCanvasEl: document.createElement('canvas')
    };

    global.window = {
      innerWidth: 1024,
      innerHeight: 768,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      matchMedia: jest.fn((query: string) => ({
        matches: false,
        addListener: jest.fn(),
        removeListener: jest.fn()
      }))
    };

    global.window = global.window as any;
    global.navigator = {
      maxTouchPoints: 0,
      userAgent: 'Mozilla/5.0'
    } as any;

    manager = new MobileManager(mockCanvas);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Device Detection', () => {
    it('should detect mobile devices', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true
      });
      manager = new MobileManager(mockCanvas);
      
      expect(manager.isMobile()).toBe(true);
      expect(manager.isTablet()).toBe(false);
      expect(manager.isDesktop()).toBe(false);
    });

    it('should detect tablet devices', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true
      });
      manager = new MobileManager(mockCanvas);
      
      expect(manager.isMobile()).toBe(false);
      expect(manager.isTablet()).toBe(true);
      expect(manager.isDesktop()).toBe(false);
    });

    it('should detect desktop devices', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
        configurable: true
      });
      manager = new MobileManager(mockCanvas);
      
      expect(manager.isMobile()).toBe(false);
      expect(manager.isTablet()).toBe(false);
      expect(manager.isDesktop()).toBe(true);
    });

    it('should detect touch capability', () => {
      Object.defineProperty(global.navigator, 'maxTouchPoints', {
        value: 5,
        writable: true,
        configurable: true
      });
      manager = new MobileManager(mockCanvas);
      
      expect(manager.hasTouch()).toBe(true);
    });

    it('should detect orientation', () => {
      // Test portrait orientation
      global.window.innerWidth = 768;
      global.window.innerHeight = 1024;
      
      expect(manager.getOrientation()).toBe('portrait');
      
      // Test landscape orientation
      global.window.innerWidth = 1024;
      global.window.innerHeight = 768;
      
      expect(manager.getOrientation()).toBe('landscape');
    });
  });

  describe('Responsive Canvas', () => {
    it('should resize canvas on window resize', () => {
      global.window.innerWidth = 375;
      global.window.innerHeight = 667;
      
      manager.handleResize();
      
      expect(mockCanvas.setWidth).toHaveBeenCalledWith(375);
      expect(mockCanvas.setHeight).toHaveBeenCalled();
      expect(mockCanvas.renderAll).toHaveBeenCalled();
    });

    it('should maintain aspect ratio when resizing', () => {
      manager.setMaintainAspectRatio(true);
      
      global.window.innerWidth = 375;
      global.window.innerHeight = 812;
      
      manager.handleResize();
      
      // Verify aspect ratio is maintained
      expect(mockCanvas.setWidth).toHaveBeenCalled();
      expect(mockCanvas.setHeight).toHaveBeenCalled();
    });

    it('should apply breakpoint-specific settings', () => {
      // Mobile breakpoint
      global.window.innerWidth = 375;
      manager.handleResize();
      
      const mobileSettings = manager.getCurrentBreakpointSettings();
      expect(mobileSettings.showToolbar).toBe(false);
      expect(mobileSettings.showSidebar).toBe(false);
      
      // Tablet breakpoint
      global.window.innerWidth = 768;
      manager.handleResize();
      
      const tabletSettings = manager.getCurrentBreakpointSettings();
      expect(tabletSettings.showToolbar).toBe(true);
      expect(tabletSettings.showSidebar).toBe(false);
      
      // Desktop breakpoint
      global.window.innerWidth = 1920;
      manager.handleResize();
      
      const desktopSettings = manager.getCurrentBreakpointSettings();
      expect(desktopSettings.showToolbar).toBe(true);
      expect(desktopSettings.showSidebar).toBe(true);
    });
  });

  describe('Touch Gestures', () => {
    it('should handle single touch tap', () => {
      const touchEvent = {
        touches: [{ clientX: 100, clientY: 100, identifier: 0 }],
        preventDefault: jest.fn()
      };
      
      manager.handleTouchStart(touchEvent as any);
      manager.handleTouchEnd(touchEvent as any);
      
      expect(mockCanvas.getPointer).toHaveBeenCalled();
      expect(mockCanvas.findTarget).toHaveBeenCalled();
    });

    it('should handle pinch zoom', () => {
      const initialZoom = mockCanvas.getZoom();
      
      const touchStartEvent = {
        touches: [
          { clientX: 100, clientY: 100, identifier: 0 },
          { clientX: 200, clientY: 200, identifier: 1 }
        ],
        preventDefault: jest.fn()
      };
      
      const touchMoveEvent = {
        touches: [
          { clientX: 50, clientY: 50, identifier: 0 },
          { clientX: 250, clientY: 250, identifier: 1 }
        ],
        preventDefault: jest.fn()
      };
      
      manager.handleTouchStart(touchStartEvent as any);
      manager.handleTouchMove(touchMoveEvent as any);
      
      expect(mockCanvas.setZoom).toHaveBeenCalled();
    });

    it('should handle pan gesture', () => {
      const touchStartEvent = {
        touches: [{ clientX: 100, clientY: 100, identifier: 0 }],
        preventDefault: jest.fn()
      };
      
      const touchMoveEvent = {
        touches: [{ clientX: 150, clientY: 150, identifier: 0 }],
        preventDefault: jest.fn()
      };
      
      manager.handleTouchStart(touchStartEvent as any);
      manager.handleTouchMove(touchMoveEvent as any);
      
      expect(mockCanvas.relativePan).toHaveBeenCalled();
    });

    it('should handle rotate gesture', () => {
      mockCanvas.getActiveObject = jest.fn(() => ({
        angle: 0,
        setAngle: jest.fn(),
        setCoords: jest.fn()
      }));
      
      const touchStartEvent = {
        touches: [
          { clientX: 100, clientY: 100, identifier: 0 },
          { clientX: 200, clientY: 100, identifier: 1 }
        ],
        preventDefault: jest.fn()
      };
      
      const touchMoveEvent = {
        touches: [
          { clientX: 100, clientY: 100, identifier: 0 },
          { clientX: 100, clientY: 200, identifier: 1 }
        ],
        preventDefault: jest.fn()
      };
      
      manager.handleTouchStart(touchStartEvent as any);
      manager.handleTouchMove(touchMoveEvent as any);
      
      const activeObject = mockCanvas.getActiveObject();
      expect(activeObject.setAngle).toHaveBeenCalled();
    });

    it('should handle long press', (done) => {
      const touchStartEvent = {
        touches: [{ clientX: 100, clientY: 100, identifier: 0 }],
        preventDefault: jest.fn()
      };
      
      const onLongPress = jest.fn();
      manager.on('longpress', onLongPress);
      
      manager.handleTouchStart(touchStartEvent as any);
      
      setTimeout(() => {
        expect(onLongPress).toHaveBeenCalled();
        done();
      }, 600);
    });

    it('should handle swipe gestures', () => {
      const onSwipe = jest.fn();
      manager.on('swipe', onSwipe);
      
      const touchStartEvent = {
        touches: [{ clientX: 100, clientY: 100, identifier: 0 }],
        timeStamp: 1000,
        preventDefault: jest.fn()
      };
      
      const touchEndEvent = {
        changedTouches: [{ clientX: 300, clientY: 100, identifier: 0 }],
        timeStamp: 1200,
        preventDefault: jest.fn()
      };
      
      manager.handleTouchStart(touchStartEvent as any);
      manager.handleTouchEnd(touchEndEvent as any);
      
      expect(onSwipe).toHaveBeenCalledWith(expect.objectContaining({
        direction: 'right',
        velocity: expect.any(Number)
      }));
    });
  });

  describe('Mobile UI Adaptations', () => {
    it('should show mobile toolbar', () => {
      manager.showMobileToolbar();
      
      expect(manager.isMobileToolbarVisible()).toBe(true);
    });

    it('should hide mobile toolbar', () => {
      manager.showMobileToolbar();
      manager.hideMobileToolbar();
      
      expect(manager.isMobileToolbarVisible()).toBe(false);
    });

    it('should toggle mobile menu', () => {
      manager.toggleMobileMenu();
      expect(manager.isMobileMenuOpen()).toBe(true);
      
      manager.toggleMobileMenu();
      expect(manager.isMobileMenuOpen()).toBe(false);
    });

    it('should adapt UI for different screen sizes', () => {
      // Small mobile
      global.window.innerWidth = 320;
      manager.adaptUIForScreenSize();
      
      let ui = manager.getUIConfiguration();
      expect(ui.toolbarPosition).toBe('bottom');
      expect(ui.toolbarSize).toBe('compact');
      
      // Large mobile
      global.window.innerWidth = 414;
      manager.adaptUIForScreenSize();
      
      ui = manager.getUIConfiguration();
      expect(ui.toolbarPosition).toBe('bottom');
      expect(ui.toolbarSize).toBe('normal');
      
      // Tablet
      global.window.innerWidth = 768;
      manager.adaptUIForScreenSize();
      
      ui = manager.getUIConfiguration();
      expect(ui.toolbarPosition).toBe('top');
      expect(ui.sidebarPosition).toBe('left');
    });
  });

  describe('Performance Optimizations', () => {
    it('should throttle touch move events', () => {
      const touchMoveEvent = {
        touches: [{ clientX: 100, clientY: 100, identifier: 0 }],
        preventDefault: jest.fn()
      };
      
      // Fire multiple touch move events rapidly
      for (let i = 0; i < 10; i++) {
        manager.handleTouchMove(touchMoveEvent as any);
      }
      
      // Should be throttled
      expect(mockCanvas.relativePan).toHaveBeenCalledTimes(1);
    });

    it('should reduce canvas quality on low-end devices', () => {
      manager.enablePerformanceMode();
      
      const settings = manager.getPerformanceSettings();
      expect(settings.enableRetina).toBe(false);
      expect(settings.renderOnAddRemove).toBe(false);
      expect(settings.skipTargetFind).toBe(true);
    });

    it('should optimize rendering for mobile', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true
      });
      manager = new MobileManager(mockCanvas);
      
      manager.optimizeForMobile();
      
      const settings = manager.getRenderingSettings();
      expect(settings.enableRetinaScaling).toBe(false);
      expect(settings.renderDuringPan).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should provide touch target size recommendations', () => {
      const minSize = manager.getMinimumTouchTargetSize();
      
      expect(minSize.width).toBeGreaterThanOrEqual(44);
      expect(minSize.height).toBeGreaterThanOrEqual(44);
    });

    it('should handle focus management for mobile', () => {
      const element = { focus: jest.fn() };
      manager.setFocusableElement(element as any);
      
      manager.focusCanvas();
      
      expect(element.focus).toHaveBeenCalled();
    });

    it('should provide haptic feedback options', () => {
      global.navigator.vibrate = jest.fn();
      
      manager.provideHapticFeedback('selection');
      expect(global.navigator.vibrate).toHaveBeenCalledWith(10);
      
      manager.provideHapticFeedback('success');
      expect(global.navigator.vibrate).toHaveBeenCalledWith([10, 10, 10]);
      
      manager.provideHapticFeedback('error');
      expect(global.navigator.vibrate).toHaveBeenCalledWith([50, 50, 50]);
    });
  });

  describe('Orientation Changes', () => {
    it('should handle orientation change', () => {
      const onOrientationChange = jest.fn();
      manager.on('orientationchange', onOrientationChange);
      
      // Simulate orientation change
      global.window.innerWidth = 812;
      global.window.innerHeight = 375;
      
      const event = new Event('orientationchange');
      window.dispatchEvent(event);
      
      expect(onOrientationChange).toHaveBeenCalledWith({
        orientation: 'landscape'
      });
    });

    it('should lock orientation when needed', () => {
      const mockScreen = {
        orientation: {
          lock: jest.fn(() => Promise.resolve())
        }
      };
      
      global.screen = mockScreen as any;
      
      manager.lockOrientation('portrait');
      
      expect(mockScreen.orientation.lock).toHaveBeenCalledWith('portrait');
    });
  });

  describe('Mobile Context Menu', () => {
    it('should show context menu on long press', () => {
      const onContextMenu = jest.fn();
      manager.on('contextmenu', onContextMenu);
      
      const touchEvent = {
        touches: [{ clientX: 100, clientY: 100, identifier: 0 }],
        preventDefault: jest.fn()
      };
      
      manager.handleLongPress(touchEvent as any);
      
      expect(onContextMenu).toHaveBeenCalledWith({
        x: 100,
        y: 100,
        target: expect.any(Object)
      });
    });

    it('should position context menu appropriately', () => {
      const menu = manager.createContextMenu({
        x: 350,
        y: 600,
        items: ['Cut', 'Copy', 'Paste']
      });
      
      // Menu should be repositioned to fit on screen
      expect(menu.x).toBeLessThanOrEqual(global.window.innerWidth - 150);
      expect(menu.y).toBeLessThanOrEqual(global.window.innerHeight - 200);
    });
  });

  describe('Cleanup', () => {
    it('should remove all event listeners on destroy', () => {
      manager.destroy();
      
      expect(global.window.removeEventListener).toHaveBeenCalled();
      expect(mockCanvas.off).toHaveBeenCalled();
    });
  });
});