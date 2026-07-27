import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  PLATFORM_ID,
  signal,
  viewChild,
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
  styleUrl: './home-about.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeAbout implements AfterViewInit, OnDestroy {

  aboutData = input<AboutHome | null>(null);

  aboutSection = viewChild<ElementRef<HTMLElement>>('aboutSection');

  private sharedFeatureService = inject(SharedFeatureService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = signal<boolean>(isPlatformBrowser(this.platformId));

  // 🔹 counters from API (signal)
  counters = computed(() => this.sharedFeatureService.counters());

  // 🔹 Loading state as signal
  private isLoadingSignal = signal(true);

  // 🔹 animated values - initialize with default values
  animatedCounters = signal<number[]>([0, 0, 0]);

  private animated = signal<boolean>(false);
  private viewReady = signal<boolean>(false);
  private intersectionObserver?: IntersectionObserver;

  constructor() {
    // API call moved to ngAfterViewInit

    // Track inputs/counters changes via effect
    effect(() => {
      this.updateLoadingState();
    });

    effect(() => {
      const counters = this.counters();

      // Initialize animatedCounters with default values when counters data arrives
      if (counters?.length) {
        const maxCounters = Math.min(counters.length, 3);
        if (this.animatedCounters().length !== maxCounters) {
          this.animatedCounters.set(new Array(maxCounters).fill(0));
        }
      }

      // Initialize counters when data arrives (but don't start animation yet)
      // Animation will start when section is visible
      if (counters?.length && this.viewReady() && this.isBrowser()) {
        this.setupIntersectionObserver();
      }
    });
  }

  private updateLoadingState(): void {
    const hasAboutData = !!this.aboutData()?.title;
    this.isLoadingSignal.set(!hasAboutData);
  }


  ngAfterViewInit(): void {
    // ✅ تأكيد أن الـ DOM اترسم
    this.viewReady.set(true);

    // Update loading state after view init
    this.updateLoadingState();

    // Setup Intersection Observer if counters are already loaded
    const counters = this.counters();
    if (counters?.length && this.isBrowser()) {
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
    if (!this.isBrowser() || this.animated() || !this.aboutSection()?.nativeElement) {
      return;
    }

    // Create Intersection Observer to trigger animation when section is visible
    const aboutElement = this.aboutSection()?.nativeElement;

    // تأكد أن العنصر موجود فعلاً قبل البدء
    if (aboutElement) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !this.animated()) {
              const counters = this.counters();
              if (counters?.length) {
                // تنفيذ الـ animation
                this.startCounters();
                this.animated.set(true); // علامة لعدم التكرار

                // وقف المراقبة تماماً لتوفير الأداء
                this.intersectionObserver?.disconnect();
              }
            }
          });
        },
        { threshold: 0.3 }
      );

      this.intersectionObserver.observe(aboutElement);
    }
  }

  // =====================
  private startCounters(): void {
    if (this.animated()) return;

    const counters = this.counters();
    if (!counters?.length) return;

    this.animated.set(true);
    // Initialize with 0 values for the first 3 counters
    const maxCounters = Math.min(counters.length, 3);
    this.animatedCounters.set(new Array(maxCounters).fill(0));

    counters.slice(0, 3).forEach((counter, index) => {
      this.animateCounter(counter.count, index);
    });
  }

  // ✅ requestAnimationFrame (مش setInterval)
  private animateCounter(target: number, index: number): void {
    const duration = 2000;
    const start = performance.now();

    const animate = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      const newValue = Math.floor(target * progress);

      if (this.animatedCounters()[index] !== newValue) {
        this.animatedCounters.update((prev: number[]) => {
          const updated = [...prev];
          updated[index] = newValue;
          return updated;
        });
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  getResponsiveImage(): string {
    return this.aboutData()?.image?.desktop || '/images/placeholder.webp';
  }
}
