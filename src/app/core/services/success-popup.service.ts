import { Injectable, signal, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface SuccessPopupConfig {
  title?: string;
  message?: string;
  buttonText?: string;
}

const DEFAULT_TITLE = 'شكرا لتواصلك معنا!';
const DEFAULT_MESSAGE = 'نشكركم على تواصلكم مع بيت التكنولوجيا، سيراجع فريقنا رسالتكم ويتواصل معكم في أقرب وقت ممكن.';
const DEFAULT_BUTTON_TEXT = 'العودة إلى الصفحة الرئيسية';

@Injectable({
  providedIn: 'root'
})
export class SuccessPopupService {
  private location = inject(Location);
  private router = inject(Router);

  readonly isOpen = signal<boolean>(false);
  readonly title = signal<string>(DEFAULT_TITLE);
  readonly message = signal<string>(DEFAULT_MESSAGE);
  readonly buttonText = signal<string>(DEFAULT_BUTTON_TEXT);

  constructor() {
    this.checkUrlForDone();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkUrlForDone();
    });
  }

  show(config?: SuccessPopupConfig): void {
    if (config?.title !== undefined) {
      this.title.set(config.title);
    } else {
      this.title.set(DEFAULT_TITLE);
    }

    if (config?.message !== undefined) {
      this.message.set(config.message);
    } else {
      this.message.set(DEFAULT_MESSAGE);
    }

    if (config?.buttonText !== undefined) {
      this.buttonText.set(config.buttonText);
    } else {
      this.buttonText.set(DEFAULT_BUTTON_TEXT);
    }

    this.isOpen.set(true);

    const currentUrl = decodeURIComponent(this.location.path().split('?')[0]);
    if (!currentUrl.endsWith('/تم')) {
      const queryParams = this.router.parseUrl(this.router.url).queryParams;
      const queryString = Object.keys(queryParams).length > 0
        ? '?' + new URLSearchParams(queryParams as any).toString()
        : '';
      this.location.replaceState(currentUrl + '/تم' + queryString);
    }
  }

  hide(): void {
    this.isOpen.set(false);

    const currentUrl = decodeURIComponent(this.location.path().split('?')[0]);
    if (currentUrl.endsWith('/تم')) {
      const baseUrl = currentUrl.replace('/تم', '');
      const queryParams = this.router.parseUrl(this.router.url).queryParams;
      const queryString = Object.keys(queryParams).length > 0
        ? '?' + new URLSearchParams(queryParams as any).toString()
        : '';
      this.location.replaceState(baseUrl + queryString);
    }
  }

  private checkUrlForDone(): void {
    const currentUrl = decodeURIComponent(this.router.url.split('?')[0]);
    if (currentUrl.endsWith('/تم')) {
      this.isOpen.set(true);
    }
  }
}
