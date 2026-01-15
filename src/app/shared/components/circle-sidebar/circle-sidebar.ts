import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { SharedFeatureService } from '../../../core/services/sharedFeatureService';

@Component({
  selector: 'app-circle-sidebar',
  imports: [CommonModule],
  templateUrl: './circle-sidebar.html',
  styleUrl: './circle-sidebar.css',
  standalone: true
})
export class CircleSidebar implements OnInit, AfterViewInit {
  private sharedFeatureService = inject(SharedFeatureService);

  // Contact Us Data from API
  contactUsData = this.sharedFeatureService.contactUsData;

  ngOnInit(): void {
    // Load data in ngOnInit (runs on both server and client)
    // Note: This may be called from other components as well, but service has guard to prevent duplicate calls
    // Subscribe to Observable - data will be set in signal automatically
    this.sharedFeatureService.loadContactUsData().subscribe();
  }

  ngAfterViewInit(): void {
    // View initialization logic (if needed)
  }

  // Helper method to format WhatsApp URL
  getWhatsAppUrl(phoneNumber: string | undefined): string {
    if (!phoneNumber) return '#';
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    // Format as WhatsApp URL
    return `https://wa.me/${cleaned}`;
  }
}

