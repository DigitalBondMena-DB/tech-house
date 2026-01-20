import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, ElementRef, inject, OnInit, PLATFORM_ID, signal, viewChild } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { debounceTime, forkJoin, fromEvent } from 'rxjs';
import { FeatureService } from '../../core/services/featureService';
import { SharedFeatureService } from '../../core/services/sharedFeatureService';
import { AppButton } from '../../shared/components/app-button/app-button';
import { CircleSidebar } from '../../shared/components/circle-sidebar/circle-sidebar';
import { ContactUsSec } from '../../shared/components/contact-us-sec/contact-us-sec';
import { HomeAbout } from './home-about/home-about';
import { HomeBanner } from './home-banner/home-banner';
import { HomeBannersSec } from './home-banners-sec/home-banners-sec';
import { HomeBlogs } from './home-blogs/home-blogs';
import { HomeBooking } from './home-booking/home-booking';
import { HomeClientsReview } from './home-clients-review/home-clients-review';
import { HomeProjects } from './home-projects/home-projects';
import { HomeServices } from './home-services/home-services';
import { SeparatedSeoTags } from '../../core/services/separated-seo-tags';


@Component({
  selector: 'app-home',
  imports: [HomeBanner, HomeAbout, HomeBannersSec, HomeServices, HomeProjects, HomeBooking, HomeClientsReview, HomeBlogs, ContactUsSec, CircleSidebar, SkeletonModule, AppButton],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home implements OnInit {
  private featureService = inject(FeatureService);
  private separatedSeoTags = inject(SeparatedSeoTags)
  private sharedFeatureService = inject(SharedFeatureService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // 🔹 Home Data from API
  homeData = computed(() => this.featureService.homeData());

  // 🔹 Counters from SharedFeatureService
  counters = computed(() => this.sharedFeatureService.counters());

  videoReady = signal<boolean>(false);

  onVideoReady() {
    this.videoReady.set(true);
  }

  constructor() {
    // Watch for data loading completion and enable scroll when ready
    if (this.isBrowser) {
      afterNextRender(() => {
        if (!this.isSmallScreen()) {
          this.playVideoSafely();
        }
      });
      effect(() => {
        const homeData = this.homeData();
        if (homeData) {
          this.separatedSeoTags.getSeoTagsDirect(homeData.seotag, 'home');
        }
      });
    }
  }
  private playVideoSafely() {
    const video = this.videoRef()?.nativeElement;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    setTimeout(() => {
      video.play().catch(() => {
        console.warn('Autoplay blocked');
      });
    }, 100)
  }

  // 🔹 Computed properties for sections
  heroSection = computed(() => this.homeData()?.heroSection ?? null);
  aboutHome = computed(() => this.homeData()?.aboutHome ?? null);
  services = computed(() => this.homeData()?.services ?? []);
  projects = computed(() => this.homeData()?.projects ?? []);
  testimonials = computed(() => this.homeData()?.testimonials ?? []);
  blogs = computed(() => this.homeData()?.blogs ?? []);
  ctasection = computed(() => this.homeData()?.ctasection ?? null);
  private screenWidth = signal<number>(this.isBrowser ? window.innerWidth : 0);
  // 🔹 Partners and Clients from SharedFeatureService
  partners = computed(() => this.sharedFeatureService.partners());
  clients = computed(() => this.sharedFeatureService.clients());
  videoRef = viewChild<ElementRef<HTMLVideoElement>>('videoRef')
  // 🔹 Loading states for each section
  isAboutLoaded = computed(() => {
    const counters = this.counters();
    return !!(this.aboutHome() && counters && counters.length > 0);
  });
  isBannersLoaded = computed(() => {
    const partners = this.partners();
    const clients = this.clients();
    return !!(partners && partners.length > 0 && clients && clients.length > 0);
  });
  isServicesLoaded = computed(() => this.services()?.length > 0);
  isProjectsLoaded = computed(() => this.projects()?.length > 0);
  isBookingLoaded = computed(() => !!this.ctasection());
  isTestimonialsLoaded = computed(() => this.testimonials()?.length > 0);
  isBlogsLoaded = computed(() => this.blogs()?.length > 0);
  isSmallScreen = computed(() => this.screenWidth() < 1024);
  // 🔹 Check if all sections are loaded and visible (contact will only show when all sections are loaded)
  isAllDataLoaded = computed(() => {
    // Check hero section
    if (!this.heroSection()) return false;

    // Check about section
    if (!this.isAboutLoaded()) return false;

    // Check banners section (partners & clients)
    if (!this.isBannersLoaded()) return false;

    // Check services section
    if (!this.isServicesLoaded()) return false;

    // Check projects section
    if (!this.isProjectsLoaded()) return false;

    // Check booking section
    if (!this.isBookingLoaded()) return false;

    // Check testimonials section
    if (!this.isTestimonialsLoaded()) return false;

    // Check blogs section
    if (!this.isBlogsLoaded()) return false;

    // All sections are loaded
    return true;
  });

  // 🔹 Helper method to get responsive image based on screen size
  getResponsiveImage(image: { desktop: string; tablet: string; mobile: string } | undefined): string {
    if (!image) return '';
    // For now, return desktop. In a real app, you'd detect screen size
    return image.desktop;
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.screenWidth.set(window.innerWidth);
      console.log(this.screenWidth());

      fromEvent(window, 'resize').pipe(debounceTime(150)).subscribe(() => {
        this.screenWidth.set(window.innerWidth);
      })
      // Prevent scroll during page load - more robust method
      // this.disableScroll();
    }

    // 🔥 PARALLEL API LOADING - Load all APIs simultaneously to reduce critical path latency
    // This replaces sequential loading which was causing 2.6s+ latency
    forkJoin({
      home: this.featureService.loadHomeData(),
      counters: this.sharedFeatureService.loadCounters(),
      partners: this.sharedFeatureService.loadPartnersClients()
    }).subscribe({
      next: () => {
        // SEO logic moved to effect for better signal integration
      },
      error: (err: any) => {
        console.error('Error loading home page data:', err);
      }
    });
  }



}
