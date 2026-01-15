import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, computed, effect, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { environment } from '../../../environments/environment';
import { FeatureService } from '../../core/services/featureService';
import { ContactUsSec } from '../../shared/components/contact-us-sec/contact-us-sec';
import { HeroSection } from '../../shared/components/hero-section/hero-section';
import { SectionTitle } from '../../shared/components/section-title/section-title';

@Component({
  selector: 'app-blogs',
  imports: [
    CommonModule,
    HeroSection,
    ContactUsSec,
    SectionTitle,
    PaginatorModule,
    SkeletonModule
  ],
  templateUrl: './blogs.html',
  styleUrl: './blogs.css'
})
export class Blogs implements OnInit, AfterViewInit {
  private featureService = inject(FeatureService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  blogsData = computed(() => this.featureService.blogsData());
  bannerSection = computed(() => this.blogsData()?.bannerSection ?? null);
  blogs = computed(() => this.blogsData()?.blogs ?? null);
  blogItems = computed(() => this.blogs()?.data ?? []);
  articlesTitle = 'المقالات';
  
  // Pagination state
  rows = signal(9);
  totalRecords = computed(() => this.blogs()?.total ?? 0);
  currentPage = computed(() => this.blogs()?.current_page ?? 1);
  totalPages = computed(() => this.blogs()?.last_page ?? 1);
  first = computed(() => (this.currentPage() - 1) * this.rows());

  // 🔹 Check if all sections are loaded (contact will only show when all sections are loaded)
  isAllDataLoaded = computed(() => {
    if (!this.bannerSection()) return false;
    if (!this.blogItems()?.length) return false;
    return true;
  });

  constructor() {
    // Watch for data loading completion and scroll to top when ready
    if (this.isBrowser) {
      effect(() => {
        const allLoaded = this.isAllDataLoaded();
        if (allLoaded) {
          // Force scroll to top when all data is loaded
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
          }, 50);
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
    // Load blogs data when view initializes
    this.loadBlogs(1);
  }

  loadBlogs(page: number): void {
    this.featureService.loadBlogsData(page);
  }

  onPageChange(event: PaginatorState): void {
    if (event.first !== undefined && event.rows !== undefined) {
      const newPage = Math.floor(event.first / event.rows) + 1;
      this.loadBlogs(newPage);
    }
  }

  navigateToBlogDetail(blog: any): void {
    this.router.navigate(['/blog-det', blog.slug]);
  }

  getResponsiveImage(image: { desktop: string; tablet: string; mobile: string } | null | undefined): string {
    if (!image) return '/images/placeholder.webp';
    let imageUrl = '';
    if (this.isBrowser) {
      const width = window.innerWidth;
      if (width < 768) imageUrl = image.mobile || image.desktop || '';
      else if (width < 1024) imageUrl = image.tablet || image.desktop || '';
      else imageUrl = image.desktop || '';
    } else imageUrl = image.desktop || '';
    return this.addBaseUrlIfNeeded(imageUrl);
  }

  private addBaseUrlIfNeeded(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = environment.apiUrl.replace('/api', '');
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${baseUrl}/${cleanUrl}`;
  }
}
