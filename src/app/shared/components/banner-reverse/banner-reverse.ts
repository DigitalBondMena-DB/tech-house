import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ClientPartner } from '../../../core/models/home.model';

@Component({
  selector: 'app-banner-reverse',
  imports: [NgOptimizedImage],
  templateUrl: './banner-reverse.html',
  styleUrl: './banner-reverse.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BannerReverse {
  customClass = input<string>('');
  direction = input<'left' | 'right'>('left'); // 'left' for right-to-left, 'right' for left-to-right
  items = input<ClientPartner[]>([]); // Array of client/partner items
}
