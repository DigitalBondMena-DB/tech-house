import { Component, OnInit, AfterViewInit, inject, computed } from '@angular/core';
import { HeroSection } from '../../shared/components/hero-section/hero-section';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { SharedFeatureService } from '../../core/services/sharedFeatureService';
import { PrivacyPolicyData, ResponsiveImage } from '../../core/models/home.model';

@Component({
  selector: 'app-privacy-policy',
  imports: [HeroSection, CommonModule, SkeletonModule],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.css'
})
export class PrivacyPolicy implements OnInit, AfterViewInit {
  private sharedFeatureService = inject(SharedFeatureService);

  // 🔹 Privacy Policy Data from API
  privacyPolicyData = computed(() => this.sharedFeatureService.privacyPolicyData());

  // 🔹 Computed properties for hero section
  heroTitle = computed(() => {
    const data = this.privacyPolicyData();
    return data?.bannerSection?.title || data?.title || '';
  });
  heroParagraph = computed(() => {
    const data = this.privacyPolicyData();
    return data?.bannerSection?.text || data?.paragraph || '';
  });
  heroImageData = computed(() => {
    const data = this.privacyPolicyData();
    return data?.bannerSection?.image || data?.image;
  });
  sections = computed(() => this.privacyPolicyData()?.sections ?? []);
  
  // 🔹 Privacy Policy Content
  privacyPolicyContent = computed(() => this.privacyPolicyData()?.privacyPolicy);
  
  // 🔹 Helper method to split text by line breaks
  splitTextByLines(text: string | undefined): string[] {
    if (!text) return [];
    return text.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);
  }

  // 🔹 Helper method to get mobile image (smallest image) for hero
  getMobileImage(image: ResponsiveImage | undefined): string {
    if (!image) return '';
    return image.mobile || image.tablet || image.desktop || '';
  }

  // 🔹 Helper method to get responsive image based on screen size
  getResponsiveImage(image: ResponsiveImage | undefined): string {
    if (!image) return '';
    
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768) {
        return image.mobile || image.tablet || image.desktop || '';
      } else if (width < 1024) {
        return image.tablet || image.desktop || image.mobile || '';
      }
    }
    return image.desktop || image.tablet || image.mobile || '';
  }

  ngOnInit(): void {
    // Scroll to top when page loads
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  ngAfterViewInit(): void {
    // Load privacy policy data when view initializes
    this.sharedFeatureService.loadPrivacyPolicy();
  }
}
