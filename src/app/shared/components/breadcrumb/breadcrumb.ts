import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SEOService } from '../../../core/services/seo';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

const ROUTE_NAME_MAP: Record<string, string> = {
  'من-نحن': 'من نحن',
  'الخدمات': 'الخدمات',
  'المشاريع': 'المشاريع',
  'المقالات': 'المقالات',
  'اتصل-بنا': 'اتصل بنا',
  'سياسة-الخصوصية': 'سياسة الخصوصية'
};

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Breadcrumb implements OnInit, OnDestroy {
  // Optional custom items input (overrides auto-generated items)
  customItems = input<BreadcrumbItem[]>();

  // Optional custom title to replace the last segment's label in detail pages
  customTitle = input<string>();

  // Additional CSS class for the container
  customClass = input<string>('');

  private router = inject(Router);
  private seoService = inject(SEOService);
  private destroyRef = inject(DestroyRef);

  items = signal<BreadcrumbItem[]>([]);
  isVisible = signal<boolean>(false);

  constructor() {
    effect(() => {
      const custom = this.customItems();
      const title = this.customTitle();
      this.updateBreadcrumbs(custom, title);
    });
  }

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.updateBreadcrumbs(this.customItems(), this.customTitle());
      });
  }

  private updateBreadcrumbs(overrideItems?: BreadcrumbItem[], overrideTitle?: string): void {
    const rawUrl = this.router.url.split('?')[0];
    const decodedUrl = decodeURIComponent(rawUrl);

    // Exclusion check: Home page, Careers (/الوظائف), and 404
    if (
      decodedUrl === '/' ||
      decodedUrl === '' ||
      decodedUrl.startsWith('/الوظائف') ||
      decodedUrl.startsWith('/not-found')
    ) {
      this.isVisible.set(false);
      this.items.set([]);
      this.seoService.removeBreadcrumbSchema();
      return;
    }

    // 1. If explicit custom items are provided
    if (overrideItems && overrideItems.length > 0) {
      const fullList = [
        { label: 'الرئيسية', url: '/' },
        ...overrideItems
      ];
      this.items.set(fullList);
      this.isVisible.set(true);
      this.seoService.setBreadcrumbSchema(fullList);
      return;
    }

    // 2. Otherwise auto-build from URL path segments
    const segments = decodedUrl.split('/').filter(Boolean);
    const result: BreadcrumbItem[] = [
      { label: 'الرئيسية', url: '/' }
    ];

    let accumulatedPath = '';
    segments.forEach((segment, index) => {
      accumulatedPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      let label = ROUTE_NAME_MAP[segment];
      if (!label) {
        if (isLast && overrideTitle) {
          label = overrideTitle;
        } else {
          label = decodeURIComponent(segment).replace(/-/g, ' ');
        }
      }

      result.push({
        label,
        url: isLast ? undefined : accumulatedPath
      });
    });

    this.items.set(result);
    this.isVisible.set(true);
    this.seoService.setBreadcrumbSchema(result);
  }

  ngOnDestroy(): void {
    this.seoService.removeBreadcrumbSchema();
  }
}
