import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ClientPartner } from '../../../core/models/home.model';

@Component({
  selector: 'app-banner',
  imports: [NgOptimizedImage],
  templateUrl: './banner.html',
  styleUrl: './banner.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Banner {
  customClass = input<string>('');
  direction = input<'left' | 'right'>('left'); // 'left' for right-to-left, 'right' for left-to-right
  items = input<ClientPartner[]>([]); // Array of client/partner items
}