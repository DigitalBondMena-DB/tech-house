import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ResponsiveImage } from '../../../core/models/home.model';
import { SharedFeatureService } from '../../../core/services/sharedFeatureService';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class Footer implements OnInit {
  private sharedFeatureService = inject(SharedFeatureService);
  private sanitizer = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // Contact Us Data from API
  contactUsData = this.sharedFeatureService.contactUsData;

  // Services Section Data from API
  servicesSection = this.sharedFeatureService.servicesSection;

  ngOnInit(): void {
    this.loadFooterData()
  }

  private loadFooterData(): void {
    // Load data - services have guards to prevent duplicate calls
    // Subscribe to Observable - data will be set in signal automatically
    this.sharedFeatureService.loadContactUsData().subscribe();
    // loadServicesSection returns void, so no subscribe needed
    this.sharedFeatureService.loadServicesSection();
  }


  // Helper method to get responsive image
  getResponsiveImage(image: ResponsiveImage | undefined): string {
    if (!image) return '/images/logo/logo-light.webp';
    // For now, return desktop. In a real app, you'd detect screen size
    return image.desktop;
  }

  // Helper method to sanitize HTML content
  getSanitizedHtml(html: string | undefined): SafeHtml {
    if (!html) return '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // Helper method to create Google Maps URL from address
  getGoogleMapsUrl(address: string | undefined): string {
    if (!address) return '#';
    // Encode the address for Google Maps
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  }
}
