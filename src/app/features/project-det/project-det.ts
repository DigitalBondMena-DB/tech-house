import { CommonModule, isPlatformBrowser } from "@angular/common";
import { Component, computed, effect, inject, PLATFORM_ID, signal, ViewChild, ViewEncapsulation } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { CarouselComponent, CarouselModule, OwlOptions, SlidesOutputData } from 'ngx-owl-carousel-o';
import { FeatureService } from "../../core/services/featureService";
import { ContactUsSec } from "../../shared/components/contact-us-sec/contact-us-sec";

@Component({
  selector: 'app-project-det',
  standalone: true,
  imports: [CommonModule, ContactUsSec, CarouselModule],
  templateUrl: './project-det.html',
  styleUrl: './project-det.css',
  encapsulation: ViewEncapsulation.None
})
export class ProjectDet {

  private featureService = inject(FeatureService);
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);

  isBrowser = isPlatformBrowser(this.platformId);

  // Cache screen width to prevent ExpressionChangedAfterItHasBeenCheckedError
  private cachedScreenWidth = this.isBrowser ? window.innerWidth : 1024;

  // ===== LOADING STATE =====
  isLoading = signal<boolean>(true);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');

  // ===== DATA =====
  projectDetailsData = computed(() => this.featureService.projectDetailsData());
  project = computed(() => this.projectDetailsData()?.project ?? null);

  hasProject = computed(() => !!this.project());

  // ===== HERO IMAGE =====
  heroImage = computed(() => {
    const project = this.project();
    // Use banner_image if available, otherwise fallback to image
    const imageSource = project?.banner_image;
    return this.getResponsiveImage(imageSource);
  });

  // ===== LOGO =====
  projectLogo = computed(() => {
    return this.getResponsiveImage(this.project()?.logo);

  });

  // ===== SECTIONS =====
  sections = signal<any[]>([]);
  activeSectionIndex = signal<number>(0);

  activeSection = computed(() => {
    const index = this.activeSectionIndex();
    const sections = this.sections();
    if (index >= 0 && index < sections.length) {
      return sections[index] ?? null;
    }
    return null;
  });

  // ===== PROJECT DATA =====
  projectTypes = computed(() => this.project()?.project_types ?? []);
  projectTechnologies = computed(() => this.project()?.project_technologies ?? []);
  projectInformation = computed(() => this.project()?.project_information ?? []);
  projectSections = computed(() => this.project()?.projects_sections ?? []);
  projectImages = computed(() => this.project()?.project_images ?? []);

  customOptions: OwlOptions = {
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: false,
    dotsEach: false,
    navSpeed: 200,
    rtl: true,
    autoplay: true,
    margin: 16,
    responsive: {
      0: {
        items: 1
      },
      768: {
        items: 2
      },
      992: {
        items: 3
      },
    },
    nav: false,
  }

  // ===== CAROUSEL NAVIGATION =====
  @ViewChild('owlCarousel') owlCarousel!: CarouselComponent;
  activeSlideIndex = signal<number>(0);

  // Handle carousel slide change
  onCarouselTranslated(data: SlidesOutputData): void {
    if (data.startPosition !== undefined) {
      this.activeSlideIndex.set(data.startPosition);
    }
  }

  // Navigate to previous slide
  carouselPrev(): void {
    this.owlCarousel?.prev();
  }

  // Navigate to next slide
  carouselNext(): void {
    this.owlCarousel?.next();
  }

  // Go to specific slide
  goToSlide(index: number): void {
    const images = this.projectImages();
    if (index >= 0 && index < images.length) {
      this.owlCarousel?.to(images[index].id.toString());
      this.activeSlideIndex.set(index);
    }
  }

  // ===== IMAGE POPUP =====
  popupImage = signal<string | null>(null);
  popupImageIndex = signal<number>(0);

  openImagePopup(image: any): void {
    const images = this.projectImages();
    // Find the correct index by matching the image
    let foundIndex = images.findIndex((img: any) =>
      img.id === image.id ||
      img.main_image === image.main_image ||
      this.getProjectImageUrl(img) === this.getProjectImageUrl(image)
    );
    if (foundIndex === -1) foundIndex = 0;

    this.popupImage.set(this.getProjectImageUrl(image));
    this.popupImageIndex.set(foundIndex);
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeImagePopup(): void {
    this.popupImage.set(null);
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }

  nextPopupImage(): void {
    const images = this.projectImages();
    if (images.length === 0) return;
    const nextIndex = (this.popupImageIndex() + 1) % images.length;
    this.popupImageIndex.set(nextIndex);
    this.popupImage.set(this.getProjectImageUrl(images[nextIndex]));
  }

  prevPopupImage(): void {
    const images = this.projectImages();
    if (images.length === 0) return;
    const prevIndex = (this.popupImageIndex() - 1 + images.length) % images.length;
    this.popupImageIndex.set(prevIndex);
    this.popupImage.set(this.getProjectImageUrl(images[prevIndex]));
  }

  // ===== CONTENT =====
  fullContent = computed(() => {
    const html = this.project()?.text ?? '';
    if (html) {
      return this.sanitizer.bypassSecurityTrustHtml(html);
    }
    return '';
  });

  constructor() {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      if (!slug) {
        this.router.navigate(['/projects']);
        return;
      }
      // Reset state when slug changes
      this.isLoading.set(true);
      this.hasError.set(false);
      this.errorMessage.set('');
      // Load new data
      this.featureService.loadProjectDetails(slug);
    });

    // Watch for data changes - this will trigger when data arrives
    effect(() => {
      const data = this.projectDetailsData();
      const project = this.project();

      if (data !== null) {
        // Data has been loaded (even if null)
        this.isLoading.set(false);

        if (data && project) {
          // Data exists and project exists
          this.hasError.set(false);
          this.errorMessage.set('');
        } else if (data && !project) {
          // Data loaded but no project - try to extract from data

          // Try to extract project from different possible structures
          let extractedProject = null;
          if ((data as any).project) {
            extractedProject = (data as any).project;
          } else if ((data as any).projects && Array.isArray((data as any).projects.data)) {
            // It's a ProjectsResponse - get the first project or search by slug
            const projects = (data as any).projects.data;
            const currentSlug = this.route.snapshot.params['slug'];
            extractedProject = projects.find((p: any) => p.slug === currentSlug) || projects[0];
          } else if ((data as any).id) {
            // Direct project object
            extractedProject = data;
          }

          if (extractedProject) {
            // Manually set the project in the signal
            this.featureService.projectDetailsResponseSignal.set({ project: extractedProject } as any);
            this.hasError.set(false);
          } else {
            this.hasError.set(true);
            this.errorMessage.set('المشروع غير موجود');
          }
        }
      }
    });

    // Watch for sections
    effect(() => {
      const sections = this.projectSections();
      if (sections && sections.length > 0) {
        this.sections.set(sections);
        this.activeSectionIndex.set(0);
      } else {
        // Reset sections if empty
        this.sections.set([]);
        this.activeSectionIndex.set(0);
      }
    });

    // Timeout for loading state
    if (this.isBrowser) {
      setTimeout(() => {
        if (this.isLoading() && !this.project()) {
          this.isLoading.set(false);
          this.hasError.set(true);
          this.errorMessage.set('تعذر تحميل بيانات المشروع. يرجى المحاولة مرة أخرى.');
        }
      }, 10000); // 10 seconds timeout
    }
  }

  // ===== LOGIC =====
  navigateToSection(i: number) {
    if (i >= 0 && i < this.sections().length) {
      this.activeSectionIndex.set(i);
      // Scroll to top of content area
      if (this.isBrowser) {
        setTimeout(() => {
          const contentElement = document.querySelector('.project-main-content');
          if (contentElement) {
            // contentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }

  isSectionActive(index: number): boolean {
    const currentIndex = this.activeSectionIndex();
    return currentIndex >= 0 && currentIndex === index;
  }

  getResponsiveImage(images?: any): string {
    if (!images) return '/images/placeholder.webp';
    if (typeof images === 'string') return images;
    if (Array.isArray(images)) {
      return images[2] ?? images[0] ?? '/images/placeholder.webp';
    }
    // ResponsiveImage object - use cached width to prevent NG0100 error
    const width = this.cachedScreenWidth;
    if (width >= 1024) {
      return images.desktop ?? images.tablet ?? images.mobile ?? '/images/placeholder.webp';
    } else if (width >= 768) {
      return images.tablet ?? images.desktop ?? images.mobile ?? '/images/placeholder.webp';
    } else {
      return images.mobile ?? images.tablet ?? images.desktop ?? '/images/placeholder.webp';
    }
  }

  getTechnologyLogo(tech: any): string {
    // You can customize this based on your technology data structure
    if (tech.logo) {
      return this.getResponsiveImage(tech.logo);
    }
    if (tech.image) {
      return this.getResponsiveImage(tech.image);
    }
    return '/images/placeholder.webp';
  }

  getTechnologyName(tech: any): string {
    return tech.name ?? tech.title ?? tech.technology_name ?? '';
  }

  sanitizeHtml(html: string) {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  getProjectImageUrl(image: any): string {
    if (!image) return '/images/placeholder.webp';
    if (typeof image === 'string') return image;
    if (image.main_image) return image.main_image;
    return this.getResponsiveImage(image);
  }
}
