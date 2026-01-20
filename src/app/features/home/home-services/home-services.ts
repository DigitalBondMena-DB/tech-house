import { NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, input, viewChildren, viewChild, computed, effect, signal, PLATFORM_ID, NgZone, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { SkeletonModule } from 'primeng/skeleton';
import { Service } from '../../../core/models/home.model';
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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class HomeServices implements AfterViewInit, OnDestroy {
  private readonly timeouts = new Map<string, NodeJS.Timeout>();
  services = input<Service[]>([]);

  // 🔹 Loading state as signal
  isLoading = computed(() => {
    const data = this.services();
    return !data || data.length === 0;
  });



  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private resizeObserver: ResizeObserver | null = null;

  // Cache window width to avoid repeated reads
  enrichedServices = computed(() => {
    const data = this.services();
    if (!data?.length) return [];

    return data.map(service => ({
      ...service,
      // تحسين: بناء الـ srcset مرة واحدة فقط
      srcset: service.image ? `${service.image.mobile} 600w, ${service.image.tablet} 1024w, ${service.image.desktop} 1440w` : '',
      defaultImg: service.image?.desktop || '/images/placeholder.webp'
    }));
  });
  //! section title data
  servicesTitle = "خدماتنا";

  //! button data
  btnText = "خدمات اكثر";


  // Right side elements (titles for even-indexed services)
  titleRight1 = viewChild<ElementRef>('titleRight1');
  titleBgRight1 = viewChild<ElementRef>('titleBgRight1');
  titleRight2 = viewChild<ElementRef>('titleRight2');
  titleBgRight2 = viewChild<ElementRef>('titleBgRight2');

  // Left side elements (titles for odd-indexed services)
  titleLeft1 = viewChild<ElementRef>('titleLeft1');
  titleBgLeft1 = viewChild<ElementRef>('titleBgLeft1');
  titleLeft2 = viewChild<ElementRef>('titleLeft2');
  titleBgLeft2 = viewChild<ElementRef>('titleBgLeft2');

  // Image elements
  images = viewChildren<ElementRef>('imgEl');

  private animationsInitialized = signal(false);

  constructor() {
    // Watch for loading state changes and initialize animations when data is loaded
    if (this.isBrowser) {
      effect(() => {
        // السجنال ده هيتحرك لما الداتا تحمل والـ DOM يكون جاهز
        const isReady = !this.isLoading();
        const el = this.titleRight1(); // التأكد أن الـ ViewChild لقط العنصر

        if (isReady && el && this.isBrowser) {
          this.initAnimations();
        }
      });
    }
  }

  ngAfterViewInit() {
    // Try to initialize animations if data is already loaded
    if (!this.isBrowser) {
      return;
    }

    if (!this.isLoading() && !this.animationsInitialized()) {
      const timeoutId = setTimeout(() => {
        this.initAnimations();
      }, 200);
      this.timeouts.set('initAnimationsTimeout', timeoutId);
    }
  }

  private initAnimations(): void {
    if (!this.isBrowser || this.animationsInitialized()) {
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
    const timeOutId = setTimeout(() => {
      // Animate right side titles (appearing from left to right)
      if (this.titleRight1()?.nativeElement && this.titleBgRight1()?.nativeElement) {
        this.animateTitle(this.titleRight1()?.nativeElement, this.titleBgRight1()?.nativeElement, 'right');
      }
      if (this.titleRight2()?.nativeElement && this.titleBgRight2()?.nativeElement) {
        this.animateTitle(this.titleRight2()?.nativeElement, this.titleBgRight2()?.nativeElement, 'right');
      }

      // Animate left side titles (appearing from right to left)
      if (this.titleLeft1()?.nativeElement && this.titleBgLeft1()?.nativeElement) {
        this.animateTitle(this.titleLeft1()?.nativeElement, this.titleBgLeft1()?.nativeElement, 'left');
      }
      if (this.titleLeft2()?.nativeElement && this.titleBgLeft2()?.nativeElement) {
        this.animateTitle(this.titleLeft2()?.nativeElement, this.titleBgLeft2()?.nativeElement, 'left');
      }

      // Animate images with rotation and scale effect (no repeat on scroll)
      if (this.images() && this.images().length > 0) {
        this.images().forEach((img: ElementRef, index: number) => {
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
            this.ngZone.runOutsideAngular(() => {
              gsap.to(img.nativeElement, {
                opacity: 1,
                rotateY: 0,
                scale: 1,
                duration: 1.2,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: img.nativeElement,
                  start: "top 85%",
                  toggleActions: "play none none none",
                  once: true,
                  invalidateOnRefresh: true
                }
              });
            });
          }
        });
      }

      // Refresh ScrollTrigger after all animations are set up
      // and again after a short delay for image rendering
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
        const timeOutId = setTimeout(() => ScrollTrigger.refresh(), 500);
        this.timeouts.set('refreshScrollTriggerTimeout', timeOutId);
      }

      // Setup resize observer for dynamic height changes
      if (this.isBrowser && !this.resizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          this.ngZone.runOutsideAngular(() => {
            ScrollTrigger.refresh();
          });
        });
        const container = document.querySelector('app-home-services');
        if (container) {
          this.resizeObserver.observe(container);
        }
      }

      this.animationsInitialized.set(true);
    }, 200);
    this.timeouts.set('initAnimationsTimeout2', timeOutId);
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.getAll().forEach(trigger => {
          const triggerElement = trigger.trigger;
          if (triggerElement && triggerElement instanceof Element) {
            const parent = triggerElement.closest('app-home-services');
            if (parent) {
              trigger.kill();
            }
          }
        });
      }
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
    }
    if (this.timeouts.size > 0) {
      this.timeouts.forEach((timeout) => clearTimeout(timeout));
      this.timeouts.clear()
    }
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
    this.ngZone.runOutsideAngular(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: titleElement,
          start: 'top 85%',
          toggleActions: 'play none none none',
          markers: false,
          invalidateOnRefresh: true
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
    });
  }


}
