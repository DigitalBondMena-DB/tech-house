import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-app-button',
  imports: [RouterLink],
  templateUrl: './app-button.html',
  styleUrl: './app-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class AppButton {
  customClass = input<string>('');
  btnText = input<string>('');
  disabled = input<boolean>(false);
  routerLink = input<string | null>(null);
  buttonClick = output<void>();

  onClick() {
    if (!this.disabled()) {
      this.buttonClick.emit();
    }
  }
}
