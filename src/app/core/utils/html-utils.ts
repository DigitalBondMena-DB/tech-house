/**
 * Processes HTML content to add rel="noopener noreferrer nofollow" ONLY to external <a> anchor tags
 * (links that do NOT belong to techhouseksa.com domain).
 * This works on both Server-Side Rendering (SSR) and Client-Side Rendering (CSR).
 */
export function addRelToLinks(html: string): string {
  if (!html) return '';

  return html.replace(/<a\b([^>]*)>/gi, (match, attrs) => {
    // Extract href attribute value
    const hrefMatch = attrs.match(/href\s*=\s*["']?([^"'\s>]+)["']?/i);
    const href = hrefMatch ? hrefMatch[1] : '';

    // Check if the link is an external URL (starts with http://, https://, or // AND does not contain techhouseksa.com)
    const isExternal = /^(https?:)?\/\//i.test(href) && !/techhouseksa\.com/i.test(href);

    if (isExternal) {
      if (/rel\s*=\s*["']?[^"'>]*["']?/i.test(attrs)) {
        const newAttrs = attrs.replace(/rel\s*=\s*["']?[^"'>]*["']?/gi, 'rel="noopener noreferrer nofollow"');
        return `<a${newAttrs}>`;
      }
      return `<a${attrs} rel="noopener noreferrer nofollow">`;
    }

    // Internal links remain untouched
    return match;
  });
}
