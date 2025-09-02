import { fabric } from 'fabric';
import { EventEmitter } from 'events';

export interface TouchPoint {
  x: number;
  y: number;
  identifier: number;
  timestamp: number;
}

export interface GestureState {
  type: 'tap' | 'pan' | 'pinch' | 'rotate' | 'swipe' | 'longpress';
  startTouches: TouchPoint[];
  currentTouches: TouchPoint[];
  startTime: number;
  lastDistance?: number;
  lastAngle?: number;
}

export interface BreakpointSettings {
  showToolbar: boolean;
  showSidebar: boolean;
  toolbarPosition: 'top' | 'bottom';
  sidebarPosition: 'left' | 'right';
  compactMode: boolean;
}

export interface UIConfiguration {
  toolbarPosition: 'top' | 'bottom';
  toolbarSize: 'compact' | 'normal' | 'large';
  sidebarPosition?: 'left' | 'right';
  showLabels: boolean;
  touchTargetSize: number;
}

export interface PerformanceSettings {
  enableRetina: boolean;
  renderOnAddRemove: boolean;
  skipTargetFind: boolean;
  enableRetinaScaling?: boolean;
  renderDuringPan?: boolean;
}

export class MobileManager extends EventEmitter {
  private canvas: fabric.Canvas;
  private gestureState: GestureState | null = null;
  private longPressTimer: NodeJS.Timeout | null = null;
  private throttleTimer: NodeJS.Timeout | null = null;
  private mobileToolbarVisible: boolean = false;
  private mobileMenuOpen: boolean = false;
  private focusableElement: HTMLElement | null = null;
  private maintainAspectRatio: boolean = false;
  private performanceMode: boolean = false;
  private currentBreakpoint: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  
  private readonly LONG_PRESS_DURATION = 500;
  private readonly SWIPE_THRESHOLD = 50;
  private readonly PINCH_THRESHOLD = 10;
  private readonly THROTTLE_DELAY = 16; // ~60fps
  
  private readonly breakpoints = {
    mobile: 640,
    tablet: 1024,
    desktop: Infinity
  };

  constructor(canvas: fabric.Canvas) {
    super();
    this.canvas = canvas;
    this.initialize();
  }

  private initialize(): void {
    this.detectDevice();
    this.setupEventListeners();
    this.adaptUIForScreenSize();
    
    if (this.isMobile() || this.isTablet()) {
      this.optimizeForMobile();
    }
  }

  private setupEventListeners(): void {
    // Touch events
    this.canvas.wrapperEl.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.canvas.wrapperEl.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.canvas.wrapperEl.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
    this.canvas.wrapperEl.addEventListener('touchcancel', this.onTouchCancel.bind(this), { passive: false });
    
    // Window events
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('orientationchange', this.onOrientationChange.bind(this));
  }

  private detectDevice(): void {
    const width = window.innerWidth;
    
    if (width <= this.breakpoints.mobile) {
      this.currentBreakpoint = 'mobile';
    } else if (width <= this.breakpoints.tablet) {
      this.currentBreakpoint = 'tablet';
    } else {
      this.currentBreakpoint = 'desktop';
    }
  }

  isMobile(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return /iphone|android|webos|blackberry|windows phone/i.test(userAgent) &&
           !/ipad|tablet/i.test(userAgent);
  }

  isTablet(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return /ipad|tablet|kindle|silk/i.test(userAgent);
  }

  isDesktop(): boolean {
    return !this.isMobile() && !this.isTablet();
  }

  hasTouch(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  getOrientation(): 'portrait' | 'landscape' {
    return window.innerWidth < window.innerHeight ? 'portrait' : 'landscape';
  }

  handleResize(): void {
    this.detectDevice();
    
    const width = window.innerWidth;
    const height = window.innerHeight - this.getToolbarHeight();
    
    if (this.maintainAspectRatio) {
      const aspectRatio = this.canvas.getWidth() / this.canvas.getHeight();
      const newHeight = width / aspectRatio;
      
      if (newHeight <= height) {
        this.canvas.setWidth(width);
        this.canvas.setHeight(newHeight);
      } else {
        this.canvas.setWidth(height * aspectRatio);
        this.canvas.setHeight(height);
      }
    } else {
      this.canvas.setWidth(width);
      this.canvas.setHeight(height);
    }
    
    this.canvas.renderAll();
    this.adaptUIForScreenSize();
  }

  private getToolbarHeight(): number {
    if (this.currentBreakpoint === 'mobile') {
      return this.mobileToolbarVisible ? 60 : 0;
    }
    return 50;
  }

  setMaintainAspectRatio(maintain: boolean): void {
    this.maintainAspectRatio = maintain;
  }

  getCurrentBreakpointSettings(): BreakpointSettings {
    switch (this.currentBreakpoint) {
      case 'mobile':
        return {
          showToolbar: false,
          showSidebar: false,
          toolbarPosition: 'bottom',
          sidebarPosition: 'left',
          compactMode: true
        };
      case 'tablet':
        return {
          showToolbar: true,
          showSidebar: false,
          toolbarPosition: 'top',
          sidebarPosition: 'left',
          compactMode: true
        };
      default:
        return {
          showToolbar: true,
          showSidebar: true,
          toolbarPosition: 'top',
          sidebarPosition: 'left',
          compactMode: false
        };
    }
  }

  handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    
    const touches = this.getTouchPoints(e.touches);
    
    this.gestureState = {
      type: touches.length === 1 ? 'tap' : 'pinch',
      startTouches: touches,
      currentTouches: touches,
      startTime: Date.now()
    };
    
    if (touches.length === 1) {
      this.startLongPressTimer(e);
    } else if (touches.length === 2) {
      this.gestureState.lastDistance = this.getDistance(touches[0], touches[1]);
      this.gestureState.lastAngle = this.getAngle(touches[0], touches[1]);
    }
  }

  handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    
    if (!this.gestureState) return;
    
    // Throttle touch move events
    if (this.throttleTimer) return;
    
    this.throttleTimer = setTimeout(() => {
      this.throttleTimer = null;
    }, this.THROTTLE_DELAY);
    
    this.cancelLongPress();
    
    const touches = this.getTouchPoints(e.touches);
    this.gestureState.currentTouches = touches;
    
    if (touches.length === 1 && this.gestureState.startTouches.length === 1) {
      this.handlePan(touches[0], this.gestureState.startTouches[0]);
    } else if (touches.length === 2) {
      this.handlePinchAndRotate(touches);
    }
  }

  handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    
    if (!this.gestureState) return;
    
    this.cancelLongPress();
    
    const endTime = Date.now();
    const duration = endTime - this.gestureState.startTime;
    
    if (this.gestureState.startTouches.length === 1 && duration < 200) {
      const touch = this.gestureState.startTouches[0];
      const endTouch = e.changedTouches[0];
      
      const distance = Math.sqrt(
        Math.pow(endTouch.clientX - touch.x, 2) +
        Math.pow(endTouch.clientY - touch.y, 2)
      );
      
      if (distance > this.SWIPE_THRESHOLD) {
        this.handleSwipe(touch, {
          x: endTouch.clientX,
          y: endTouch.clientY,
          identifier: endTouch.identifier,
          timestamp: endTime
        }, duration);
      } else {
        this.handleTap(touch);
      }
    }
    
    this.gestureState = null;
  }

  private onTouchStart(e: TouchEvent): void {
    this.handleTouchStart(e);
  }

  private onTouchMove(e: TouchEvent): void {
    this.handleTouchMove(e);
  }

  private onTouchEnd(e: TouchEvent): void {
    this.handleTouchEnd(e);
  }

  private onTouchCancel(e: TouchEvent): void {
    this.cancelLongPress();
    this.gestureState = null;
  }

  private onResize(): void {
    this.handleResize();
  }

  private onOrientationChange(): void {
    const orientation = this.getOrientation();
    this.emit('orientationchange', { orientation });
    this.handleResize();
  }

  private getTouchPoints(touches: TouchList): TouchPoint[] {
    const points: TouchPoint[] = [];
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      points.push({
        x: touch.clientX,
        y: touch.clientY,
        identifier: touch.identifier,
        timestamp: Date.now()
      });
    }
    return points;
  }

  private getDistance(p1: TouchPoint, p2: TouchPoint): number {
    return Math.sqrt(
      Math.pow(p2.x - p1.x, 2) + 
      Math.pow(p2.y - p1.y, 2)
    );
  }

  private getAngle(p1: TouchPoint, p2: TouchPoint): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
  }

  private startLongPressTimer(e: TouchEvent): void {
    this.longPressTimer = setTimeout(() => {
      if (this.gestureState && this.gestureState.startTouches.length === 1) {
        this.handleLongPress(e);
        this.emit('longpress', {
          x: this.gestureState.startTouches[0].x,
          y: this.gestureState.startTouches[0].y
        });
      }
    }, this.LONG_PRESS_DURATION);
  }

  private cancelLongPress(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private handleTap(touch: TouchPoint): void {
    const pointer = this.canvas.getPointer({ clientX: touch.x, clientY: touch.y } as any);
    const target = this.canvas.findTarget({ clientX: touch.x, clientY: touch.y } as any);
    
    if (target) {
      this.canvas.setActiveObject(target);
    } else {
      this.canvas.discardActiveObject();
    }
    
    this.canvas.renderAll();
  }

  private handlePan(current: TouchPoint, start: TouchPoint): void {
    const deltaX = current.x - start.x;
    const deltaY = current.y - start.y;
    
    this.canvas.relativePan({ x: deltaX, y: deltaY });
    this.canvas.renderAll();
  }

  private handlePinchAndRotate(touches: TouchPoint[]): void {
    if (!this.gestureState || touches.length !== 2) return;
    
    const currentDistance = this.getDistance(touches[0], touches[1]);
    const currentAngle = this.getAngle(touches[0], touches[1]);
    
    // Handle pinch zoom
    if (this.gestureState.lastDistance) {
      const scale = currentDistance / this.gestureState.lastDistance;
      const currentZoom = this.canvas.getZoom();
      const newZoom = currentZoom * scale;
      
      this.canvas.setZoom(Math.min(Math.max(newZoom, 0.1), 10));
      this.gestureState.lastDistance = currentDistance;
    }
    
    // Handle rotation
    if (this.gestureState.lastAngle) {
      const deltaAngle = currentAngle - this.gestureState.lastAngle;
      const activeObject = this.canvas.getActiveObject();
      
      if (activeObject) {
        const currentObjectAngle = activeObject.angle || 0;
        activeObject.setAngle(currentObjectAngle + deltaAngle);
        activeObject.setCoords();
        this.canvas.renderAll();
      }
      
      this.gestureState.lastAngle = currentAngle;
    }
  }

  private handleSwipe(start: TouchPoint, end: TouchPoint, duration: number): void {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / duration;
    
    let direction: 'left' | 'right' | 'up' | 'down';
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }
    
    this.emit('swipe', { direction, velocity });
  }

  handleLongPress(e: TouchEvent): void {
    const touch = e.touches[0];
    const target = this.canvas.findTarget({ clientX: touch.clientX, clientY: touch.clientY } as any);
    
    this.emit('contextmenu', {
      x: touch.clientX,
      y: touch.clientY,
      target
    });
  }

  showMobileToolbar(): void {
    this.mobileToolbarVisible = true;
    this.emit('toolbar-visibility-changed', true);
  }

  hideMobileToolbar(): void {
    this.mobileToolbarVisible = false;
    this.emit('toolbar-visibility-changed', false);
  }

  isMobileToolbarVisible(): boolean {
    return this.mobileToolbarVisible;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    this.emit('menu-toggled', this.mobileMenuOpen);
  }

  isMobileMenuOpen(): boolean {
    return this.mobileMenuOpen;
  }

  adaptUIForScreenSize(): void {
    const width = window.innerWidth;
    
    if (width <= 320) {
      // Very small mobile
      this.emit('ui-adapted', 'xs');
    } else if (width <= 414) {
      // Normal mobile
      this.emit('ui-adapted', 'sm');
    } else if (width <= 768) {
      // Large mobile / small tablet
      this.emit('ui-adapted', 'md');
    } else if (width <= 1024) {
      // Tablet
      this.emit('ui-adapted', 'lg');
    } else {
      // Desktop
      this.emit('ui-adapted', 'xl');
    }
  }

  getUIConfiguration(): UIConfiguration {
    const width = window.innerWidth;
    
    if (width <= 320) {
      return {
        toolbarPosition: 'bottom',
        toolbarSize: 'compact',
        showLabels: false,
        touchTargetSize: 44
      };
    } else if (width <= 414) {
      return {
        toolbarPosition: 'bottom',
        toolbarSize: 'normal',
        showLabels: false,
        touchTargetSize: 44
      };
    } else if (width <= 768) {
      return {
        toolbarPosition: 'top',
        toolbarSize: 'normal',
        sidebarPosition: 'left',
        showLabels: true,
        touchTargetSize: 44
      };
    } else {
      return {
        toolbarPosition: 'top',
        toolbarSize: 'large',
        sidebarPosition: 'left',
        showLabels: true,
        touchTargetSize: 32
      };
    }
  }

  enablePerformanceMode(): void {
    this.performanceMode = true;
    
    // Disable expensive features for better performance
    (this.canvas as any).enableRetinaScaling = false;
    (this.canvas as any).renderOnAddRemove = false;
    (this.canvas as any).skipTargetFind = true;
  }

  getPerformanceSettings(): PerformanceSettings {
    return {
      enableRetina: !this.performanceMode,
      renderOnAddRemove: !this.performanceMode,
      skipTargetFind: this.performanceMode
    };
  }

  optimizeForMobile(): void {
    this.enablePerformanceMode();
    
    // Additional mobile optimizations
    (this.canvas as any).selection = false; // Disable group selection
    (this.canvas as any).skipTargetFind = true; // Skip target finding during panning
  }

  getRenderingSettings(): PerformanceSettings {
    return {
      enableRetina: false,
      renderOnAddRemove: false,
      skipTargetFind: true,
      enableRetinaScaling: false,
      renderDuringPan: false
    };
  }

  getMinimumTouchTargetSize(): { width: number; height: number } {
    // Following accessibility guidelines (WCAG 2.5.5)
    return { width: 44, height: 44 };
  }

  setFocusableElement(element: HTMLElement): void {
    this.focusableElement = element;
  }

  focusCanvas(): void {
    if (this.focusableElement) {
      this.focusableElement.focus();
    } else {
      this.canvas.wrapperEl.focus();
    }
  }

  provideHapticFeedback(type: 'selection' | 'success' | 'error'): void {
    if (!('vibrate' in navigator)) return;
    
    switch (type) {
      case 'selection':
        navigator.vibrate(10);
        break;
      case 'success':
        navigator.vibrate([10, 10, 10]);
        break;
      case 'error':
        navigator.vibrate([50, 50, 50]);
        break;
    }
  }

  lockOrientation(orientation: 'portrait' | 'landscape'): void {
    if ('orientation' in screen && 'lock' in screen.orientation) {
      (screen.orientation as any).lock(orientation).catch((err: Error) => {
        console.warn('Failed to lock orientation:', err);
      });
    }
  }

  createContextMenu(options: {
    x: number;
    y: number;
    items: string[];
  }): { x: number; y: number; items: string[] } {
    // Adjust position to fit on screen
    const menuWidth = 150;
    const menuHeight = options.items.length * 40;
    
    let x = options.x;
    let y = options.y;
    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }
    
    return { x, y, items: options.items };
  }

  destroy(): void {
    // Remove event listeners
    this.canvas.wrapperEl.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.canvas.wrapperEl.removeEventListener('touchmove', this.onTouchMove.bind(this));
    this.canvas.wrapperEl.removeEventListener('touchend', this.onTouchEnd.bind(this));
    this.canvas.wrapperEl.removeEventListener('touchcancel', this.onTouchCancel.bind(this));
    
    window.removeEventListener('resize', this.onResize.bind(this));
    window.removeEventListener('orientationchange', this.onOrientationChange.bind(this));
    
    // Clear timers
    this.cancelLongPress();
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
    }
    
    // Remove all event emitters
    this.removeAllListeners();
    
    // Clear references
    this.gestureState = null;
    this.focusableElement = null;
  }
}