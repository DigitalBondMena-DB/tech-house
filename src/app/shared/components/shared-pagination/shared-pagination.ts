import { CommonModule } from '@angular/common';
import { Component, computed, input, effect, inject, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SEOService } from '../../../core/services/seo';

@Component({
  selector: 'app-shared-pagination',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './shared-pagination.html',
  styleUrl: './shared-pagination.css'
})
export class SharedPaginationComponent implements OnDestroy {
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  baseRoute = input.required<string | any[]>();
  queryParams = input<Record<string, any>>({});
  private seoService = inject(SEOService);

  constructor() {
    effect(() => {
      const current = this.currentPage();
      const total = this.totalPages();
      const base = this.baseRoute();

      const baseUrlStr = Array.isArray(base) ? base.join('/') : base;

      let prevUrl = null;
      if (current > 1) {
        // Construct query string manually for SEO tag
        const params = new URLSearchParams(this.getRouteParams(current - 1)).toString();
        prevUrl = `${baseUrlStr}${params ? '?' + params : ''}`;
      }

      let nextUrl = null;
      if (current < total) {
        const params = new URLSearchParams(this.getRouteParams(current + 1)).toString();
        nextUrl = `${baseUrlStr}${params ? '?' + params : ''}`;
      }

      this.seoService.setPaginationLinks(prevUrl, nextUrl);
    });
  }

  pages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const visiblePages = 5;

    let start = Math.max(1, current - Math.floor(visiblePages / 2));
    let end = start + visiblePages - 1;

    if (end > total) {
      end = total;
      start = Math.max(1, end - visiblePages + 1);
    }

    const pagesArray: (number | string)[] = [];

    if (start > 1) {
      pagesArray.push(1);
      if (start > 2) {
        pagesArray.push('...');
      }
    }

    for (let i = start; i <= end; i++) {
      pagesArray.push(i);
    }

    if (end < total) {
      if (end < total - 1) {
        pagesArray.push('...');
      }
      pagesArray.push(total);
    }

    return pagesArray;
  });

  getRouteParams(page: number): Record<string, any> {
    return { ...this.queryParams(), page };
  }

  ngOnDestroy(): void {
    // Clean up pagination links when the component is destroyed (i.e. leaving the page)
    this.seoService.setPaginationLinks(null, null);
  }
}
