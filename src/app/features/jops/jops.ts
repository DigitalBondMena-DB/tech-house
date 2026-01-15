import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, computed, effect, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { environment } from '../../../environments/environment';
import { FeatureService } from '../../core/services/featureService';
import { ContactUsSec } from '../../shared/components/contact-us-sec/contact-us-sec';

@Component({
  selector: 'app-jops',
  imports: [CommonModule, ContactUsSec, SkeletonModule],
  templateUrl: './jops.html',
  styleUrl: './jops.css'
})
export class Jops implements OnInit, AfterViewInit {
  private featureService = inject(FeatureService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  router = inject(Router);

  jobsData = computed(() => this.featureService.jobsData());
  bannerSection = computed(() => this.jobsData()?.bannerSection ?? null);
  jobCategories = computed(() => this.jobsData()?.jobCategories ?? []);
  
  // All jobs from all categories (for "الكل" view)
  allJobs = computed(() => {
    const categories = this.jobCategories();
    const allJobsList: any[] = [];
    categories.forEach(category => {
      if (category.jobs && category.jobs.length > 0) {
        allJobsList.push(...category.jobs);
      }
    });
    return allJobsList;
  });
  
  // Selected category for filtering
  selectedCategoryId = signal<number | null>(null);
  selectedCategoryIndex = signal<number>(0);
  
  // Jobs to display based on selected category
  displayedJobs = computed(() => {
    const categoryId = this.selectedCategoryId();
    if (categoryId === null) {
      return this.allJobs();
    }
    const category = this.jobCategories().find(cat => cat.id === categoryId);
    return category?.jobs ?? [];
  });
  
  // Total jobs count for "الكل"
  totalJobsCount = computed(() => {
    return this.jobCategories().reduce((total, category) => total + category.jobs_count, 0);
  });

  // 🔹 Check if all sections are loaded (contact will only show when all sections are loaded)
  isAllDataLoaded = computed(() => {
    if (!this.bannerSection()) return false;
    if (!this.jobCategories()?.length) return false;
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
    // Load jobs data when view initializes
    this.featureService.loadJobsData();
  }

  selectCategory(categoryId: number | null, index: number): void {
    this.selectedCategoryId.set(categoryId);
    this.selectedCategoryIndex.set(index);
    // No need to reload data, we filter from existing data
  }

  getResponsiveImage(image: { desktop: string; tablet: string; mobile: string } | null | undefined): string {
    if (!image) return '';
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

  // Navigate to job details page
  navigateToJobDetails(job: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (job?.slug) {
      this.router.navigate(['/job-det', job.slug]);
    }
  }
}
