import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, computed, effect, ElementRef, inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { environment } from '../../../environments/environment';
import { SharedFeatureService } from '../../core/services/sharedFeatureService';
import { CircleSidebar } from '../../shared/components/circle-sidebar/circle-sidebar';
import { ContactUsSec } from '../../shared/components/contact-us-sec/contact-us-sec';
import { HeroSection } from '../../shared/components/hero-section/hero-section';

@Component({
  selector: 'app-contact-us',
  imports: [
    HeroSection,
    ContactUsSec,
    CommonModule,
    CircleSidebar,
    SkeletonModule
  ],
  templateUrl: './contact-us.html',
  styleUrl: './contact-us.css'
})
export class ContactUs implements OnInit, AfterViewInit, OnDestroy {
  private sharedFeatureService = inject(SharedFeatureService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('countersSection', { static: false }) countersSection!: ElementRef<HTMLElement>;

  // 🔹 Contact Hero Data from API
  contactHero = computed(() => this.sharedFeatureService.contactHero());

  // 🔹 Contact Us Data from API
  contactUsData = computed(() => this.sharedFeatureService.contactUsData());

  // 🔹 Counters Data from API
  counters = computed(() => this.sharedFeatureService.counters());

  // 🔹 Check if all sections are loaded
  isAllDataLoaded = computed(() => {
    if (!this.contactHero()) return false;
    if (!this.contactUsData()) return false;
    return true;
  });

  // 🔹 Animated counter values
  animatedCounters: number[] = [0, 0, 0];

  private animated = false;
  private viewReady = false;
  private intersectionObserver?: IntersectionObserver;

  constructor() {
    // Watch for counters data changes
    effect(() => {
      const counters = this.counters();
      if (counters?.length) {
        const maxCounters = Math.min(counters.length, 3);
        if (this.animatedCounters.length !== maxCounters) {
          this.animatedCounters = new Array(maxCounters).fill(0);
        }
      }

      if (counters?.length && this.viewReady && this.isBrowser) {
        this.setupIntersectionObserver();
      }
    });
  }

  ngOnInit(): void {
    // Scroll to top when contact page loads
    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Load data in ngOnInit (runs on both server and client)
    // On server: loads data and saves to TransferState
    // On client: checks TransferState first, then loads if needed
    this.sharedFeatureService.loadContactHero();
    this.sharedFeatureService.loadContactUsData();
    this.sharedFeatureService.loadCounters();
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.viewReady = true;
    
    // Setup Intersection Observer if counters are already loaded
    const counters = this.counters();
    if (counters?.length) {
      this.setupIntersectionObserver();
    }
  }

  ngOnDestroy(): void {
    // Clean up Intersection Observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  private setupIntersectionObserver(): void {
    if (!this.isBrowser || this.animated || !this.countersSection?.nativeElement) {
      return;
    }

    // Create Intersection Observer to trigger animation when section is visible
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.animated) {
            const counters = this.counters();
            if (counters?.length) {
              queueMicrotask(() => {
                this.startCounters();
              });
              // Disconnect observer after animation starts
              this.intersectionObserver?.disconnect();
            }
          }
        });
      },
      {
        threshold: 0.3 // Start animation when 30% of section is visible
      }
    );

    this.intersectionObserver.observe(this.countersSection.nativeElement);
  }

  private startCounters(): void {
    if (this.animated) return;

    const counters = this.counters();
    if (!counters?.length) return;

    this.animated = true;
    const maxCounters = Math.min(counters.length, 3);
    this.animatedCounters = new Array(maxCounters).fill(0);

    counters.slice(0, 3).forEach((counter, index) => {
      this.animateCounter(counter.count, index);
    });
  }

  private animateCounter(target: number, index: number): void {
    const duration = 2000;
    const start = performance.now();
    const raf = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame.bind(globalThis)
      : (cb: FrameRequestCallback) => setTimeout(() => cb((typeof performance !== 'undefined' && (performance as any).now) ? (performance as any).now() : Date.now()), 16);

    const animate = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      this.animatedCounters[index] = Math.floor(target * progress);
      this.cdr.detectChanges();

      if (progress < 1) {
        raf(animate);
      } else {
        this.animatedCounters[index] = target;
        this.cdr.detectChanges();
      }
    };

    raf(animate);
  }

  // 🔹 Helper method to add base URL if image is relative
  private addBaseUrlIfNeeded(url: string): string {
    if (!url) return '';
    
    // If URL is already absolute (starts with http:// or https://), return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If URL starts with /, it's relative to root, return as is
    if (url.startsWith('/')) {
      return url;
    }
    
    // Otherwise, add base URL from environment (remove /api and add image path)
    // API URL is: https://dashboard.techhouseksa.com/api
    // Base URL should be: https://dashboard.techhouseksa.com
    const baseUrl = environment.apiUrl.replace('/api', '');
    
    // Remove leading slash from url if exists to avoid double slashes
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    const fullUrl = `${baseUrl}/${cleanUrl}`;
    
    return fullUrl;
  }

  // 🔹 Helper method to get responsive image based on screen size
  getResponsiveImage(image: { desktop: string; tablet: string; mobile: string } | null | undefined): string {
    if (!image) {
      return '/images/placeholder.webp';
    }
    
    let imageUrl = '';
    if (this.isBrowser) {
      const width = window.innerWidth;
      if (width < 768) {
        imageUrl = image.mobile || image.desktop || '';
      } else if (width < 1024) {
        imageUrl = image.tablet || image.desktop || '';
      } else {
        imageUrl = image.desktop || '';
      }
    } else {
      imageUrl = image.desktop || '';
    }
    
    if (!imageUrl) {
      return '/images/placeholder.webp';
    }
    
    // Add base URL if needed (الصور تأتي كـ URLs كاملة بالفعل، لكن للاحتياط)
    const finalUrl = this.addBaseUrlIfNeeded(imageUrl);
    return finalUrl;
  }
}
