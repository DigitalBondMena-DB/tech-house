import { CommonModule, isPlatformBrowser } from "@angular/common";
import { Component, computed, effect, inject, NgZone, PLATFORM_ID, signal, ViewEncapsulation } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { FeatureService } from "../../core/services/featureService";
import { ContactUsSec } from "../../shared/components/contact-us-sec/contact-us-sec";
import { SafeHtmlPipe } from "../../shared/pipes/safe-html.pipe";

@Component({
  selector: 'app-blog-det',
  standalone: true,
  imports: [CommonModule, ContactUsSec, SafeHtmlPipe],
  templateUrl: './blog-det.html',
  styleUrl: './blog-det.css',
  encapsulation: ViewEncapsulation.None
})
export class BlogDet {

  private featureService = inject(FeatureService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);

  isBrowser = isPlatformBrowser(this.platformId);

  // ===== DATA =====
  blogDetailsData = computed(() => this.featureService.blogDetailsData());
  blog = computed(() => this.blogDetailsData()?.blog ?? null);
  relatedBlogs = computed(() => this.blogDetailsData()?.related_blogs ?? []);

  hasBlog = computed(() => !!this.blog());

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
  activeSectionIndex = signal<number>(-1);

  activeSection = computed(() => {
    const index = this.activeSectionIndex();
    const sections = this.sections();
    if (index >= 0 && index < sections.length) {
      return sections[index] ?? null;
    }
    return null;
  });


  fullContent = computed(() => {
    const activeIndex = this.activeSectionIndex();
    let html = this.blog()?.text ?? '';

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

        const currentH2 = `<h2${newAttributes} class="${finalIndex === activeIndex ? 'section-heading-active' : 'section-heading'}">${content}</h2>`;

        // --- الجزء الجديد: حقن الـ CTA بعد كل 3 أو 5 عناوين ---
        if (h2Count === 2 || h2Count % 4 === 0) { // هنا سيضعها بعد العنوان الرابع والثامن وهكذا
          const ctaHtml = `<div class="contact-box flex flex-col lg:flex-row text-center justify-between items-center mt-6 px-10 p-6 border border-[#B91C17] rounded-2xl">
      <div>
        <h5 class="text-[#B91C17]!">تبي زيادة أرباح مشروعك؟</h5>
        <p class="text-lg text-[#B91C17]! font-medium">احصل على استشارتك المجانية الآن مع خبير من بيت التكنولوجيا</p>
      </div>
      <div class="mt-3 gap-2 flex items-center justify-center">
        <a href="https://wa.me/201022810069" target="_blank" class="px-6 py-2 bg-green-500 hover:bg-green-400 transition-colors duration-150 rounded-full text-white">واتس اب</a>
        <a href="tel:+201022810069" class="px-6 py-2 bg-[#B91C17] hover:bg-[#ED2924] transition-colors duration-150 rounded-full text-white">اتصل بنا</a>
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
    }

    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  constructor() {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      if (!slug) {
        this.router.navigate(['/المقالات']);
        return;
      }
      this.featureService.loadBlogDetails(slug);
    });

    effect(() => {
      const html = this.blog()?.text;
      if (html) {
        this.extractSections(html);
      }
    });

    effect(() => {
      const activeIndex = this.activeSectionIndex();
      const sections = this.sections();
      if (activeIndex >= 0 && sections.length > 0 && this.isBrowser) {
        setTimeout(() => {
          sections.forEach((section, index) => {
            const element = document.getElementById(`section-${index}`);
            if (element) {
              if (index === activeIndex) {
                element.classList.add('section-heading-active');
                element.classList.remove('section-heading');
              } else {
                element.classList.remove('section-heading-active');
                element.classList.add('section-heading');
              }
            }
          });
        }, 100);
      }
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
      this.activeSectionIndex.set(-1);
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
    this.activeSectionIndex.set(0);
  }

  navigateToSection(i: number) {
    if (i >= 0 && i < this.sections().length) {
      this.activeSectionIndex.set(i);
      if (this.isBrowser) {
        this.ngZone.runOutsideAngular(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              const sectionId = `section-${i}`;
              let attempts = 0;
              const findAndScroll = () => {
                const targetElement = document.getElementById(sectionId);
                if (targetElement) {
                  requestAnimationFrame(() => {
                    // Cache values to avoid multiple reads
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const scrollY = window.pageYOffset;
                    const offsetPosition = elementPosition + scrollY - 120;

                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  });
                } else if (attempts < 5) {
                  attempts++;
                  setTimeout(findAndScroll, 100);
                }
              };
              findAndScroll();
            }, 200);
          });
        });
      }
    }
  }

  isSectionActive(index: number): boolean {
    const currentIndex = this.activeSectionIndex();
    return currentIndex >= 0 && currentIndex === index;
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
}
