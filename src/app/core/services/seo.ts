import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { SeoITags as Seotag } from '../models/common';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
export interface SEOData {

  title?: string;

  description?: string;

  keywords?: string;

  image?: string;

  type?: string;

  author?: string;

}



export interface SEOConfig {

  updateLinks?: boolean;

  fallbackToDefault?: boolean;

}
@Injectable({
  providedIn: 'root',
})
export class SEOService {
  private meta = inject(Meta);
  private titleService = inject(Title);
  private document = inject(DOCUMENT);
  private router = inject(Router);
  private renderer: Renderer2;

  private readonly defaultImage = '/favicon.ico';
  private readonly baseUrl = 'https://test.techhouseksa.com';

  // 1. مراقبة المسار الحالي وتحويله لـ Signal مع فك تشفير الحروف العربية
  private currentUrlSignal = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => {
        // فك التشفير للتعامل مع الروابط العربية بشكل صحيح
        const decodedUrl = decodeURIComponent(this.router.url.split('?')[0]);
        return decodedUrl;
      })
    ),
    { initialValue: decodeURIComponent(this.router.url.split('?')[0]) }
  );

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * دالة المراقبة الأساسية للروابط
   */
  private getAnchor(): ChildNode | null {
    const anchor = this.document.querySelector('meta[name="og:locale"]');
    return anchor || this.document.head.firstChild;
  }
  initSEOListeners(): void {
    effect(() => {
      const url = this.currentUrlSignal();

      // إزالة /ar أو /en وأي علامات مائلة زائدة في النهاية
      const cleanPath = url.replace(/^\/(ar|en)/, '').replace(/\/$/, '');
      const fullUrl = `${this.baseUrl}${cleanPath || ''}`;

      // تحديث الروابط الأساسية
      this.updateCanonicalAndAlternate(fullUrl);

      // تحديث og:url ليكون مطابقاً
      this.meta.updateTag({ property: 'og:url', content: fullUrl });
    });
  }

  /**
   * تحديث Canonical و x-default في دالة واحدة لضمان التطابق
   */
  private updateCanonicalAndAlternate(url: string): void {
    // 1. تنظيف القديم
    const existing = this.document.querySelectorAll('link[rel="canonical"], link[rel="alternate"]');
    existing.forEach(el => this.renderer.removeChild(this.document.head, el));

    const anchor = this.getAnchor();
    const nextElement = anchor?.nextSibling; // العنصر الذي يلي النقطة الثابتة

    // 2. إنشاء الروابط
    const canonical = this.createLinkElement('canonical', url);
    const xDefault = this.createLinkElement('alternate', url, 'x-default');

    // 3. الإضافة باستخدام insertBefore لضمان الترتيب تحت الـ Static مباشرة
    this.renderer.insertBefore(this.document.head, canonical, nextElement);
    this.renderer.insertBefore(this.document.head, xDefault, nextElement);
  }
  private createLinkElement(rel: string, href: string, hreflang?: string): HTMLElement {
    const link = this.renderer.createElement('link');
    this.renderer.setAttribute(link, 'rel', rel);
    this.renderer.setAttribute(link, 'href', href);
    if (hreflang) {
      this.renderer.setAttribute(link, 'hreflang', hreflang);
    }
    return link;
  }
  // --- دوال الـ Meta Tags ---

  updateSEOFromBackend(seoData: Seotag, config: SEOConfig = { updateLinks: true, fallbackToDefault: false }): void {
    this.clearExistingMetaTags();

    const title = seoData.meta_title || (config.fallbackToDefault ? this.getDefaultTitle() : '');
    const description = seoData.meta_description || (config.fallbackToDefault ? this.getDefaultDescription() : '');

    if (title) this.setTitle(title);
    if (description) this.setDescription(description);
    this.setScripSchema(seoData.page_schema)
    this.setAdditionalMetaTags(seoData);
  }
  setScripSchema(pageSchema: string | undefined) {
    const existingSchemas = this.document.body.querySelectorAll('.dynamic-schema');
    existingSchemas.forEach(el => this.renderer.removeChild(this.document.body, el));

    if (!pageSchema || pageSchema.toLowerCase() === 'page schema' || pageSchema.trim() === '') return;

    try {
      const tempDiv = this.renderer.createElement('div');
      this.renderer.setProperty(tempDiv, 'innerHTML', pageSchema);

      const children = Array.from(tempDiv.childNodes);

      children.forEach((child: any) => {
        if (child.nodeType === 1) {
          this.renderer.addClass(child, 'dynamic-schema');
        }
        // الحقن المباشر في الـ Body
        this.renderer.appendChild(this.document.body, child);
      });

    } catch (e) {
      console.error('Error injecting direct schema scripts:', e);
    }
  }

  private setTitle(title: string): void {
    this.titleService.setTitle(title);
    this.meta.updateTag({ name: 'title', content: title });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'twitter:title', content: title });
  }

  private setDescription(description: string): void {
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'twitter:description', content: description });
  }

  private setAdditionalMetaTags(seoData: Seotag): void {
    const isSeoTag = this.isSeotag(seoData);

    // الكلمات المفتاحية
    const keywords = !isSeoTag && (seoData as SEOData).keywords
      ? (seoData as SEOData).keywords
      : 'ميدي تريد, التصدير, الاستيراد, بضائع';
    this.meta.updateTag({ name: 'keywords', content: keywords! });

    // الصورة
    const imgPath = !isSeoTag && (seoData as SEOData).image ? (seoData as SEOData).image : this.defaultImage;
    this.meta.updateTag({ property: 'og:image', content: this.baseUrl + imgPath });

    // إعدادات افتراضية
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'twitter:image', content: seoData?.image_url ?? '' });
    this.meta.updateTag({ property: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ property: 'twitter:site', content: '@techHouse' });
    this.meta.updateTag({ property: 'twitter:creator', content: '@techHouse' });
    this.meta.updateTag({ name: 'author', content: 'TechHouse' });
  }

  private clearExistingMetaTags(): void {
    const tags = ['name="description"', 'property="og:title"', 'name="keywords"', 'property="og:url"'];
    tags.forEach(tag => this.meta.removeTag(tag));
  }

  private isSeotag(data: any): data is Seotag {
    return data && ('meta_title' in data || 'meta_description' in data);
  }

  private getDefaultTitle() { return 'ميدي تريد | حلول التصدير والاستيراد'; }
  private getDefaultDescription() { return 'شركة ميدي تريد للتجارة الدولية...'; }
}