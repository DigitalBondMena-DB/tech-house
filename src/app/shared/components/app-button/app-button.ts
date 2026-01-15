import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-app-button',
  imports: [RouterLink],
  templateUrl: './app-button.html',
  styleUrl: './app-button.css'
})
export class AppButton {
  @Input() customClass: string = '';
  @Input() btnText: string = '';
  @Input() disabled: boolean = false;
  @Input() routerLink: string | null = null;
  @Output() buttonClick = new EventEmitter<void>();
  
  onClick() {
    if (!this.disabled) {
      this.buttonClick.emit();
    }
  }
}
