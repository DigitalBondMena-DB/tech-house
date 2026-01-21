import { inject, Injectable } from '@angular/core';
import { SEOHelperService } from './seo-helper';
import { SeoITags } from '../models/common';

@Injectable({
  providedIn: 'root',
})
export class SeparatedSeoTags {
  private seoHelper = inject(SEOHelperService);
  getSeoTagsDirect(seoTags: SeoITags | null | undefined, pageName: string) {
    if (seoTags) {
      const seo: SeoITags = {
        meta_title: seoTags.meta_title,
        meta_description: seoTags.meta_description,
        page_name: pageName,
        image_alt: seoTags.meta_title,
        image_url: seoTags.image_url,
        page_schema: seoTags?.page_schema
      };
      this.seoHelper.updatePageSEO(seo);
    } else {
      this.seoHelper.updateSEOWithFallback();
    }
  }
}
