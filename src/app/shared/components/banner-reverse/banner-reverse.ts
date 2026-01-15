import { NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, NgZone, OnChanges, PLATFORM_ID, SimpleChanges, ViewChild, inject } from '@angular/core';
import { gsap } from 'gsap';
import { ClientPartner } from '../../../core/models/home.model';

@Component({
  selector: 'app-banner-reverse',
  imports: [NgOptimizedImage],
  templateUrl: './banner-reverse.html',
  styleUrl: './banner-reverse.css'
})
export class BannerReverse implements AfterViewInit, OnChanges {
  @Input() customClass: string = '';
  @Input() items: ClientPartner[] = []; // Array of client/partner items
  @Input() startAnimation?: boolean; // Control when to start animation (optional)
  @Input() useCssAnimation: boolean = false; // Use CSS animation instead of GSAP

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  private animationInitialized = false;
  private timeline: gsap.core.Tween | gsap.core.Timeline | null = null;
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private isBrowser = isPlatformBrowser(this.platformId);
  private imagesLoaded = false;
  private imagesToLoad = 0;
  private imagesLoadedCount = 0;

  // Helper method to get responsive image
  getResponsiveImage(image: { desktop: string; tablet: string; mobile: string } | null | undefined): string {
    if (!image) return '/images/placeholder.png';
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768) {
        return image.mobile || image.desktop || '/images/placeholder.png';
      } else if (width < 1024) {
        return image.tablet || image.desktop || '/images/placeholder.png';
      }
    }
    return image.desktop || '/images/placeholder.png';
  }

  // Get items to display (duplicate for seamless infinite loop)
  getDisplayItems(): ClientPartner[] {
    if (this.items.length === 0) return [];
    // Duplicate items enough times for seamless infinite scrolling (at least 2 sets)
    return [...this.items, ...this.items, ...this.items];
  }

  ngOnChanges(changes: SimpleChanges) {
    // Only run animations in browser, not in SSR
    if (!this.isBrowser) {
      return;
    }

    // If using CSS animation, don't initialize GSAP
    if (this.useCssAnimation) {
      return;
    }

    // If items changed, re-initialize animation
    if (changes['items']) {
      const previousItems = changes['items'].previousValue || [];
      const currentItems = changes['items'].currentValue || [];
      const previousLength = Array.isArray(previousItems) ? previousItems.length : 0;
      const currentLength = Array.isArray(currentItems) ? currentItems.length : 0;
      
      // If items changed from empty to non-empty (most important case for refresh)
      if (previousLength === 0 && currentLength > 0) {
        this.animationInitialized = false;
        this.imagesLoaded = false;
        this.imagesLoadedCount = 0;
        // Reset retry count since we now have items
        (this as any).__retryCount = 0;
        // Wait for images to load before re-initializing
        setTimeout(() => {
          this.waitForImagesAndInit();
        }, 200);
      } 
      // If items changed and we already had items (re-initialize)
      else if (!changes['items'].firstChange && previousLength > 0 && previousLength !== currentLength) {
        this.animationInitialized = false;
        this.imagesLoaded = false;
        this.imagesLoadedCount = 0;
        setTimeout(() => {
          this.waitForImagesAndInit();
        }, 200);
      }
      // First change and items are already available
      else if (changes['items'].firstChange && currentLength > 0) {
        setTimeout(() => {
          this.tryInitAnimation();
        }, 200);
      }
    }

    // If startAnimation changed to true and we haven't started yet, start the animation
    if (changes['startAnimation']) {
      if (this.startAnimation === true && !this.animationInitialized) {
        setTimeout(() => {
          this.tryInitAnimation();
        }, 100);
      } else if (this.startAnimation === false && this.animationInitialized) {
        // If startAnimation changed to false, stop animation
        if (this.timeline) {
          this.timeline.kill();
          this.timeline = null;
        }
        this.animationInitialized = false;
      }
    }
  }

  ngAfterViewInit() {
    // Only run animations in browser, not in SSR
    if (!this.isBrowser) {
      return;
    }

    // Try to initialize animation
    this.tryInitAnimation();
  }

  private tryInitAnimation() {
    // Only run animations in browser, not in SSR
    if (!this.isBrowser) {
      return;
    }

    // If using CSS animation, don't initialize GSAP
    if (this.useCssAnimation) {
      return;
    }

    // If startAnimation is explicitly set to false, wait for it to become true
    // If it's undefined (not provided), start normally
    if (this.startAnimation === false) {
      // We're waiting for startAnimation to be true
      return;
    }

    // If startAnimation is undefined (not provided), start normally
    // If startAnimation is true, start immediately
    if (this.startAnimation === undefined || this.startAnimation === true) {
      if (this.items.length > 0 && this.scrollContainer) {
        setTimeout(() => {
          if (!this.animationInitialized && this.scrollContainer) {
            this.waitForImagesAndInit();
          }
        }, 150);
      } else if (this.items.length === 0) {
        // If no items yet, try again after a delay (for when data loads)
        // Limit retries to prevent infinite loops (max 10 retries = 5 seconds)
        const retryCount = (this as any).__retryCount || 0;
        if (retryCount < 10) {
          (this as any).__retryCount = retryCount + 1;
          setTimeout(() => {
            this.tryInitAnimation();
          }, 500);
        } else {
          // Reset retry count after max retries
          (this as any).__retryCount = 0;
        }
      } else {
        // Reset retry count if items are available
        (this as any).__retryCount = 0;
      }
    }
  }

  private waitForImagesAndInit() {
    if (!this.isBrowser || !this.scrollContainer) {
      return;
    }

    // If using CSS animation, don't initialize GSAP
    if (this.useCssAnimation) {
      return;
    }

    const container = this.scrollContainer.nativeElement;
    const images = container.querySelectorAll('img');
    
    if (images.length === 0) {
      // No images, initialize immediately
      setTimeout(() => {
        this.privateInitAnimation();
      }, 100);
      return;
    }

    // Reset image loading state
    this.imagesLoaded = false;
    this.imagesToLoad = images.length;
    this.imagesLoadedCount = 0;

    // Check if images are already loaded
    let allLoaded = true;
    images.forEach((img: HTMLImageElement) => {
      if (!img.complete || img.naturalWidth === 0) {
        allLoaded = false;
        const loadHandler = () => this.onImageLoad();
        const errorHandler = () => this.onImageLoad();
        img.addEventListener('load', loadHandler, { once: true });
        img.addEventListener('error', errorHandler, { once: true });
      } else {
        this.imagesLoadedCount++;
      }
    });

    if (allLoaded) {
      // All images already loaded
      setTimeout(() => {
        this.privateInitAnimation();
      }, 100);
    } else {
      // Wait for images with timeout fallback
      setTimeout(() => {
        if (!this.animationInitialized) {
          // Timeout - initialize anyway
          this.privateInitAnimation();
        }
      }, 2000);
    }
  }

  private onImageLoad() {
    this.imagesLoadedCount++;
    if (this.imagesLoadedCount >= this.imagesToLoad && !this.animationInitialized) {
      this.imagesLoaded = true;
      setTimeout(() => {
        this.privateInitAnimation();
      }, 100);
    }
  }

  // Public method to prepare animation (create timeline but don't start)
  public prepareAnimation(): void {
    if (!this.isBrowser || this.animationInitialized) {
      return;
    }

    // If using CSS animation, don't initialize GSAP
    if (this.useCssAnimation) {
      return;
    }

    // Prepare the animation immediately
    this.privateInitAnimation(true); // true = paused
  }

  // Public method to get the timeline (for parent to control)
  public getTimeline(): gsap.core.Tween | gsap.core.Timeline | null {
    return this.timeline;
  }

  // Public method to start animation (called by parent when both banners are ready)
  public startAnimationNow(): void {
    if (!this.isBrowser) {
      return;
    }

    // If using CSS animation, don't initialize GSAP
    if (this.useCssAnimation) {
      return;
    }

    // If animation is already initialized and playing, do nothing
    if (this.animationInitialized && this.timeline && !this.timeline.paused()) {
      return;
    }

    // If animation is already initialized but paused, just play it
    if (this.timeline && this.timeline.paused()) {
      this.timeline.play();
      return;
    }

    // Otherwise wait for images and start
    if (this.items.length > 0) {
      this.waitForImagesAndInit();
    } else {
      // If no items, try again after a delay
      setTimeout(() => {
        this.startAnimationNow();
      }, 500);
    }
  }

  private privateInitAnimation(paused: boolean = false) {
    // Only run animations in browser, not in SSR
    if (!this.isBrowser) {
      return;
    }

    // If using CSS animation, don't initialize GSAP
    if (this.useCssAnimation) {
      return;
    }

    // Prevent multiple initializations
    if (this.animationInitialized && !paused) {
      return;
    }

    // Kill existing animation if any
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }

    if (!this.scrollContainer || !this.scrollContainer.nativeElement) {
      this.animationInitialized = false;
      return;
    }

    const container = this.scrollContainer.nativeElement;
    
    // Run measurements outside Angular's change detection to reduce reflow
    this.ngZone.runOutsideAngular(() => {
      // Use multiple RAF to ensure DOM is fully ready and images are rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Measure container width in RAF to avoid force reflow
          const containerWidth = container.scrollWidth;
          
          if (containerWidth === 0) {
            // Retry if width is still 0 (max 5 retries)
            const retryCount = (container as any).__retryCount || 0;
            if (retryCount < 5) {
              (container as any).__retryCount = retryCount + 1;
              setTimeout(() => {
                this.privateInitAnimation(paused);
              }, 200);
            }
            return;
          }

          // Reset retry count
          (container as any).__retryCount = 0;

          // Calculate the width of one set of items (original items)
          // Since we duplicated items 3 times, one set is containerWidth / 3
          // But we'll recalculate more accurately in setupAnimation
          const singleSetWidth = containerWidth / 3;
          
          // Ensure we have a valid width
          if (singleSetWidth <= 0 || !isFinite(singleSetWidth)) {
            setTimeout(() => {
              this.privateInitAnimation(paused);
            }, 200);
            return;
          }
          
          // Run animation setup back inside Angular zone
          this.ngZone.run(() => {
            this.setupAnimation(container, singleSetWidth, paused);
          });
        });
      });
    });
  }

  private setupAnimation(container: HTMLElement, singleSetWidth: number, paused: boolean = false): void {
    if (!this.isBrowser) {
      return;
    }

    // Kill any existing tweens on the container
    gsap.killTweensOf(container);

    // REVERSE DIRECTION: This component always moves left-to-right (opposite of banner)
    const isRightToLeft = false; // Always left-to-right for reverse banner

    // Reset position to start with hardware acceleration
    gsap.set(container, { 
      x: 0, 
      force3D: true
    });

    // Calculate the actual width of one set by measuring first set of items
    // This is more accurate than dividing by 3, especially with gaps
    const items = container.children;
    const itemsPerSet = this.items.length;
    let actualSingleSetWidth = 0;
    
    if (items.length >= itemsPerSet && itemsPerSet > 0) {
      // Get the computed style to account for gap
      const containerStyle = window.getComputedStyle(container);
      const gap = parseFloat(containerStyle.gap || '0') || 0;
      
      // Calculate width of first set by summing individual item widths + gaps
      for (let i = 0; i < itemsPerSet; i++) {
        const item = items[i] as HTMLElement;
        const itemRect = item.getBoundingClientRect();
        actualSingleSetWidth += itemRect.width;
        // Add gap after each item except the last
        if (i < itemsPerSet - 1) {
          actualSingleSetWidth += gap;
        }
      }
    } else {
      // Fallback to calculated width
      actualSingleSetWidth = singleSetWidth;
    }

    // Use the more accurate width, or fallback to calculated
    // Round to avoid sub-pixel issues
    const finalSetWidth = actualSingleSetWidth > 0 ? Math.round(actualSingleSetWidth) : Math.round(singleSetWidth);

    // Ensure we have a valid width
    if (finalSetWidth <= 0) {
      setTimeout(() => {
        this.privateInitAnimation(paused);
      }, 200);
      return;
    }

    // Create infinite scroll animation with seamless loop
    // Calculate duration based on distance to maintain consistent speed (pixels per second)
    // Speed = 60 pixels per second (faster - adjust this value to change speed - higher = faster)
    const pixelsPerSecond = 60;
    const duration = finalSetWidth / pixelsPerSecond;

    // REVERSE: Move from left to right (positive direction)
    const targetX = finalSetWidth;
    
    // Create seamless infinite scroll using fromTo for proper seamless loop
    // fromTo ensures that when repeat happens, it starts from 0 again seamlessly
    // Since items are duplicated (3 sets), when we move by finalSetWidth and repeat from 0,
    // the duplicated items will be in the same position, creating a seamless loop
    const tween = gsap.fromTo(container,
      { 
        x: 0, 
        force3D: true 
      },
      {
        x: targetX,
        duration: duration,
        ease: 'none',
        repeat: -1,
        paused: paused,
        immediateRender: false,
        force3D: true,
        lazy: false
      }
    );
    
    this.timeline = tween;
    this.animationInitialized = true;
    
    // If not paused, ensure animation is playing
    if (!paused && this.timeline) {
      this.timeline.play();
    }
  }
}
