import { Component, computed, inject, OnInit } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { SharedFeatureService } from '../../../core/services/sharedFeatureService';
import { BannerReverse } from '../../../shared/components/banner-reverse/banner-reverse';
import { Banner } from '../../../shared/components/banner/banner';
import { SectionTitle } from '../../../shared/components/section-title/section-title';

@Component({
  selector: 'app-home-banners-sec',
  imports: [SectionTitle, Banner, BannerReverse, SkeletonModule],
  templateUrl: './home-banners-sec.html',
  styleUrl: './home-banners-sec.css'
})
export class HomeBannersSec implements OnInit {
  private sharedFeatureService = inject(SharedFeatureService);

  //! section title data
  partenersTitle = "شركاؤنا";
  clientsTitle = "عملائنا";

  //! Get partners and clients from service
  partners = computed(() => this.sharedFeatureService.partners());
  clients = computed(() => this.sharedFeatureService.clients());

  ngOnInit(): void {
    // Load data - CSS animations start automatically when data is loaded
    this.sharedFeatureService.loadPartnersClients().subscribe();
  }
}
