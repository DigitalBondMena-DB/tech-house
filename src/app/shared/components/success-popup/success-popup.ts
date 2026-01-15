import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-success-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-popup.html',
  styleUrl: './success-popup.css'
})
export class SuccessPopup {
  @Input() isVisible: boolean = false;
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() buttonText: string = 'العودة إلى الصفحة الرئيسية';
  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) {}

  onClose(): void {
    this.close.emit();
  }

  onGoToHome(): void {
    this.router.navigate(['/']);
    this.onClose();
  }
}

