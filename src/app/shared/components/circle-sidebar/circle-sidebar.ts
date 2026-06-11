import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { SharedFeatureService } from '../../../core/services/sharedFeatureService';

@Component({
  selector: 'app-circle-sidebar',
  imports: [CommonModule],
  templateUrl: './circle-sidebar.html',
  styleUrl: './circle-sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CircleSidebar implements OnInit {
  private sharedFeatureService = inject(SharedFeatureService);

  contactUsData = this.sharedFeatureService.contactUsData;

  ngOnInit(): void {
    this.sharedFeatureService.loadContactUsData().subscribe();
  }

  getWhatsAppUrl(phoneNumber: string | undefined): string {
    if (!phoneNumber) return '#';
    const cleaned = phoneNumber.replace(/\D/g, '');
    return `https://wa.me/${cleaned}`;
  }
}

