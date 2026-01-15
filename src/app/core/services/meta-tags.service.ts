import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface MetaTagsConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string; // 'website', 'article', etc.
  siteName?: string;
  locale?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterSite?: string;
  twitterCreator?: string;
  canonicalUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MetaTagsService {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private readonly defaultSiteName = 'TechHouse';
  private readonly defaultLocale = 'ar_SA';

  /**
   * Update meta tags for SEO
   * @param config Meta tags configuration
   */
  updateMetaTags(config: MetaTagsConfig): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Update page title
    if (config.title) {
      const fullTitle = config.title.includes(this.defaultSiteName)
        ? config.title
        : `${config.title} | ${this.defaultSiteName}`;
      this.titleService.setTitle(fullTitle);
    }

    // Update or create meta description
    if (config.description) {
      this.updateOrCreateMetaTag('description', config.description);
    }

    // Update or create meta keywords
    if (config.keywords) {
      this.updateOrCreateMetaTag('keywords', config.keywords);
    }

    // Update or create author
    if (config.author) {
      this.updateOrCreateMetaTag('author', config.author);
    }

    // Open Graph Tags
    this.updateOrCreateMetaTag('og:title', config.title || '');
    this.updateOrCreateMetaTag('og:description', config.description || '');
    this.updateOrCreateMetaTag('og:image', config.image || '');
    this.updateOrCreateMetaTag('og:url', config.url || this.getCurrentUrl());
    this.updateOrCreateMetaTag('og:type', config.type || 'website');
    this.updateOrCreateMetaTag('og:site_name', config.siteName || this.defaultSiteName);
    this.updateOrCreateMetaTag('og:locale', config.locale || this.defaultLocale);

    // Article specific tags
    if (config.type === 'article') {
      if (config.publishedTime) {
        this.updateOrCreateMetaTag('article:published_time', config.publishedTime);
      }
      if (config.modifiedTime) {
        this.updateOrCreateMetaTag('article:modified_time', config.modifiedTime);
      }
      if (config.author) {
        this.updateOrCreateMetaTag('article:author', config.author);
      }
    }

    // Twitter Card Tags
    this.updateOrCreateMetaTag('twitter:card', config.twitterCard || 'summary_large_image');
    if (config.title) {
      this.updateOrCreateMetaTag('twitter:title', config.title);
    }
    if (config.description) {
      this.updateOrCreateMetaTag('twitter:description', config.description);
    }
    if (config.image) {
      this.updateOrCreateMetaTag('twitter:image', config.image);
    }
    if (config.twitterSite) {
      this.updateOrCreateMetaTag('twitter:site', config.twitterSite);
    }
    if (config.twitterCreator) {
      this.updateOrCreateMetaTag('twitter:creator', config.twitterCreator);
    }

    // Canonical URL
    if (config.canonicalUrl) {
      this.updateCanonicalUrl(config.canonicalUrl);
    }
  }

  /**
   * Update meta tags from API response data
   * Automatically extracts common fields from API responses
   */
  updateMetaTagsFromApi(data: any, options?: {
    titleField?: string;
    descriptionField?: string;
    imageField?: string;
    url?: string;
    type?: string;
    siteName?: string;
  }): void {
    if (!isPlatformBrowser(this.platformId) || !data) {
      return;
    }

    const config: MetaTagsConfig = {
      title: this.extractField(data, options?.titleField || 'meta_title', 'title', 'name'),
      description: this.extractField(data, options?.descriptionField || 'meta_description', 'description', 'brief', 'text'),
      image: this.extractImage(data, options?.imageField),
      url: options?.url || this.getCurrentUrl(),
      type: options?.type || 'website',
      siteName: options?.siteName || this.defaultSiteName,
    };

    // Extract additional fields if available
    if (data.meta_keywords) {
      config.keywords = data.meta_keywords;
    }
    if (data.published_at || data.publish_at_ar) {
      config.publishedTime = data.published_at || data.publish_at_ar;
      config.type = 'article';
    }
    if (data.updated_at) {
      config.modifiedTime = data.updated_at;
    }
    if (data.author) {
      config.author = typeof data.author === 'string' ? data.author : data.author.name;
    }

    this.updateMetaTags(config);
  }

  /**
   * Helper method to extract field from nested object
   */
  private extractField(data: any, ...fields: string[]): string | undefined {
    for (const field of fields) {
      if (data[field]) {
        return typeof data[field] === 'string' ? data[field] : String(data[field]);
      }
    }
    return undefined;
  }

  /**
   * Helper method to extract image URL from various formats
   */
  private extractImage(data: any, imageField?: string): string | undefined {
    if (!data) return undefined;

    // Try specific field first
    if (imageField && data[imageField]) {
      return this.getImageUrl(data[imageField]);
    }

    // Try common image fields
    const imageFields = ['meta_image', 'og_image', 'image', 'logo', 'thumbnail'];
    for (const field of imageFields) {
      if (data[field]) {
        return this.getImageUrl(data[field]);
      }
    }

    return undefined;
  }

  /**
   * Get image URL from ResponsiveImage or string
   */
  private getImageUrl(image: any): string | undefined {
    if (!image) return undefined;

    if (typeof image === 'string') {
      return image.startsWith('http') ? image : `https://dashboard.techhouseksa.com${image}`;
    }

    if (typeof image === 'object') {
      // ResponsiveImage format
      if (image.desktop) {
        return image.desktop.startsWith('http') ? image.desktop : `https://dashboard.techhouseksa.com${image.desktop}`;
      }
      if (image.tablet) {
        return image.tablet.startsWith('http') ? image.tablet : `https://dashboard.techhouseksa.com${image.tablet}`;
      }
      if (image.mobile) {
        return image.mobile.startsWith('http') ? image.mobile : `https://dashboard.techhouseksa.com${image.mobile}`;
      }
      // Array format
      if (Array.isArray(image) && image.length > 0) {
        const img = image[0];
        return typeof img === 'string' 
          ? (img.startsWith('http') ? img : `https://dashboard.techhouseksa.com${img}`)
          : undefined;
      }
    }

    return undefined;
  }

  /**
   * Update or create a meta tag
   */
  private updateOrCreateMetaTag(property: string, content: string): void {
    if (!content) return;

    // Remove existing tag if it exists
    this.metaService.removeTag(`property="${property}"`);
    this.metaService.removeTag(`name="${property}"`);

    // Determine if it's a property or name attribute
    const isProperty = property.startsWith('og:') || property.startsWith('article:') || property.startsWith('twitter:');
    
    if (isProperty) {
      this.metaService.addTag({ property, content });
    } else {
      this.metaService.addTag({ name: property, content });
    }
  }

  /**
   * Update canonical URL
   */
  private updateCanonicalUrl(url: string): void {
    if (!url) return;

    let canonicalLink = this.document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    
    if (!canonicalLink) {
      canonicalLink = this.document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      this.document.head.appendChild(canonicalLink);
    }

    canonicalLink.setAttribute('href', url);
  }

  /**
   * Get current page URL
   */
  private getCurrentUrl(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return '';
    }
    return window.location.href;
  }

  /**
   * Reset meta tags to default values
   */
  resetMetaTags(): void {
    this.updateMetaTags({
      title: this.defaultSiteName,
      description: 'TechHouse - حلول تسويقية رقمية مبتكرة',
      type: 'website',
      siteName: this.defaultSiteName,
    });
  }
}

