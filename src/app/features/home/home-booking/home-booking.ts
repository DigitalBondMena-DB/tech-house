import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, computed, effect, ElementRef, inject, input, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { CTASection } from '../../../core/models/home.model';
import { AppButton } from '../../../shared/components/app-button/app-button';
import { rafThrottle } from '../../../core/utils/performance.utils';


@Component({
  selector: 'app-home-booking',
  imports: [AppButton, SkeletonModule],
  templateUrl: './home-booking.html',
  styleUrl: './home-booking.css'
})
export class HomeBooking implements AfterViewInit, OnDestroy {
  //! Input for CTA Section data
  ctasection = input<CTASection | null>(null);

  // 🔹 Loading state
  isLoading = computed(() => !this.ctasection());

  //! button data
  btnText = "احجز موعدك";

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private throttledScrollHandler?: () => void;
  private scrollHandlerTarget?: HTMLVideoElement;

  @ViewChild('videoElement', { static: false }) videoElement?: ElementRef<HTMLVideoElement>;

  constructor() {
    // Watch for video URL changes (only in browser)
    if (this.isBrowser) {
      effect(() => {
        const videoUrl = this.ctasection()?.video;
        if (videoUrl) {
          // Wait a bit for the video element to be available
          setTimeout(() => {
            this.playVideo();
          }, 200);
        }
      });
    }
  }

  ngAfterViewInit(): void {
    // Only run in browser environment
    if (!this.isBrowser) {
      return;
    }

    if (this.ctasection()?.video) {
      // Wait for video element to be ready
      setTimeout(() => {
        this.initializeVideo();
      }, 100);
    }
  }

  onVideoLoaded(): void {
    if (this.isBrowser) {
      this.playVideo();
    }
  }

  onVideoError(event: Event): void {
    console.error('Video error:', event);
    const video = event.target as HTMLVideoElement;
    if (video) {
      console.error('Video error details:', {
        error: video.error,
        networkState: video.networkState,
        readyState: video.readyState,
        src: video.src
      });
    }
  }

  private initializeVideo(): void {
    if (!this.isBrowser) {
      return;
    }

    const video = this.videoElement?.nativeElement;
    if (!video) {
      // Retry if video element is not ready yet
      if (this.ctasection()?.video) {
        setTimeout(() => {
          this.initializeVideo();
        }, 200);
      }
      return;
    }

    const videoUrl = this.ctasection()?.video;
    if (!videoUrl) {
      return;
    }

    // Ensure video properties are set BEFORE setting src
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');
    
    // Set source if not already set
    if (!video.src || video.src !== videoUrl) {
      video.src = videoUrl;
    }

    // Add event listeners
    video.addEventListener('loadedmetadata', () => {
      this.playVideo();
    }, { once: true });

    video.addEventListener('canplay', () => {
      this.playVideo();
    }, { once: true });

    video.addEventListener('loadeddata', () => {
      this.playVideo();
    }, { once: true });

    // Load the video
    video.load();
    
    // Fallback: try to play after a delay
    setTimeout(() => {
      this.playVideo();
    }, 2000);
  }

  private playVideo(): void {
    if (!this.isBrowser) {
      return;
    }

    const video = this.videoElement?.nativeElement;
    if (!video || typeof video.play !== 'function') {
      return;
    }

    // Ensure video is still muted (required for autoplay)
    video.muted = true;

    const playPromise = video.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
        })
        .catch(() => {
          // Try to play again on user interaction
          this.setupUserInteractionPlay(video);
        });
    } else {
      // Fallback for older browsers
      this.setupUserInteractionPlay(video);
    }
  }

  private setupUserInteractionPlay(video: HTMLVideoElement): void {
    if (!this.isBrowser || typeof document === 'undefined') {
      return;
    }

    const playOnInteraction = () => {
      if (video && typeof video.play === 'function') {
        video.play()
          .then(() => {
            this.cleanupInteractionListeners();
          })
          .catch(() => {});
      }
    };

    // Store video reference for cleanup
    this.scrollHandlerTarget = video;

    // Use throttled scroll handler for better performance
    this.throttledScrollHandler = rafThrottle(playOnInteraction);
    
    document.addEventListener('click', playOnInteraction, { once: true });
    document.addEventListener('touchstart', playOnInteraction, { once: true });
    // Use throttled handler for scroll with passive listener
    window.addEventListener('scroll', this.throttledScrollHandler, { once: true, passive: true });
  }

  private cleanupInteractionListeners(): void {
    if (this.throttledScrollHandler) {
      window.removeEventListener('scroll', this.throttledScrollHandler);
      this.throttledScrollHandler = undefined;
    }
    this.scrollHandlerTarget = undefined;
  }

  ngOnDestroy(): void {
    this.cleanupInteractionListeners();
  }
}
