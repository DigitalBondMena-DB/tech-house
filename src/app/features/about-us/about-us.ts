import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, NgZone, OnDestroy, OnInit, PLATFORM_ID, viewChildren } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SkeletonModule } from 'primeng/skeleton';
import { environment } from '../../../environments/environment';
import { FeatureService } from '../../core/services/featureService';
import { SharedFeatureService } from '../../core/services/sharedFeatureService';
import { AppButton } from '../../shared/components/app-button/app-button';
import { BannerReverse } from '../../shared/components/banner-reverse/banner-reverse';
import { Banner } from '../../shared/components/banner/banner';
import { ContactUsSec } from '../../shared/components/contact-us-sec/contact-us-sec';
import { HeroSection } from '../../shared/components/hero-section/hero-section';
import { SectionTitle } from '../../shared/components/section-title/section-title';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Register GSAP plugins only in browser
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

@Component({
  selector: 'app-about-us',
  imports: [CommonModule, HeroSection, SectionTitle, AppButton, Banner, BannerReverse, ContactUsSec, SkeletonModule],
  templateUrl: './about-us.html',
  styleUrls: ['./about-us.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutUs implements OnInit, AfterViewInit, OnDestroy {
  private readonly timeouts = new Map<string, NodeJS.Timeout>()
  private readonly destroyRef = inject(DestroyRef)
  private featureService = inject(FeatureService);
  private sharedFeatureService = inject(SharedFeatureService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private ngZone = inject(NgZone);
  cards = viewChildren<ElementRef<HTMLElement>>('cardElement');

  // Signals
  aboutData = this.featureService.aboutData;
  bannerSection = computed(() => this.aboutData()?.bannerSection ?? null);
  aboutInformation = computed(() => this.aboutData()?.aboutInformation ?? null);
  aboutSections = computed(() => {
    const sections = this.aboutData()?.aboutSection ?? [];
    return sections.filter(s => s.is_active).sort((a, b) => a.order - b.order);
  });

  partnersTitle = "شركاؤنا وعملاؤنا";
  contactBtnText = "تواصل معنا";
  partners = this.sharedFeatureService.partners;
  clients = this.sharedFeatureService.clients;

  // 🔹 Check if all sections are loaded (contact will only show when all sections are loaded)
  isAllDataLoaded = computed(() => {
    // Check banner section
    if (!this.bannerSection()) return false;

    // Check about information
    if (!this.aboutInformation()) return false;

    // Check about sections
    if (!this.aboutSections()?.length) return false;

    // Check partners or clients
    if (!this.partners()?.length && !this.clients()?.length) return false;

    return true;
  });

  constructor() {
    // Watch for data loading completion and scroll to top when ready
    if (this.isBrowser) {
      effect(() => {
        const allLoaded = this.isAllDataLoaded();
        if (allLoaded) {
          // Force scroll to top when all data is loaded
          const scrollTimer = setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
          }, 50);
          this.timeouts.set('scrollTrigger', scrollTimer);
        }
      });
    }
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

  }

  ngAfterViewInit(): void {
    this.sharedFeatureService.loadPartnersClients().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => { });
    this.featureService.loadAboutData();
    if (this.isBrowser) {
      // Wait for cards to be rendered
      const animationTimer = setTimeout(() => {
        this.animateCards();
      }, 100);
      this.timeouts.set('animationTimer', animationTimer);
    }
  }

  private animateCards(): void {
    // أولاً: استدعاء الـ Signal للحصول على المصفوفة
    const cardElements = this.cards();

    if (!cardElements || cardElements.length === 0) return;

    this.ngZone.runOutsideAngular(() => {
      // التكرار على العناصر؛ كل 'card' هنا هو ElementRef
      cardElements.forEach((card: ElementRef<HTMLElement>, index: number) => {
        const element = card.nativeElement; // الآن nativeElement ستعمل بشكل صحيح

        gsap.from(element, {
          scale: 0.8,
          opacity: 0,
          y: 50,
          duration: 0.8,
          ease: 'power3.out',
          delay: index * 0.15,
          scrollTrigger: {
            trigger: element,
            start: 'top 90%',
            toggleActions: 'play none none none'
          }
        });
      });
    });
  }





  trackByOrder(index: number, item: any): number {
    return item.order;
  }

  getResponsiveImage(image: { desktop: string; tablet: string; mobile: string } | null | undefined): string {
    if (!image) return '/images/placeholder.png';

    let imageUrl = '';
    if (this.isBrowser) {
      const width = window.innerWidth;
      imageUrl = width < 768 ? (image.mobile || image.desktop || '') :
        width < 1024 ? (image.tablet || image.desktop || '') :
          (image.desktop || '');
    } else {
      imageUrl = image.desktop || '';
    }
    return this.addBaseUrlIfNeeded(imageUrl);
  }

  private addBaseUrlIfNeeded(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const baseUrl = environment.apiUrl.replace('/api', '');
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${baseUrl}/${cleanUrl}`;
  }
  private clearAllTimeouts(): void {
    if (this.timeouts.size > 0) {
      this.timeouts.forEach((id, key) => {
        clearTimeout(id);
      })
      this.timeouts.clear();
    }
  }
  ngOnDestroy(): void {
    if (this.isBrowser) {
      ScrollTrigger.getAll().forEach(t => t.kill());
      this.clearAllTimeouts();
    }
  }
}