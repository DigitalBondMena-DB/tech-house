import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-section-title',
  imports: [],
  templateUrl: './section-title.html',
  styleUrl: './section-title.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionTitle {
  title = input<string>('');
  customClass = input<string>('');
}
