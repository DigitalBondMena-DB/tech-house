import { CommonModule, isPlatformBrowser } from "@angular/common";
import { Component, computed, DestroyRef, effect, inject, NgZone, OnDestroy, PLATFORM_ID, signal, ViewEncapsulation } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { FeatureService } from "../../core/services/featureService";
import { ContactUsSec } from "../../shared/components/contact-us-sec/contact-us-sec";
import { SafeHtmlPipe } from "../../shared/pipes/safe-html.pipe";
import { SectionTitle } from "../../shared/components/section-title/section-title";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
    selector: 'app-service-det',
    standalone: true,
    imports: [CommonModule, ContactUsSec, SafeHtmlPipe, SectionTitle],
    templateUrl: './service-det.html',
    styleUrl: './service-det.css',
    encapsulation: ViewEncapsulation.None
})
export class ServiceDet implements OnDestroy {
    private readonly timeouts = new Map<string, NodeJS.Timeout>();
    private readonly destroyRef = inject(DestroyRef);
    private featureService = inject(FeatureService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private sanitizer = inject(DomSanitizer);
    private platformId = inject(PLATFORM_ID);
    private ngZone = inject(NgZone);

    isBrowser = isPlatformBrowser(this.platformId);

    // ===== DATA =====
    serviceDetailsData = computed(() => this.featureService.serviceDetailsData());
    service = computed(() => this.serviceDetailsData()?.service ?? null);
    relatedServices = computed(() => this.serviceDetailsData()?.otherService ?? []);

    hasService = computed(() => !!this.service());

    // ===== HERO IMAGE =====
    heroImage = computed(() => {
        const service = this.service();
        if (!service) return '/images/placeholder.webp';

        // 1. If banner_image is a direct URL string, use it
        if (typeof service.banner_image === 'string' && service.banner_image.trim() !== '') {
            return service.banner_image;
        }

        // 2. Fallback to responsive images (desktop/mobile/etc) via getResponsiveImage
        // Passing the whole service object which now contains image_desktop etc.
        return this.getResponsiveImage(service);
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
        let html = this.service()?.large_text ?? 'لا يوجد محتوى';

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
        this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            const slug = params['slug'];
            if (!slug) {
                this.router.navigate(['/الخدمات']);
                return;
            }
            this.featureService.loadServiceDetails(slug);
        });

        effect(() => {
            const html = this.service()?.text;
            if (html) {
                this.extractSections(html);
            }
        });

        effect(() => {
            const activeIndex = this.activeSectionIndex();
            const sections = this.sections();
            if (activeIndex >= 0 && sections.length > 0 && this.isBrowser) {
                const timeoutId = setTimeout(() => {
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
                this.timeouts.set('section-heading', timeoutId);
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
                        const timeoutId = setTimeout(() => {
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
                                    const timeoutId = setTimeout(findAndScroll, 100);
                                    this.timeouts.set(`section-scroll-nest-${i}`, timeoutId);
                                }
                            };
                            findAndScroll();
                        }, 200);
                        this.timeouts.set(`section-scroll-${i}`, timeoutId);
                    });
                });
            }
        }
    }

    isSectionActive(index: number): boolean {
        const currentIndex = this.activeSectionIndex();
        return currentIndex >= 0 && currentIndex === index;
    }

    navigateToRelatedService(service: any) {
        this.router.navigate(['/الخدمات', service.slug]);
    }

    getResponsiveImage(service?: any): string {
        if (!service) return '/images/placeholder.webp';

        // Handle string inputs (direct URLs)
        if (typeof service === 'string') return service;

        // 1. Check for explicit image_desktop/mobile/tablet fields (Flat structure)
        if (this.isBrowser) {
            const width = window.innerWidth;
            if (width >= 1024 && service.image_desktop) return service.image_desktop;
            if (width >= 768 && service.image_tablet) return service.image_tablet;
            if (service.image_mobile) return service.image_mobile;
        } else {
            if (service.image_desktop) return service.image_desktop;
        }

        // 2. Fallback to image object (ResponsiveImage structure)
        const images = service.image;
        if (images) {
            if (this.isBrowser) {
                const width = window.innerWidth;
                if (width >= 1024) return images.desktop || images.tablet || images.mobile || '/images/placeholder.webp';
                if (width >= 768) return images.tablet || images.desktop || images.mobile || '/images/placeholder.webp';
                return images.mobile || images.tablet || images.desktop || '/images/placeholder.webp';
            }
            return images.desktop || '/images/placeholder.webp';
        }

        // 3. Last fallback
        return '/images/placeholder.webp';
    }

    getResponsiveImageFromObject(img: any): string {
        return this.getResponsiveImage(img);
    }
    ngOnDestroy(): void {
        if (this.timeouts.size > 0) {
            this.timeouts.forEach((timeout) => {
                clearTimeout(timeout);
            });
            this.timeouts.clear();
        }
    }
}
