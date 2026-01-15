import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  signal,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { AboutHome } from '../../../core/models/home.model';
import { SharedFeatureService } from '../../../core/services/sharedFeatureService';
import { SectionTitle } from '../../../shared/components/section-title/section-title';

@Component({
  selector: 'app-home-about',
  standalone: true,
  imports: [SectionTitle, NgOptimizedImage, SkeletonModule, RouterLink],
  templateUrl: './home-about.html',
  styleUrl: './home-about.css'
})
export class HomeAbout implements AfterViewInit, OnDestroy, OnChanges {

  @Input() aboutData: AboutHome | null = null;

  @ViewChild('aboutSection', { static: false }) aboutSection!: ElementRef<HTMLElement>;

  private sharedFeatureService = inject(SharedFeatureService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private cdr = inject(ChangeDetectorRef);

  // 🔹 counters from API (signal)
  counters = computed(() => this.sharedFeatureService.counters());

  // 🔹 Loading state as signal
  private isLoadingSignal = signal(true);
  isLoading = computed(() => this.isLoadingSignal());

  // 🔹 animated values - initialize with default values
  animatedCounters: number[] = [0, 0, 0];

  private animated = false;
  private viewReady = false;
  private intersectionObserver?: IntersectionObserver;

  constructor() {
    // API call moved to ngAfterViewInit

    // Track counters changes via effect
    effect(() => {
      const counters = this.counters();
      // Update loading state when counters change
      this.updateLoadingState();
    });

    effect(() => {
      const counters = this.counters();

      // Initialize animatedCounters with default values when counters data arrives
      if (counters?.length) {
        const maxCounters = Math.min(counters.length, 3);
        if (this.animatedCounters.length !== maxCounters) {
          this.animatedCounters = new Array(maxCounters).fill(0);
        }
      }

      // Initialize counters when data arrives (but don't start animation yet)
      // Animation will start when section is visible
      if (counters?.length && this.viewReady && this.isBrowser) {
        this.setupIntersectionObserver();
      }
    });
  }

  private updateLoadingState(): void {
    const hasAboutData = !!this.aboutData?.title;
    const hasCounters = this.counters() && this.counters()!.length > 0;
    this.isLoadingSignal.set(!hasAboutData || !hasCounters);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['aboutData']) {
      this.updateLoadingState();
    }
  }

  ngAfterViewInit(): void {
    // ✅ تأكيد أن الـ DOM اترسم
    this.viewReady = true;
    
    // Update loading state after view init
    this.updateLoadingState();
    
    // Setup Intersection Observer if counters are already loaded
    const counters = this.counters();
    if (counters?.length && this.isBrowser) {
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
    if (!this.isBrowser || this.animated || !this.aboutSection?.nativeElement) {
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

    this.intersectionObserver.observe(this.aboutSection.nativeElement);
  }

  // =====================
  private startCounters(): void {
    if (this.animated) return;

    const counters = this.counters();
    if (!counters?.length) return;

    this.animated = true;
    // Initialize with 0 values for the first 3 counters
    const maxCounters = Math.min(counters.length, 3);
    this.animatedCounters = new Array(maxCounters).fill(0);

    counters.slice(0, 3).forEach((counter, index) => {
      this.animateCounter(counter.count, index);
    });
  }

  // ✅ requestAnimationFrame (مش setInterval)
  private animateCounter(target: number, index: number): void {
    const duration = 2000;
    const start = performance.now();
    // Safe requestAnimationFrame wrapper: use native RAF in browser
    // or fallback to setTimeout during SSR/testing.
    const raf = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame.bind(globalThis)
      : (cb: FrameRequestCallback) => setTimeout(() => cb((typeof performance !== 'undefined' && (performance as any).now) ? (performance as any).now() : Date.now()), 16);

    const animate = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      this.animatedCounters[index] = Math.floor(target * progress);
      // ✅ Trigger change detection manually
      this.cdr.detectChanges();

      if (progress < 1) {
        raf(animate);
      } else {
        this.animatedCounters[index] = target;
        // ✅ Trigger change detection for final value
        this.cdr.detectChanges();
      }
    };

    raf(animate);
  }

  getResponsiveImage(): string {
    return this.aboutData?.image?.desktop || '/images/placeholder.webp';
  }
}
