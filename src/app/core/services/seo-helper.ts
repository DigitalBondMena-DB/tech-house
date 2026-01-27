import { inject, Injectable } from '@angular/core';
import { SEOService } from './seo';
import { SeoITags } from '../models/common';

@Injectable({
  providedIn: 'root',
})
export class SEOHelperService {
   private seoService = inject(SEOService);

  /**
   * Handle SEO for general pages (about, services, etc.)
   */
  updatePageSEO(seoData: SeoITags): void {    
    this.seoService.updateSEOFromBackend(seoData);
  }

  /**
   * Handle SEO with fallback to default when no backend data
   */
  updateSEOWithFallback(seoData?: SeoITags): void {
    if (seoData && (seoData.meta_title || seoData.meta_description)) {
      this.seoService.updateSEOFromBackend(seoData);
    } 
  }
}
