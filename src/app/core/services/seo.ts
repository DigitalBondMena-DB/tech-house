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
  private readonly baseUrl = 'https://techhouseksa.com';

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

  private getAnchor(): ChildNode | null {
    const anchor = this.document.querySelector('meta[name="og:locale"]');
    return anchor || this.document.head.firstChild;
  }
  initSEOListeners(): void {
  effect(() => {
    const url = this.currentUrlSignal();
    const cleanPath = url.replace(/^\/(ar|en)/, '').replace(/\/$/, '');
    const fullUrl = `${this.baseUrl}${cleanPath || ''}`;

    this.updateCanonicalAndAlternate(fullUrl);

    this.updateDynamicMetaTag('name', 'og:url', fullUrl);
  });
}

  private updateCanonicalAndAlternate(url: string): void {
    const existing = this.document.querySelectorAll('link[rel="canonical"], link[rel="alternate"]');
    existing.forEach(el => this.renderer.removeChild(this.document.head, el));

    const anchor = this.getAnchor();
    const nextElement = anchor?.nextSibling; // العنصر الذي يلي النقطة الثابتة

    const canonical = this.createLinkElement('canonical', url);
    const xDefault = this.createLinkElement('alternate', url, 'x-default');

    this.renderer.insertBefore(this.document.head, canonical, nextElement);
    this.renderer.insertBefore(this.document.head, xDefault, nextElement);
  }
  private updateDynamicMetaTag(attr: string, value: string, contentValue: string): void {
    
  const existing = this.document.querySelectorAll(`meta[${attr}="${value}"]`);
  existing.forEach(el => this.renderer.removeChild(this.document.head, el));

  const meta = this.renderer.createElement('meta');
  
  this.renderer.setAttribute(meta, attr, value); 
  
  this.renderer.setAttribute(meta, 'content', contentValue); 

  const anchor = this.getAnchor();
  this.renderer.insertBefore(this.document.head, meta, anchor);
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

  setPaginationLinks(prevUrl?: string | null, nextUrl?: string | null): void {
    // Remove existing pagination links
    const existing = this.document.querySelectorAll('link[rel="prev"], link[rel="next"]');
    existing.forEach(el => this.renderer.removeChild(this.document.head, el));

    const anchor = this.getAnchor();

    if (prevUrl) {
      const fullPrev = prevUrl.startsWith('http') ? prevUrl : `${this.baseUrl}${prevUrl.startsWith('/') ? '' : '/'}${prevUrl}`;
      const prevLink = this.createLinkElement('prev', fullPrev);
      this.renderer.insertBefore(this.document.head, prevLink, anchor);
    }

    if (nextUrl) {
      const fullNext = nextUrl.startsWith('http') ? nextUrl : `${this.baseUrl}${nextUrl.startsWith('/') ? '' : '/'}${nextUrl}`;
      const nextLink = this.createLinkElement('next', fullNext);
      this.renderer.insertBefore(this.document.head, nextLink, anchor);
    }
  }

  /**
   * Remove injected Breadcrumb Schema script if present
   */
  removeBreadcrumbSchema(): void {
    const existing = this.document.querySelectorAll('script.breadcrumb-schema');
    existing.forEach(el => this.renderer.removeChild(el.parentNode || this.document.head, el));
  }

  /**
   * Generates and injects Schema.org BreadcrumbList JSON-LD script.
   */
  setBreadcrumbSchema(items: { label: string; url?: string }[]): void {
    this.removeBreadcrumbSchema();

    if (!items || items.length === 0) return;

    const itemListElement = items.map((item, index) => {
      const fullUrl = item.url
        ? (item.url.startsWith('http') ? item.url : `${this.baseUrl}${item.url.startsWith('/') ? '' : '/'}${item.url}`)
        : undefined;

      const listItem: any = {
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.label
      };

      if (fullUrl) {
        listItem.item = fullUrl;
      }

      return listItem;
    });

    const schemaObj = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': itemListElement
    };

    try {
      const script = this.renderer.createElement('script');
      this.renderer.setAttribute(script, 'type', 'application/ld+json');
      this.renderer.addClass(script, 'breadcrumb-schema');
      const text = this.renderer.createText(JSON.stringify(schemaObj, null, 2));
      this.renderer.appendChild(script, text);
      this.renderer.appendChild(this.document.head, script);
    } catch (e) {
      console.error('Error injecting Breadcrumb schema script:', e);
    }
  }

  updateSEOFromBackend(seoData: Seotag, config: SEOConfig = { updateLinks: true, fallbackToDefault: false }): void {
    this.clearExistingMetaTags();

    const title = seoData?.meta_title ;
    const description = seoData?.meta_description;

    if (title) this.setTitle(title);
    if (description) this.setDescription(description);
    this.setScripSchema(seoData.page_schema)
    this.setAdditionalMetaTags(seoData);
  }
  setScripSchema(pageSchema: string | undefined) {
    const existingSchemas = this.document.body.querySelectorAll('.dynamic-schema');
    existingSchemas.forEach(el => this.renderer.removeChild(this.document.body, el));
    
    if (
    !pageSchema || 
    !pageSchema.includes('application/ld+json')
  ) {
    return;
  }

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
    if(!title) return;
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

    // الصورة
    const rawImg = seoData?.image_url || (!isSeoTag && (seoData as SEOData).image ? (seoData as SEOData).image : null);
    let fullImgUrl = `${this.baseUrl}${this.defaultImage}`;

    if (rawImg) {
      if (rawImg.startsWith('http://') || rawImg.startsWith('https://')) {
        fullImgUrl = rawImg;
      } else {
        fullImgUrl = rawImg.startsWith('/') ? `${this.baseUrl}${rawImg}` : `${this.baseUrl}/${rawImg}`;
      }
    }

    this.meta.updateTag({ property: 'og:image', content: fullImgUrl });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'twitter:image', content: fullImgUrl });
    this.meta.updateTag({ property: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ property: 'twitter:site', content: '@techHouse' });
    this.meta.updateTag({ property: 'twitter:creator', content: '@techHouse' });
    this.meta.updateTag({ name: 'author', content: 'TechHouse' });
  }

  private clearExistingMetaTags(): void {
    const tags = ['name="description"', 'property="og:title"', 'property="og:url"'];
    tags.forEach(tag => this.meta.removeTag(tag));
    this.removeArticleSchema();
  }

  /**
   * Remove injected Article Schema script if present
   */
  removeArticleSchema(): void {
    const existing = this.document.querySelectorAll('script.article-schema');
    existing.forEach(el => this.renderer.removeChild(el.parentNode || this.document.head, el));
  }

  /**
   * Generates and injects Schema.org Article JSON-LD script for Blog Details pages.
   */
  setArticleSchema(blog: any): void {
    this.removeArticleSchema();

    if (!blog) return;

    let imageUrl = '/images/logo/logo.webp';
    if (typeof blog.banner_image === 'string' && blog.banner_image) {
      imageUrl = blog.banner_image;
    } else if (Array.isArray(blog.banner_image) && blog.banner_image.length > 0) {
      imageUrl = blog.banner_image[2] || blog.banner_image[0];
    } else if (typeof blog.image === 'string' && blog.image) {
      imageUrl = blog.image;
    } else if (Array.isArray(blog.image) && blog.image.length > 0) {
      imageUrl = blog.image[2] || blog.image[0];
    }

    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${this.baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    const articleUrl = `${this.baseUrl}/المقالات/${encodeURIComponent(blog.slug || '')}`;

    const schemaObj = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': blog.title || blog.meta_title || '',
      'description': blog.small_text || blog.meta_description || '',
      'image': [fullImageUrl],
      'url': articleUrl,
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': articleUrl
      },
      'author': {
        '@type': 'Organization',
        'name': 'بيت التكنولوجيا',
        'url': this.baseUrl
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'بيت التكنولوجيا',
        'url': this.baseUrl,
        'logo': {
          '@type': 'ImageObject',
          'url': `${this.baseUrl}/images/logo/logo.webp`
        }
      },
      'datePublished': blog.publish_at_ar || undefined,
      'dateModified': blog.update_date || blog.publish_at_ar || undefined
    };

    try {
      const script = this.renderer.createElement('script');
      this.renderer.setAttribute(script, 'type', 'application/ld+json');
      this.renderer.addClass(script, 'article-schema');
      const text = this.renderer.createText(JSON.stringify(schemaObj, null, 2));
      this.renderer.appendChild(script, text);
      this.renderer.appendChild(this.document.head, script);
    } catch (e) {
      console.error('Error injecting Article schema script:', e);
    }
  }

  private isSeotag(data: any): data is Seotag {
    return data && ('meta_title' in data || 'meta_description' in data);
  }
}