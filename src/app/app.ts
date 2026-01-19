import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, DOCUMENT, inject, PLATFORM_ID, Renderer2, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { debounceTime, fromEvent, tap } from 'rxjs';
import { SEOService } from './core/services/seo';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit {
  protected readonly title = signal('tech-house');
  private platformId = inject(PLATFORM_ID);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);
  private isBrowser = isPlatformBrowser(this.platformId);
  private seoService = inject(SEOService);
  constructor() {
    this.seoService.initSEOListeners()
  }
  ngAfterViewInit(): void {
    // Only run in browser (not SSR)
    if (!this.isBrowser) return;
    const scrollSource = fromEvent(window, 'scroll');
    scrollSource.pipe(tap(() => {
      this.renderer.addClass(this.document.body, 'is-scrolling');
    }),
      debounceTime(150)).subscribe(() => {
        this.renderer.removeClass(this.document.body, 'is-scrolling')
      })
  }
}
