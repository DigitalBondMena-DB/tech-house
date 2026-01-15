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
    const imageSource = blog?.banner_image ;
    
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
      html = html.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (match, attributes, content) => {
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        
        const sectionIndex = sections.findIndex(s => {
          const cleanTitle = s.title.trim();
          return cleanContent === cleanTitle || cleanContent.includes(cleanTitle) || cleanTitle.includes(cleanContent);
        });
        
        const finalIndex = sectionIndex >= 0 ? sectionIndex : -1;
        
        let classAttr = '';
        if (finalIndex === activeIndex && finalIndex >= 0) {
          classAttr = ' class="section-heading-active"';
        } else {
          classAttr = ' class="section-heading"';
        }
        
        let newAttributes = attributes;
        if (finalIndex >= 0) {
          if (newAttributes.includes('id=')) {
            newAttributes = newAttributes.replace(/id="[^"]*"/, `id="section-${finalIndex}"`);
          } else {
            newAttributes = `${newAttributes} id="section-${finalIndex}"`;
          }
        }
        
        if (!newAttributes.includes('class=')) {
          newAttributes = `${newAttributes}${classAttr}`;
        } else {
          newAttributes = newAttributes.replace(/class="([^"]*)"/, (m: string, classes: string) => {
            return `class="${classes} ${finalIndex === activeIndex && finalIndex >= 0 ? 'section-heading-active' : 'section-heading'}"`;
          });
        }
        
        return `<h2${newAttributes}>${content}</h2>`;
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
        this.router.navigate(['/blogs']);
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
    this.router.navigate(['/blog-det', blog.slug]);
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
