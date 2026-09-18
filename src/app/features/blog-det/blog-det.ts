import { CommonModule, isPlatformBrowser } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, NgZone, OnDestroy, PLATFORM_ID, RESPONSE_INIT, signal, ViewEncapsulation } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { FeatureService } from "../../core/services/featureService";
import { ContactUsSec } from "../../shared/components/contact-us-sec/contact-us-sec";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SharedFeatureService } from "../../core/services/sharedFeatureService";
import { fromEvent, throttleTime, switchMap, map, of, distinctUntilChanged } from "rxjs";
import { BlogArticle } from "./components/blog-article/blog-article";
import { RelatedBlogs } from "./components/related-blogs/related-blogs";
import { BlogToc } from "./components/blog-toc/blog-toc";
import { addRelToLinks } from "../../core/utils/html-utils";
import { SEOService } from "../../core/services/seo";
import { Breadcrumb } from "../../shared/components/breadcrumb/breadcrumb";
import { BlogDetail } from "../../core/models/home.model";

@Component({
  selector: 'app-blog-det',
  standalone: true,
  imports: [CommonModule, ContactUsSec, BlogArticle, RelatedBlogs, BlogToc, Breadcrumb],
  templateUrl: './blog-det.html',
  styleUrl: './blog-det.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogDet implements OnDestroy {
  private readonly destroyRef = inject(DestroyRef)
  private featureService = inject(FeatureService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private sharedFeatureService = inject(SharedFeatureService);
  private seoService = inject(SEOService);
  private responseInit = inject(RESPONSE_INIT, { optional: true });

  contactUsData = this.sharedFeatureService.contactUsData;
  isBrowser = isPlatformBrowser(this.platformId);

  // ===== DATA =====
  blogDetailsData = computed(() => this.featureService.blogDetailsData());
  blog = computed<BlogDetail | null>(() => {
    const data = this.blogDetailsData();
    if (!data || (data as any).redirect === true || (data as any).redirect_to) return null;
    const b = data.blog;
    if (!b || (b as any).redirect_to) return null;
    return b as BlogDetail;
  });
  relatedBlogs = computed(() => this.blogDetailsData()?.related_blogs ?? []);

  hasBlog = computed(() => !!this.blog());
  isDesktop = signal<boolean>(true);
  // ===== HERO IMAGE =====
  heroImage = computed(() => {
    const blog = this.blog();
    // Use banner_image if available, otherwise fallback to image
    const imageSource = blog?.banner_image;
    // If banner_image is a string (single URL), return it directly
    if (typeof imageSource === 'string') {
      return imageSource;
    }

    // If it's an array, use getResponsiveImage
    return this.getResponsiveImage(imageSource);
  });

  // ===== SECTIONS =====
  sections = signal<any[]>([]);


  fullContent = computed(() => {
    let html: string = this.blog()?.text ?? '';

    if (html) {
      const sections = this.sections();
      let h2Count = 0; // عداد للعناوين

      // معالجة الـ H2 وحقن الـ CTA
      html = html.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (match, attributes, content) => {
        h2Count++;
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();

        // ... كود الـ ID والـ Classes الأصلي الخاص بك ...
        const sectionIndex = sections.findIndex(s => s.title.trim() === cleanContent || cleanContent.includes(s.title.trim()));
        const finalIndex = sectionIndex >= 0 ? sectionIndex : -1;
        let newAttributes = attributes.includes('id=')
          ? attributes.replace(/id="[^"]*"/, `id="section-${finalIndex}"`)
          : `${attributes} id="section-${finalIndex}"`;

        const currentH2 = `<h2${newAttributes} class="section-heading">${content}</h2>`;

        // --- الجزء الجديد: حقن الـ CTA بعد كل 3 أو 5 عناوين ---
        if (h2Count === 2 || h2Count % 4 === 0) { // هنا سيضعها بعد العنوان الرابع والثامن وهكذا
          const contactData = this.contactUsData();
          const whatsappUrl = contactData?.whatsapp_number || '#';
          const phoneUrl = contactData?.phone ? `tel:${contactData.phone}` : '#';
          const ctaHtml = `<div class="contact-box flex flex-col lg:flex-row text-center justify-between items-center mt-6 px-10 p-6 border border-[#B91C17] rounded-2xl">
      <div>
        <p class="text-[#B91C17]! text-lg! font-bold!">تبي زيادة أرباح مشروعك؟</p>
        <p class="text-lg text-[#B91C17]! font-medium">احصل على استشارتك المجانية الآن مع خبير من بيت التكنولوجيا</p>
      </div>
      <div class="mt-3 gap-2 flex items-center justify-center">
        <a href="${whatsappUrl}" rel="noopener noreferrer nofollow" target="_blank" class="px-6 py-2 bg-green-500 hover:bg-green-400 transition-colors duration-150 rounded-full text-white">واتس اب</a>
        <a href="${phoneUrl}" rel="noopener noreferrer nofollow" target="_blank" class="px-6 py-2 bg-[#B91C17] hover:bg-[#ED2924] transition-colors duration-150 rounded-full text-white">اتصل بنا</a>
      </div>
    </div>`;
          return ctaHtml + currentH2; // سيتم وضع الـ CTA "قبل" العنوان الذي وصل للرقم المحدد
        }

        return currentH2;
      });
      html = html.replace(/style\s*=\s*"([^"]*)"/gi, (match, styles) => {
        let cleanedStyles = styles.replace(/font-family\s*:\s*[^;]+;?\s*/gi, '');
        cleanedStyles = cleanedStyles.replace(/;\s*;/g, ';').replace(/^\s*;\s*|\s*;\s*$/g, '');
        return `style="${cleanedStyles}"`;
      });
      html = html.replace(/style\s*=\s*"([^"]*)text-align\s*:\s*(left|right|center)([^"]*)"/gi,
        (match, before, align, after) => {
          const cleanedBefore = before.replace(/text-align\s*:\s*(left|right|center)\s*;?\s*/gi, '');
          const cleanedAfter = after.replace(/text-align\s*:\s*(left|right|center)\s*;?\s*/gi, '');
          return `style="${cleanedBefore}text-align: justify;${cleanedAfter}"`;
        });
      html = html.replace(/text-align\s*:\s*(left|right|center)\s*;?/gi, 'text-align: justify;');
      html = html.replace(/style\s*=\s*"([^"]*)"/gi, (match, styles) => {
        if (!styles.includes('text-align')) {
          return `style="${styles}; text-align: justify;"`;
        }
        return match;
      });
      html = addRelToLinks(html);
    }

    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  constructor() {
    this.sharedFeatureService.loadContactUsData().subscribe();

    this.route.params
      .pipe(
        map(params => params['slug']),
        distinctUntilChanged(),
        switchMap(slug => {
          if (!slug) {
            this.router.navigate(['/المقالات']);
            return of({ slug: '', data: null });
          }
          return this.featureService.loadBlogDetails(slug).pipe(
            map(data => ({ slug, data }))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ slug, data }) => {
        if (!data) {
          this.router.navigate(['/not-found']);
          return;
        }

        // Handle redirect when blog response has redirect: true, status: 301, or redirect_to
        const isRedirect = (data as any)?.redirect === true || !!(data as any)?.redirect_to || !!(data as any)?.blog?.redirect_to;
        const redirectSlug = (data as any)?.redirect_to || (data as any)?.blog?.redirect_to || (data as any)?.redirect_url;

        if (isRedirect && redirectSlug) {
          let targetSlug = String(redirectSlug).trim();
          if (targetSlug.startsWith('http://') || targetSlug.startsWith('https://')) {
            try {
              const url = new URL(targetSlug);
              const parts = url.pathname.split('/').filter(Boolean);
              targetSlug = decodeURIComponent(parts[parts.length - 1] || targetSlug);
            } catch (e) {}
          } else if (targetSlug.includes('/')) {
            const parts = targetSlug.split('/').filter(Boolean);
            targetSlug = decodeURIComponent(parts[parts.length - 1] || targetSlug);
          } else {
            try {
              targetSlug = decodeURIComponent(targetSlug);
            } catch (e) {}
          }

          let cleanCurrentSlug = slug;
          try {
            if (slug && slug.includes('%')) {
              cleanCurrentSlug = decodeURIComponent(slug);
            }
          } catch (e) {}

          if (targetSlug && targetSlug !== cleanCurrentSlug && targetSlug !== slug) {
            const redirectStatus = (data as any)?.status || 301;
            if (this.responseInit) {
              this.responseInit.status = redirectStatus;
            }
            this.router.navigate(['/المقالات', targetSlug], { replaceUrl: true });
            return;
          }
        }

        if (!data.blog || (data as any).blog?.redirect_to || (data as any).redirect) {
          this.router.navigate(['/not-found']);
        }
      });

    effect(() => {
      const blog = this.blog();
      if (blog) {
        this.extractSections(blog.text || '');
        this.seoService.setArticleSchema(blog);
      }
    });



    if (this.isBrowser) {
      this.checkScreenSize();
    }
  }


  private checkScreenSize() {
    if (!this.isBrowser) return;
    this.isDesktop.set(window.innerWidth >= 1024);
    this.ngZone.runOutsideAngular(() => {
      fromEvent(window, 'resize')
        .pipe(
          throttleTime(100),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          const nextVal = window.innerWidth >= 1024;
          if (this.isDesktop() !== nextVal) {
            this.ngZone.run(() => {
              this.isDesktop.set(nextVal);
            });
          }
        });
    });
  }

  // ===== LOGIC =====
  extractSections(html: string) {
    const result: any[] = [];
    const regex = /<h2[^>]*>(.*?)<\/h2>/gi;
    let match;

    const matches: { index: number; title: string }[] = [];
    while ((match = regex.exec(html))) {
      matches.push({
        index: match.index,
        title: match[1].replace(/<[^>]*>/g, '').trim()
      });
    }

    if (matches.length === 0) {
      this.sections.set([]);
      return;
    }

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = matches[i + 1]?.index ?? html.length;

      result.push({
        id: `sec-${i}`,
        title: matches[i].title,
        content: html.slice(start, end),
        index: i
      });
    }

    this.sections.set(result);
  }

  navigateToRelatedBlog(blog: any) {
    this.router.navigate(['/المقالات', blog.slug]);
  }

  getResponsiveImage(images?: string[] | null): string {
    if (!images?.length) return '/images/placeholder.png';
    return images[2] ?? images[0];
  }

  getResponsiveImageFromObject(img: any): string {
    if (!img) return '/images/placeholder.png';
    return img.desktop ?? img.mobile;
  }

  ngOnDestroy(): void {
    this.seoService.removeArticleSchema();
  }
}
