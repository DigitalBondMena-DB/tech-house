import { NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, PLATFORM_ID, QueryList, SimpleChanges, ViewChildren, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { Flip } from 'gsap/all';
import { SkeletonModule } from 'primeng/skeleton';
import { Project } from '../../../core/models/home.model';
import { AppButton } from '../../../shared/components/app-button/app-button';
import { SectionTitle } from '../../../shared/components/section-title/section-title';

@Component({
  selector: 'app-home-projects',
  imports: [SectionTitle, AppButton, NgOptimizedImage, SkeletonModule],
  templateUrl: './home-projects.html',
  styleUrl: './home-projects.css'
})
export class HomeProjects implements AfterViewInit, OnChanges {
  @Input() projects: Project[] = [];

  // 🔹 Loading state as signal
  private isLoadingSignal = signal(true);
  isLoading = computed(() => this.isLoadingSignal());

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projects']) {
      this.isLoadingSignal.set(!this.projects || this.projects.length === 0);
    }
  }

  //! section title data
  projectsTitle = "مشاريعنا";

  //! button data
  btnText = "مشاريع اكثر";

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private router = inject(Router);
  
  // Cache window width to avoid repeated reads
  private cachedWindowWidth = signal<number | null>(null);

  // Helper method to get responsive image
  getResponsiveImage(image: { desktop: string; tablet: string; mobile: string } | null | undefined): string {
    if (!image || !image.desktop) {
      return '/images/placeholder.webp'; // Fallback image
    }
    return image.desktop;
  }

  // Track the active card index
  private activeCardIndex = 1; // Start with the middle card active
  
  // Reference to the cards container
  @ViewChildren('projectCard') projectCards!: QueryList<ElementRef>;

  constructor() {
    // Register GSAP plugins only in browser
    if (this.isBrowser && typeof window !== 'undefined') {
      gsap.registerPlugin(Flip);
    }
  }

  private getWindowWidth(): number {
    if (!this.isBrowser) return 1024; // Default desktop width for SSR
    
    // Cache width to avoid repeated reads
    const cached = this.cachedWindowWidth();
    if (cached !== null) {
      return cached;
    }
    
    // Read once and cache
    const width = window.innerWidth;
    this.cachedWindowWidth.set(width);
    return width;
  }

  ngAfterViewInit() {
    // Only run in browser, not in SSR
    if (!this.isBrowser) {
      return;
    }

    // Initial setup - make sure the middle card is on top (only on large screens)
    if (this.getWindowWidth() >= 1024) {
      this.updateCardStates();
    }
  }

  // Handle card click
  onCardClick(clickedIndex: number, event?: Event) {
    // Only run in browser, not in SSR
    if (!this.isBrowser) {
      return;
    }

    // Get the clicked project from the sliced array (first 3 projects)
    const displayedProjects = this.projects.slice(0, 3);
    const clickedProject = displayedProjects[clickedIndex];
    if (!clickedProject) {
      return;
    }

  

    // On mobile, navigate directly to project details
    if (this.getWindowWidth() < 1024) {
      if (clickedProject.slug) {
        this.router.navigate(['/project-det', clickedProject.slug]);
      }
      return;
    }

    // On desktop, handle active card click differently
    if (clickedIndex === this.activeCardIndex) {
      // If clicking the active card, navigate to project details
      if (clickedProject.slug) {
        this.router.navigate(['/project-det', clickedProject.slug]);
      }
      return;
    }

    // Get all card elements
    const cards = this.projectCards.toArray().map(card => card.nativeElement);
    const activeCard = cards[this.activeCardIndex];
    const clickedCard = cards[clickedIndex];

    // Temporarily remove transition for the active card to prevent jump
    gsap.set(activeCard, { transition: 'none' });
    gsap.set(clickedCard, { transition: 'none' });

    // Get the current state
    const state = Flip.getState(".project-card");
    
    // Update the active index
    this.activeCardIndex = clickedIndex;
    this.updateCardStates();
    
    // Apply the new state with animation
    Flip.from(state, {
      duration: 0.8,
      ease: "power1.inOut",
      onComplete: () => {
        // Restore transitions after animation
        gsap.set(cards, { clearProps: 'all' });
      }
    });
  }

  // Update z-index and classes based on active card
  private updateCardStates() {
    this.projectCards.forEach((card, index) => {
      const element = card.nativeElement;
      const diff = Math.abs(index - this.activeCardIndex);
      
      // Set z-index based on distance from active card
      gsap.set(element, { zIndex: 100 - diff * 10 });
      
      // Add/remove active class
      if (index === this.activeCardIndex) {
        element.classList.add('active-card');
        element.classList.remove('back-card', 'front-card');
      } else if (index < this.activeCardIndex) {
        element.classList.add('back-card');
        element.classList.remove('active-card', 'front-card');
      } else {
        element.classList.add('front-card');
        element.classList.remove('active-card', 'back-card');
      }
    });
  }
}
