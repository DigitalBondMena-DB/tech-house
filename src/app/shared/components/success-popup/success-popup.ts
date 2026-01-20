import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Input, output, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-success-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-popup.html',
  styleUrl: './success-popup.css'
})
export class SuccessPopup {
  isVisible = input<boolean>(false);
  title = input<string>('');
  message = input<string>('');
  buttonText = input<string>('العودة إلى الصفحة الرئيسية');
  close = output<void>();

  constructor(private router: Router) { }

  onClose(): void {
    this.close.emit();
  }

  onGoToHome(): void {
    this.router.navigate(['/']);
    this.onClose();
  }
}

