import { NgOptimizedImage } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, computed, signal } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { Testimonial } from '../../../core/models/home.model';

@Component({
  selector: 'app-home-clients-review',
  imports: [NgOptimizedImage, SkeletonModule],
  templateUrl: './home-clients-review.html',
  styleUrl: './home-clients-review.css'
})
export class HomeClientsReview implements OnChanges {
  @Input() testimonials: Testimonial[] = [];

  // 🔹 Loading state as signal
  private isLoadingSignal = signal(true);
  isLoading = computed(() => this.isLoadingSignal());

  // 🔹 Current center index signal
  private currentCenterIndexSignal = signal(0);
  currentCenterIndex = computed(() => this.currentCenterIndexSignal());

  // 🔹 Get visible testimonials as computed signal for reactivity
  // Always returns 3 testimonials (or fewer if total is less than 3)
  visibleTestimonials = computed(() => {
    if (!this.testimonials || this.testimonials.length === 0) {
      return [];
    }

    const centerIndex = this.currentCenterIndex();
    const total = this.testimonials.length;

    // If only 1 testimonial, show it in center with placeholders
    if (total === 1) {
      return [this.testimonials[0]];
    }

    // If 2 testimonials, show both with center being the selected one
    if (total === 2) {
      const otherIndex = centerIndex === 0 ? 1 : 0;
      return [
        this.testimonials[otherIndex],
        this.testimonials[centerIndex]
      ];
    }

    // If 3 or more testimonials, always show 3 with center in middle
    let leftIndex: number;
    let rightIndex: number;

    // Calculate left index
    if (centerIndex === 0) {
      leftIndex = total - 1; // Wrap to last
    } else {
      leftIndex = centerIndex - 1;
    }

    // Calculate right index
    if (centerIndex === total - 1) {
      rightIndex = 0; // Wrap to first
    } else {
      rightIndex = centerIndex + 1;
    }

    return [
      this.testimonials[leftIndex],
      this.testimonials[centerIndex],
      this.testimonials[rightIndex]
    ];
  });

  // 🔹 Center testimonial as computed signal for reactivity
  centerTestimonial = computed(() => {
    if (!this.testimonials || this.testimonials.length === 0) {
      return null;
    }

    const centerIndex = this.currentCenterIndex();
    return this.testimonials[centerIndex] || null;
  });

  // 🔹 Check if image is center based on position
  isCenterImage(position: number, total: number): boolean {
    if (total === 1) return position === 0;
    if (total === 2) return position === 1;
    return position === 1; // For 3 or more, center is always index 1
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['testimonials']) {
      this.isLoadingSignal.set(!this.testimonials || this.testimonials.length === 0);
      // Reset center index when testimonials change
      if (this.testimonials && this.testimonials.length > 0) {
        this.currentCenterIndexSignal.set(Math.min(1, this.testimonials.length - 1));
      }
    }
  }

  // Get visible testimonials (kept for backward compatibility, but now uses computed)
  getVisibleTestimonials(): Testimonial[] {
    return this.visibleTestimonials();
  }

  // Handle image click
  onImageClick(clickedIndex: number): void {
    if (!this.testimonials || this.testimonials.length === 0) {
      return;
    }

    const visible = this.visibleTestimonials();
    const clickedTestimonial = visible[clickedIndex];

    if (!clickedTestimonial) {
      return;
    }

    const total = this.testimonials.length;

    // If only 1 testimonial, do nothing
    if (total === 1) {
      return;
    }

    // Find the actual index of clicked testimonial in the full array
    const actualIndex = this.testimonials.findIndex(
      t => t.name === clickedTestimonial.name && t.text === clickedTestimonial.text
    );

    if (actualIndex === -1) {
      return;
    }

    // If 2 testimonials, always move clicked one to center (index 1)
    if (total === 2) {
      this.currentCenterIndexSignal.set(actualIndex);
      return;
    }

    // If 3 testimonials, move clicked one to center (index 1)
    if (total === 3) {
      // Map visible index to actual index
      // visible[0] = testimonials[0], visible[1] = testimonials[1], visible[2] = testimonials[2]
      this.currentCenterIndexSignal.set(actualIndex);
      return;
    }

    // If more than 3, handle rotation
    // If clicking on center (index 1), rotate to next
    if (clickedIndex === 1) {
      const nextIndex = (actualIndex + 1) % this.testimonials.length;
      this.currentCenterIndexSignal.set(nextIndex);
    } else {
      // If clicking on left (index 0) or right (index 2), move to center
      this.currentCenterIndexSignal.set(actualIndex);
    }
  }

  // Helper method to get responsive image
  getResponsiveImage(image: { desktop: string; tablet: string; mobile: string } | null | undefined): string {
    if (!image || !image.desktop) {
      return '/images/placeholder.webp';
    }
    return image.desktop;
  }

}
