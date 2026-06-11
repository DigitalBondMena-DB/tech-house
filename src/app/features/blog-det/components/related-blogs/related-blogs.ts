import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-related-blogs',
  standalone: true,
  template: `
    <div class="mb-8 md:mb-12 border border-[#440000] rounded-2xl p-8 mt-8 lg:mt-0">
      <div class="flex items-center gap-2 mb-4 md:mb-6">
        <img src="images/title/title.webp" alt="title-icon" loading="lazy" decoding="async">
        <h2 class="text-xl md:text-2xl font-bold text-[#440000]">المشاركات الأخيرة</h2>
      </div>

      <div class="space-y-6">
        @for (related of blogs(); track related.slug) {
        <div class="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white"
          (click)="blogSelected.emit(related)">
          @if (related.image) {
          <div class="w-full h-48 overflow-hidden">
            <img loading="lazy" decoding="async" [src]="getResponsiveImageFromObject(related.image)"
              [alt]="related.title" class="size-full object-cover rounded-2xl" />
          </div>
          }
          <div class="p-4">
            <p class="text-sm text-gray-500 mb-2">{{ related.publish_at_ar }}</p>
            <h3 class="text-base md:text-lg font-semibold text-[#440000] line-clamp-2">
              {{ related.title }}
            </h3>
          </div>
        </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RelatedBlogs {
  blogs = input.required<any[]>();
  blogSelected = output<any>();

  getResponsiveImageFromObject(img: any): string {
    if (!img) return '/images/placeholder.png';
    return img.desktop ?? img.mobile;
  }
}
