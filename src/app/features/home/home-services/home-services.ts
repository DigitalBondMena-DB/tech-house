import { NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, NgZone, OnChanges, OnDestroy, PLATFORM_ID, QueryList, SimpleChanges, ViewChild, ViewChildren, computed, effect, inject, signal } from '@angular/core';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { SkeletonModule } from 'primeng/skeleton';
import { Service } from '../../../core/models/home.model';
import { debounce } from '../../../core/utils/performance.utils';
import { AppButton } from '../../../shared/components/app-button/app-button';
import { SectionTitle } from '../../../shared/components/section-title/section-title';

// Only register plugin in browser
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

@Component({
  selector: 'app-home-services',
  imports: [SectionTitle, AppButton, NgOptimizedImage, SkeletonModule],
  templateUrl: './home-services.html',
  styleUrl: './home-services.css',
  standalone: true
})
export class HomeServices implements AfterViewInit, OnChanges, OnDestroy {
  @Input() services: Service[] = [];

  // 🔹 Loading state as signal
  private isLoadingSignal = signal(true);
  isLoading = computed(() => this.isLoadingSignal());

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['services']) {
      this.isLoadingSignal.set(!this.services || this.services.length === 0);
    }
  }

  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private isBrowser = isPlatformBrowser(this.platformId);
  
  // Cache window width to avoid repeated reads
  private cachedWindowWidth = signal<number | null>(null);
  private resizeHandler?: () => void;

  //! section title data
  servicesTitle = "خدماتنا";

  //! button data
  btnText = "خدمات اكثر";

  private getWindowWidth(): number {
    if (!this.isBrowser) return 1024; // Default desktop width for SSR
    
    // Cache width to avoid repeated reads
    const cached = this.cachedWindowWidth();
    if (cached !== null) {
      return cached;
    }
    
    // Read once and cache - Run outside Angular zone to reduce reflow
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        const width = window.innerWidth;
        this.ngZone.run(() => {
          this.cachedWindowWidth.set(width);
        });
      });
    });
    
    // Setup resize listener with debounce (only once)
    if (typeof window !== 'undefined' && !this.resizeHandler) {
      // Create debounced resize handler
      this.resizeHandler = debounce(() => {
        this.ngZone.runOutsideAngular(() => {
          requestAnimationFrame(() => {
            const width = window.innerWidth;
            this.ngZone.run(() => {
              this.cachedWindowWidth.set(width);
            });
          });
        });
      }, 200);
      
      // Add passive resize listener
      window.addEventListener('resize', this.resizeHandler, { passive: true });
    }
    
    // Return cached or current width
    return this.cachedWindowWidth() ?? window.innerWidth;
  }

  ngOnDestroy(): void {
    // Clean up resize listener
    if (this.isBrowser && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = undefined;
    }
  }

  // Helper method to get responsive image
  getResponsiveImage(image: { desktop: string; tablet: string; mobile: string } | undefined): string {
    if (!image) return '/images/placeholder.webp';
    if (this.isBrowser) {
      const width = this.getWindowWidth();
      if (width < 768) {
        return image.mobile || image.desktop || '/images/placeholder.webp';
      } else if (width < 1024) {
        return image.tablet || image.desktop || '/images/placeholder.webp';
      }
    }
    return image.desktop || '/images/placeholder.webp';
  }

  // Right side elements (titles for even-indexed services)
  @ViewChild('titleRight1') titleRight1!: ElementRef;
  @ViewChild('titleBgRight1') titleBgRight1!: ElementRef;
  @ViewChild('titleRight2') titleRight2!: ElementRef;
  @ViewChild('titleBgRight2') titleBgRight2!: ElementRef;
  
  // Left side elements (titles for odd-indexed services)
  @ViewChild('titleLeft1') titleLeft1!: ElementRef;
  @ViewChild('titleBgLeft1') titleBgLeft1!: ElementRef;
  @ViewChild('titleLeft2') titleLeft2!: ElementRef;
  @ViewChild('titleBgLeft2') titleBgLeft2!: ElementRef;
  
  // Image elements
  @ViewChildren('imgEl') images!: QueryList<ElementRef>;
  
  private animationsInitialized = false;

  constructor() {
    // Watch for loading state changes and initialize animations when data is loaded
    if (this.isBrowser) {
      effect(() => {
        const loading = this.isLoading();
        if (!loading && !this.animationsInitialized) {
          // Wait for DOM to be ready
          setTimeout(() => {
            this.initAnimations();
          }, 100);
        }
      });
    }
  }

  ngAfterViewInit() {
    // Try to initialize animations if data is already loaded
    if (!this.isBrowser) {
      return;
    }
    
    if (!this.isLoading() && !this.animationsInitialized) {
      setTimeout(() => {
        this.initAnimations();
      }, 200);
    }
  }

  private initAnimations(): void {
    if (!this.isBrowser || this.animationsInitialized) {
      return;
    }

    // Kill any existing ScrollTriggers for this component to avoid duplicates
    ScrollTrigger.getAll().forEach(trigger => {
      const triggerElement = trigger.trigger;
      if (triggerElement && triggerElement instanceof Element) {
        const parent = triggerElement.closest('app-home-services');
        if (parent) {
          trigger.kill();
        }
      }
    });

    // Use setTimeout to ensure DOM is fully ready
    setTimeout(() => {
      // Animate right side titles (appearing from left to right)
      if (this.titleRight1?.nativeElement && this.titleBgRight1?.nativeElement) {
        this.animateTitle(this.titleRight1.nativeElement, this.titleBgRight1.nativeElement, 'right');
      }
      if (this.titleRight2?.nativeElement && this.titleBgRight2?.nativeElement) {
        this.animateTitle(this.titleRight2.nativeElement, this.titleBgRight2.nativeElement, 'right');
      }
      
      // Animate left side titles (appearing from right to left)
      if (this.titleLeft1?.nativeElement && this.titleBgLeft1?.nativeElement) {
        this.animateTitle(this.titleLeft1.nativeElement, this.titleBgLeft1.nativeElement, 'left');
      }
      if (this.titleLeft2?.nativeElement && this.titleBgLeft2?.nativeElement) {
        this.animateTitle(this.titleLeft2.nativeElement, this.titleBgLeft2.nativeElement, 'left');
      }

      // Animate images with rotation and scale effect (no repeat on scroll)
      if (this.images && this.images.length > 0) {
        this.images.forEach((img, index) => {
          if (img?.nativeElement) {
            // Set initial state first
            gsap.set(img.nativeElement, {
              opacity: 0,
              rotateY: -90,
              scale: 0.9,
              transformStyle: "preserve-3d",
              perspective: 1000
            });

            // Create animation with ScrollTrigger
            gsap.to(img.nativeElement, {
              opacity: 1,
              rotateY: 0,
              scale: 1,
              duration: 1.2,
              ease: "power3.out",
              scrollTrigger: {
                trigger: img.nativeElement,
                start: "top 80%",
                toggleActions: "play none none none",
                once: true
              }
            });
          }
        });
      }

      // Refresh ScrollTrigger after all animations are set up
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
      
      this.animationsInitialized = true;
    }, 100);
  }

  private animateTitle(titleElement: HTMLElement, bgElement: HTMLElement, direction: 'left' | 'right') {
    // Only run in browser
    if (!this.isBrowser || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      return;
    }

    // Set initial state
    gsap.set(bgElement, {
      x: direction === 'right' ? '-100%' : '100%',
      width: '100%',
      position: 'absolute',
      top: 0,
      bottom: 0,
      [direction === 'right' ? 'left' : 'right']: 0
    });

    // Create a timeline for the title animation (no repeat on scroll)
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: titleElement,
        start: 'top 80%',
        toggleActions: 'play none none none',
        markers: false
      }
    });

    // Animate the background (reveal effect)
    tl.to(bgElement, {
      x: '0%',
      duration: 1.5,
      ease: 'power3.out'
    });

    // Animate the text (slight delay after background starts)
    const titleText = titleElement.querySelector('.service-title');
    if (titleText) {
      tl.fromTo(
        titleText,
        { 
          opacity: 0,
          x: direction === 'right' ? -50 : 50
        },
        {
          opacity: 1,
          x: 0,
          duration: 1.2,
          ease: 'power3.out'
        },
        '-=0.5' // Slight overlap with the background animation
      );
    }
  }


}
