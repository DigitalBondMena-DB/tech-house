import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-blog-article',
  standalone: true,
  template: `<div class="article-content" [innerHTML]="content()"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class BlogArticle {
  content = input.required<SafeHtml | null>();
}
