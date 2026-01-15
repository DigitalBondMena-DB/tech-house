import { NgOptimizedImage } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { Blog } from '../../../core/models/home.model';
import { AppButton } from '../../../shared/components/app-button/app-button';
import { SectionTitle } from '../../../shared/components/section-title/section-title';

@Component({
  selector: 'app-home-blogs',
  imports: [SectionTitle, AppButton, NgOptimizedImage, SkeletonModule],
  templateUrl: './home-blogs.html',
  styleUrl: './home-blogs.css'
})
export class HomeBlogs implements OnChanges {
  @Input() blogs: Blog[] = [];

  // 🔹 Loading state as signal
  private isLoadingSignal = signal(true);
  isLoading = computed(() => this.isLoadingSignal());

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['blogs']) {
      this.isLoadingSignal.set(!this.blogs || this.blogs.length === 0);
    }
  }

  //! section title data
  projectsTitle = " المقالات";

  //! button data
  btnText = "مقالات اكثر";

  activeCard: number = 2; // Default to middle card (index 1)

  constructor(private router: Router) {}

  //! method to set active card
  setActive(cardNumber: number, blog?: Blog, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.activeCard = cardNumber;
  }

  //! method to navigate to blog details
  navigateToBlogDetails(blog: Blog, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/blog-det', blog.slug]);
  }

  //! method to navigate to project details
  navigateToProjectDetails(blog: Blog, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/project-det', blog.slug]);
  }

  // Helper method to get responsive image
  getResponsiveImage(image: { desktop: string; tablet: string; mobile: string } | undefined): string {
    if (!image) return '/images/placeholder.png';
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768) {
        return image.mobile || image.desktop || '/images/placeholder.png';
      } else if (width < 1024) {
        return image.tablet || image.desktop || '/images/placeholder.png';
      }
    }
    return image.desktop || '/images/placeholder.png';
  }

  // Get blogs for display (first 3)
  getDisplayBlogs(): Blog[] {
    return this.blogs.slice(0, 3);
  }
}
