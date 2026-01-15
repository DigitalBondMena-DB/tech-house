import { Component, Input, AfterViewInit, ViewChild, ElementRef, OnChanges, SimpleChanges, inject, NgZone, PLATFORM_ID } from '@angular/core';
import { CommonModule, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { AppButton } from '../app-button/app-button';
import { HomeBanner } from '../../../features/home/home-banner/home-banner';
import { gsap } from 'gsap';

@Component({
  selector: 'app-hero-section',
  imports: [AppButton, CommonModule, NgOptimizedImage],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.css'
})
export class HeroSection implements AfterViewInit, OnChanges {
  @Input() title?: string;
  @Input() btn?: string;
  @Input() subtitle?: string;
  @Input() paragraph?: string;
  @Input() image?: string;
  @Input() imagePosition: 'left' | 'center' | 'none' = 'none';
  @Input() subtitleAboveTitle: boolean = false;
  @Input() imageClass: string = ''; // Custom classes for the image
  @Input() customClass: string = ''; // Custom classes for the hero section
  @Input() jobInfo?: Array<{ label: string; icon: string }>; // Job info cards
  @Input() btnClass: string = ''; // Custom classes for the button

  @ViewChild('subtitleElement', { static: false }) subtitleElement!: ElementRef<HTMLSpanElement>;
  @ViewChild('subtitleContainer', { static: false }) subtitleContainer!: ElementRef<HTMLDivElement>;

  private typingAnimation: gsap.core.Timeline | null = null;
  private sanitizer = inject(DomSanitizer);
  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // !btn data
  btnText = "بتكار يصنع كفائتنا";

  sanitizeIcon(icon: string) {
    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }

  ngAfterViewInit() {
    if (this.subtitle && this.subtitleAboveTitle) {
      this.initTypingAnimation();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['subtitle'] && !changes['subtitle'].firstChange && this.subtitleAboveTitle) {
      if (this.typingAnimation) {
        this.typingAnimation.kill();
      }
      setTimeout(() => {
        this.initTypingAnimation();
      }, 0);
    }
  }

  private initTypingAnimation() {
    // Only run in browser environment
    if (!this.isBrowser) {
      return;
    }

    if (!this.subtitleElement || !this.subtitle || !this.subtitleContainer) return;

    const text = this.subtitle;
    const element = this.subtitleElement.nativeElement;
    const container = this.subtitleContainer.nativeElement;
    
    // Safe requestAnimationFrame wrapper: use native RAF in browser
    // or fallback to setTimeout during SSR/testing
    const raf = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame.bind(globalThis)
      : (cb: FrameRequestCallback) => setTimeout(() => {
          const time = (typeof performance !== 'undefined' && (performance as any).now) 
            ? (performance as any).now() 
            : Date.now();
          cb(time);
        }, 16);
    
    // Run measurements outside Angular's change detection to reduce reflow
    this.ngZone.runOutsideAngular(() => {
      raf(() => {
        // Check if window and document are available
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          return;
        }

        // Create a temporary element to measure text widths
        const tempElement = document.createElement('span');
        tempElement.style.visibility = 'hidden';
        tempElement.style.position = 'absolute';
        tempElement.style.whiteSpace = 'nowrap';
        tempElement.style.fontSize = window.getComputedStyle(element).fontSize;
        tempElement.style.fontFamily = window.getComputedStyle(element).fontFamily;
        tempElement.style.fontWeight = window.getComputedStyle(element).fontWeight;
        document.body.appendChild(tempElement);

        // Pre-calculate widths for each character position
        const widths: number[] = [];
        for (let i = 0; i <= text.length; i++) {
          tempElement.textContent = text.substring(0, i);
          widths.push(tempElement.offsetWidth);
        }
        document.body.removeChild(tempElement);

        // Get container padding to add to width
        const containerStyle = window.getComputedStyle(container);
        const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
        const totalPadding = paddingLeft + paddingRight;

        // Run animation setup back inside Angular zone
        this.ngZone.run(() => {
          this.setupAnimation(element, container, widths, totalPadding);
        });
      });
    });
  }

  private setupAnimation(
    element: HTMLElement,
    container: HTMLElement,
    widths: number[],
    totalPadding: number
  ) {
    const text = this.subtitle!;
    
    // Clear the element
    element.textContent = '';

    // Create timeline
    this.typingAnimation = gsap.timeline({ repeat: -1, repeatDelay: 2 });

    // Set initial state - text hidden and positioned from right, container width 0
    gsap.set(element, { 
      opacity: 0,
      x: 50
    });
    gsap.set(container, {
      width: 0,
      overflow: 'hidden'
    });

    // Animation: Container width expands, text fades in and slides from right
    this.typingAnimation
      .to(element, {
        opacity: 1,
        x: 0,
        duration: 0.3,
        ease: 'power2.out'
      });

    // Type each character one by one and expand container width
    for (let i = 0; i < text.length; i++) {
      const currentText = text.substring(0, i + 1);
      const currentWidth = widths[i + 1] + totalPadding;

      this.typingAnimation
        .to({}, {
          duration: 0.2,
          onComplete: () => {
            element.textContent = currentText;
          }
        })
        .to(container, {
          width: currentWidth,
          duration: 0.2,
          ease: 'power2.out'
        }, '<');
    }

    // Wait before disappearing
    this.typingAnimation
      .to({}, { duration: 1.5 })
      // Text fades out and slides to right, container width shrinks
      .to(element, {
        opacity: 0,
        x: 50,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => {
          element.textContent = '';
        }
      })
      .to(container, {
        width: 0,
        duration: 0.3,
        ease: 'power2.in'
      }, '-=0.3');
  }
}
