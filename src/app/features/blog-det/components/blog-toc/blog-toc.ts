import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, NgZone, PLATFORM_ID, Renderer2, signal, ViewEncapsulation } from '@angular/core';
import { SafeHtmlPipe } from '../../../../shared/pipes/safe-html.pipe';
import { timer, map, tap, takeWhile } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-blog-toc',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe],
  template: `
    <div class="mb-8 md:mb-12 border border-[#440000] rounded-2xl p-8">
      <div class="toc-container">
        <div class="flex items-center gap-2 mb-4 md:mb-6">
          <img src="images/title/title.webp" alt="title-icon" loading="lazy" decoding="async">
          <h2 class="toc-title">محتويات المقالة</h2>
        </div>
        <div class="max-h-77.5 overflow-y-auto [direction:ltr]!">
          <ul class="toc-list">
            @for (section of sections(); track section.id; let i = $index) {
            <li class="toc-item" [class.toc-item-active]="isSectionActive(i)" (click)="navigateToSection(i)">
              <span class="toc-number">{{ i + 1 }}.</span>
              <span class="toc-text" [innerHTML]="section.title | safeHtml"></span>
            </li>
            }
            @if (sections().length === 0) {
            <li class="toc-item">
              <span class="toc-text">لا توجد عناوين متاحة</span>
            </li>
            }
          </ul>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class BlogToc {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly renderer = inject(Renderer2);

  sections = input.required<any[]>();
  isBrowser = isPlatformBrowser(this.platformId);

  activeSectionIndex = signal<number>(-1);

  constructor() {
    // Sync active section index when sections load
    effect(() => {
      const sections = this.sections();
      if (sections.length > 0) {
        this.activeSectionIndex.set(0);
      } else {
        this.activeSectionIndex.set(-1);
      }
    });

    // Handle heading highlight activation in the document
    effect(() => {
      if (!this.isBrowser) return;

      const activeIndex = this.activeSectionIndex();
      const sections = this.sections();
      if (sections.length === 0) return;

      // 1. Reset all currently active headings in the document to default
      const activeElements = document.querySelectorAll('.section-heading-active');
      activeElements.forEach(el => {
        this.renderer.removeClass(el, 'section-heading-active');
        this.renderer.addClass(el, 'section-heading');
      });

      // 2. Set the active class on the active heading element
      if (activeIndex >= 0 && activeIndex < sections.length) {
        const activeEl = document.querySelector(`#section-${activeIndex}`);
        if (activeEl) {
          this.renderer.addClass(activeEl, 'section-heading-active');
          this.renderer.removeClass(activeEl, 'section-heading');
        }
      }
    });
  }

  isSectionActive(index: number): boolean {
    return this.activeSectionIndex() === index;
  }

  navigateToSection(i: number) {
    if (i >= 0 && i < this.sections().length) {
      this.activeSectionIndex.set(i);
      if (this.isBrowser) {
        this.ngZone.runOutsideAngular(() => {
          const sectionId = `section-${i}`;
          let attempts = 0;

          timer(200, 100)
            .pipe(
              takeUntilDestroyed(this.destroyRef),
              map(() => document.querySelector(`#${sectionId}`)),
              tap((targetElement) => {
                attempts++;
                if (targetElement) {
                  requestAnimationFrame(() => {
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const scrollY = window.scrollY || window.pageYOffset;
                    const offsetPosition = elementPosition + scrollY - 120;

                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  });
                }
              }),
              takeWhile((targetElement) => !targetElement && attempts < 5, true)
            )
            .subscribe();
        });
      }
    }
  }
}
