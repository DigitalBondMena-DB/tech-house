import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 class="text-6xl font-bold text-[#ED2924] mb-4">404</h1>
      <h2 class="text-2xl font-semibold mb-6">عفواً، الصفحة غير موجودة!</h2>
      <p class="text-gray-600 mb-8">لم نتمكن من العثور على الصفحة أو المقالة التي تبحث عنها.</p>
      <a routerLink="/" class="px-8 py-3 bg-[#ED2924] text-white rounded-full hover:bg-[#B91C17] transition-colors">
        العودة للرئيسية
      </a>
    </div>
  `
})
export class NotFoundComponent {}
