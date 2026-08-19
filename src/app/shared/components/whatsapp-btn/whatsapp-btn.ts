import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { SharedFeatureService } from '../../../core/services/sharedFeatureService';

@Component({
  selector: 'app-whatsapp-btn',
  imports: [CommonModule],
  templateUrl: './whatsapp-btn.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WhatsappBtn implements OnInit {
  private sharedFeatureService = inject(SharedFeatureService);

  contactUsData = this.sharedFeatureService.contactUsData;

  ngOnInit(): void {
    this.sharedFeatureService.loadContactUsData().subscribe();
  }

  getWhatsAppUrl(phoneNumber: string | undefined): string {
    if (!phoneNumber) return '#';
    if (phoneNumber.startsWith('http://') || phoneNumber.startsWith('https://')) {
      return phoneNumber;
    }
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned ? `https://wa.me/${cleaned}` : '#';
  }
}
