import { isPlatformBrowser } from '@angular/common';
import { Component, HostListener, inject, NgZone, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { rafThrottle } from '../../../core/utils/performance.utils';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink,RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit, OnDestroy {
  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);
  
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private isBrowser = isPlatformBrowser(this.platformId);
  private throttledScrollHandler?: () => void;
  private resizeHandler?: () => void;

  ngOnInit(): void {
    if (this.isBrowser) {
      // Run scroll handler outside Angular's change detection to reduce reflow
      this.throttledScrollHandler = rafThrottle(() => {
        this.ngZone.runOutsideAngular(() => {
          requestAnimationFrame(() => {
            const scrollPosition = window.scrollY;
            // Check if screen is medium or larger (md breakpoint = 768px)
            const isLargeScreen = window.innerWidth >= 768;
            // Only update signal inside Angular zone and only on large screens
            this.ngZone.run(() => {
              this.isScrolled.set(isLargeScreen && scrollPosition > 100);
            });
          });
        });
      });
      
      // Use passive event listener for better scroll performance
      window.addEventListener('scroll', this.throttledScrollHandler, { passive: true });
      
      // Handle window resize to reset scroll state when switching to small screen
      this.resizeHandler = () => {
        this.ngZone.run(() => {
          const isLargeScreen = window.innerWidth >= 768;
          if (!isLargeScreen) {
            this.isScrolled.set(false);
          }
        });
      };
      window.addEventListener('resize', this.resizeHandler);
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      if (this.throttledScrollHandler) {
        window.removeEventListener('scroll', this.throttledScrollHandler);
      }
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
      }
    }
  }

  // Keep @HostListener for backward compatibility but make it no-op in browser
  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Handler moved to ngOnInit with better performance
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(value => !value);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }
}
