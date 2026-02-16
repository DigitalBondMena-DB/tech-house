import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ResponsiveImage } from '../../../core/models/home.model';
import { SharedFeatureService } from '../../../core/services/sharedFeatureService';
import { environment } from '../../../../environments/environment';

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
  isFoundingDay = environment.isFoundingDay
  // Contact Us Data from API
  contactUsData = this.sharedFeatureService.contactUsData;

  // Services Section Data from API
  servicesSection = this.sharedFeatureService.servicesSection;

  ngOnInit(): void {
    this.loadFooterData();
  }

  private loadFooterData(): void {
    this.sharedFeatureService.loadContactUsData().subscribe();
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
  getServiceUrl(service: any): string {

    return '/الخدمات/' + service.slug;
  }
}
