import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, NgZone, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { distinctUntilChanged, fromEvent, map, throttleTime } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class Navbar implements OnInit {
  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);

  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private isBrowser = isPlatformBrowser(this.platformId);

  ngOnInit(): void {
    if (this.isBrowser) {
      this.setupScrollStream();
    }
  }
  private setupScrollStream(): void {
    this.ngZone.runOutsideAngular(() => {
      fromEvent(window, 'scroll', { passive: true })
        .pipe(
          throttleTime(20, undefined, { leading: true, trailing: true }),
          map(() => {
            const isLargeScreen = window.innerWidth >= 768;
            return isLargeScreen && window.scrollY > 100;
          }),
          distinctUntilChanged()
        )
        .subscribe((shouldBeScrolled) => {
          this.isScrolled.set(shouldBeScrolled);
        });
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(value => !value);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }
}
