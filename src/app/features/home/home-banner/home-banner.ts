import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-home-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-banner.html',
  styleUrl: './home-banner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeBanner {
  scrollTitle = input<string>('');
}
